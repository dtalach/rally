import { eq } from "drizzle-orm";
import { db, schema } from "./_lib/db.js";
import { requirePlayer, route } from "./_lib/http.js";
import { pct, signedUsd, usd } from "./_lib/money.js";
import { level, periodReturn, recordSnapshot, streak, valuePlayer } from "./_lib/valuation.js";

/**
 * Everything HOME and FOLIO need: the stack, the day's move, every position,
 * and the month return that drives the player's rank.
 */
export default route("GET", async (req) => {
  const playerId = requirePlayer(req);

  const [player] = await db()
    .select({ name: schema.players.name, initials: schema.players.initials })
    .from(schema.players)
    .where(eq(schema.players.id, playerId));

  const stack = await valuePlayer(playerId);
  await recordSnapshot(playerId, stack.total);

  const monthReturn = await periodReturn(playerId, "month", stack.total);
  const allTime = stack.total - 1_000_000;

  // Rank across the field on the same month return the leaderboard uses.
  const everyone = await db().select({ id: schema.players.id }).from(schema.players);
  const returns = await Promise.all(
    everyone.map(async (p) =>
      p.id === playerId
        ? monthReturn
        : periodReturn(p.id, "month", (await valuePlayer(p.id)).total)
    )
  );
  const rank = returns.filter((r) => r > monthReturn).length + 1;

  return {
    player,
    vitals: {
      level: level(stack.total),
      rank,
      streak: await streak(playerId),
      // Duels aren't backed yet — reported as zero rather than invented.
      duels: 0,
    },
    stack: {
      total: stack.total,
      totalLabel: usd(stack.total),
      cash: stack.cash,
      cashLabel: usd(stack.cash),
      invested: stack.invested,
      investedLabel: usd(stack.invested),
      allTimeLabel: `${signedUsd(allTime)} all-time (${pct(allTime / 1_000_000)})`,
      todayLabel: `Today ${signedUsd(stack.dayChangeValue)}`,
      dayChange: stack.dayChange,
      monthReturn,
      monthReturnLabel: pct(monthReturn),
    },
    positions: stack.positions.map((p) => ({
      symbol: p.symbol,
      name: p.name,
      badge: p.badge,
      role: p.role,
      shares: p.shares,
      sharesLabel: `${p.shares.toLocaleString("en-US", { maximumFractionDigits: 2 })} shares`,
      weightLabel: `${Math.round(p.weight * 100)}%`,
      weight: p.weight,
      valueLabel: usd(p.value),
      changeLabel: pct(p.dayChange),
      up: p.dayChange >= 0,
    })),
  };
});
