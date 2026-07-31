import { eq } from "drizzle-orm";
import { db, schema } from "./_lib/db.js";
import { requirePlayer, route } from "./_lib/http.js";
import { pct, usd } from "./_lib/money.js";
import { level, periodReturn, streak, valuePlayer } from "./_lib/valuation.js";
import { evaluateTrophies } from "./_lib/trophies.js";
import { STARTING_STACK } from "./_lib/game.js";

/**
 * The profile behind the avatar: who you are, and what you've actually earned.
 *
 * Every trophy here is computed from real data. The design mocked up 34 of
 * them, but most depend on systems that don't exist yet (duels, referrals,
 * completed seasons) — inventing those would be the same sin as a fake streak,
 * so only the ones the database can actually prove are listed. The rest arrive
 * when the features behind them do.
 */

const LEVEL_TITLES = [
  [1, "ROOKIE"],
  [4, "REGULAR"],
  [7, "CONTENDER"],
  [12, "SHARK"],
  [18, "LEGEND"],
] as const;

const titleFor = (lvl: number) =>
  [...LEVEL_TITLES].reverse().find(([min]) => lvl >= min)?.[1] ?? "ROOKIE";

/** Profit needed to reach a level, inverting level() = 1 + floor(sqrt(p/4000)). */
const profitForLevel = (lvl: number) => (lvl - 1) ** 2 * 4000;

export default route("GET", async (req) => {
  const playerId = requirePlayer(req);
  const d = db();

  const [player] = await d
    .select({
      name: schema.players.name,
      initials: schema.players.initials,
      joinedAt: schema.players.joinedAt,
    })
    .from(schema.players)
    .where(eq(schema.players.id, playerId));

  const stack = await valuePlayer(playerId);
  const profit = stack.total - STARTING_STACK;
  const lvl = level(stack.total);
  const days = await streak(playerId);
  const monthReturn = await periodReturn(playerId, "month", stack.total);

  // Rank across the field on the same month return the leaderboard uses.
  const everyone = await d.select({ id: schema.players.id }).from(schema.players);
  const returns = await Promise.all(
    everyone.map(async (p) =>
      p.id === playerId ? monthReturn : periodReturn(p.id, "month", (await valuePlayer(p.id)).total)
    )
  );
  const rank = returns.filter((r) => r > monthReturn).length + 1;

  const trophies = await evaluateTrophies(playerId, stack);

  const earned = trophies.filter((t) => t.earned);
  const nextLevelAt = profitForLevel(lvl + 1);
  const thisLevelAt = profitForLevel(lvl);
  const xpPct = Math.max(
    0,
    Math.min(100, Math.round(((profit - thisLevelAt) / (nextLevelAt - thisLevelAt)) * 100))
  );

  return {
    player,
    level: lvl,
    levelTitle: titleFor(lvl),
    xpPct,
    toNextLabel: `${usd(Math.max(0, nextLevelAt - profit))} of profit to LVL ${lvl + 1}`,
    rank,
    streak: days,
    // Not backed yet; reported as zero rather than invented.
    duels: 0,
    duelRecord: "—",
    crewSize: everyone.length,
    stackLabel: usd(stack.total),
    monthReturnLabel: pct(monthReturn),
    trophies,
    earnedCount: earned.length,
    totalCount: trophies.length,
  };
});
