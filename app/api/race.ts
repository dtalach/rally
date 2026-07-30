import { db, schema } from "./_lib/db.js";
import { oneOf, requirePlayer, route } from "./_lib/http.js";
import { pct, usdCompact } from "./_lib/money.js";
import {
  periodLabel,
  periodReturn,
  recordSnapshot,
  series,
  streak,
  valuePlayer,
  type Period,
} from "./_lib/valuation.js";

/**
 * The race: everyone's % return over the period, plus the daily series that
 * draws the lines. Winning is always on percentage gain, never on stack size,
 * so an early joiner's bigger pile is a vanity number here.
 */
export default route("GET", async (req) => {
  const playerId = requirePlayer(req);
  const period = oneOf(req.query.period, ["month", "quarter", "year"] as const, "month");

  const players = await db().select().from(schema.players).orderBy(schema.players.id);
  const me = await streak(playerId);

  const standings = await Promise.all(
    players.map(async (p) => {
      const stack = await valuePlayer(p.id);
      // Snapshot everyone we just priced: the chart's final point and the row's
      // figure are the same number, so they must not disagree.
      await recordSnapshot(p.id, stack.total);
      const ret = await periodReturn(p.id, period as Period, stack.total);
      const points = await series(p.id, period as Period);
      return {
        id: p.id,
        name: p.name,
        initials: p.initials,
        you: p.id === playerId,
        total: stack.total,
        stackLabel: usdCompact(stack.total),
        return: ret,
        returnLabel: pct(ret),
        series: points.map((s) => s.value),
      };
    })
  );

  standings.sort((a, b) => b.return - a.return);

  // P1/P2/P3 are positions in this race, so they're assigned after sorting.
  // Cyan always marks you; the others take the rival colours in rank order.
  const rivalRoles = ["green", "magenta", "gold", "ice"];
  let rivalIndex = 0;

  return {
    period,
    label: periodLabel(period as Period),
    streak: me,
    standings: standings.map((s, i) => ({
      ...s,
      tag: `P${i + 1}`,
      role: s.you ? "cyan" : rivalRoles[rivalIndex++ % rivalRoles.length],
    })),
  };
});
