import { db, schema } from "./_lib/db.js";
import { oneOf, requirePlayer, route } from "./_lib/http.js";
import { pct } from "./_lib/money.js";
import { periodReturn, periodStart, valuePlayer, type Period } from "./_lib/valuation.js";

const PERIOD_LABEL: Record<Period, string> = {
  month: "month",
  quarter: "quarter",
  year: "year",
};

/** Days left in the period — the "February ends in 19 days" line. */
function daysLeft(period: Period, now = new Date()) {
  const start = new Date(`${periodStart(period, now)}T00:00:00Z`);
  const end = new Date(start);
  if (period === "month") end.setUTCMonth(end.getUTCMonth() + 1);
  else if (period === "quarter") end.setUTCMonth(end.getUTCMonth() + 3);
  else end.setUTCFullYear(end.getUTCFullYear() + 1);
  return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86_400_000));
}

export default route("GET", async (req) => {
  const playerId = requirePlayer(req);
  const period = oneOf(req.query.period, ["month", "quarter", "year"] as const, "month");

  const players = await db().select().from(schema.players);

  const scored = await Promise.all(
    players.map(async (p) => {
      const stack = await valuePlayer(p.id);
      const ret = await periodReturn(p.id, period as Period, stack.total);
      return {
        id: p.id,
        name: p.name,
        initials: p.initials,
        you: p.id === playerId,
        return: ret,
        returnLabel: pct(ret, 0),
      };
    })
  );

  scored.sort((a, b) => b.return - a.return);
  const ranked = scored.map((s, i) => ({ ...s, rank: i + 1 }));
  const me = ranked.find((r) => r.you);
  const now = new Date();

  return {
    period,
    subtitle: `Highest % gain · this ${PERIOD_LABEL[period]} ends in ${daysLeft(
      period as Period,
      now
    )} days · ${players.length} players`,
    monthLabel: now.toLocaleString("en-US", { month: "long", timeZone: "UTC" }).toUpperCase(),
    podium: ranked.slice(0, 3),
    rest: ranked.slice(3, 8),
    you: me
      ? {
          ...me,
          // What it takes to crack the visible board.
          gapLabel:
            me.rank > 3
              ? `Beat ${ranked[2].returnLabel} to crack the podium`
              : "You're on the podium",
        }
      : null,
  };
});
