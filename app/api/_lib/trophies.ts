import { and, eq, gte, sql } from "drizzle-orm";
import { db, schema } from "./db.js";
import { pct, toNum, usd } from "./money.js";
import { streak } from "./valuation.js";
import type { StackView } from "./valuation.js";

/**
 * Trophies, computed from what the database can actually prove.
 *
 * The design mocked up 34. Most of them depend on systems that don't exist yet
 * — duels won, referrals, finished seasons — and inventing those would be the
 * same mistake as a decorative streak. These eight are the ones real data
 * supports today; more arrive with the features behind them.
 *
 * Shared by /api/profile (the full room) and /api/portfolio (just the count,
 * for the badge on the avatar) so the two can never disagree.
 */
export type Trophy = {
  id: string;
  title: string;
  icon: string;
  role: string;
  earned: boolean;
  meta: string;
};

export async function evaluateTrophies(playerId: number, stack: StackView): Promise<Trophy[]> {
  const d = db();
  const profit = stack.total - 1_000_000;

  const [{ trades = 0 } = {}] = await d
    .select({ trades: sql<number>`count(*)::int` })
    .from(schema.orders)
    .where(eq(schema.orders.playerId, playerId));

  const [{ sectors = 0 } = {}] = await d
    .select({ sectors: sql<number>`count(distinct ${schema.instruments.sector})::int` })
    .from(schema.holdings)
    .innerJoin(schema.instruments, eq(schema.instruments.symbol, schema.holdings.symbol))
    .where(eq(schema.holdings.playerId, playerId));

  const weekAgo = new Date();
  weekAgo.setUTCDate(weekAgo.getUTCDate() - 7);
  const [weekBase] = await d
    .select({ v: schema.snapshots.totalValue })
    .from(schema.snapshots)
    .where(
      and(
        eq(schema.snapshots.playerId, playerId),
        gte(schema.snapshots.asOf, weekAgo.toISOString().slice(0, 10))
      )
    )
    .orderBy(schema.snapshots.asOf)
    .limit(1);
  const weekReturn = weekBase ? (stack.total - toNum(weekBase.v)) / toNum(weekBase.v) : 0;

  const days = await streak(playerId);

  const best = stack.positions.reduce(
    (acc, p) => {
      const gain = p.costBasis > 0 ? (p.value - p.costBasis) / p.costBasis : 0;
      return gain > acc.gain ? { gain, name: p.name } : acc;
    },
    { gain: 0, name: "" }
  );

  return [
    { id: "first-trade", title: "First Play", icon: "ph-fill ph-rocket-launch", role: "cyan",
      earned: trades >= 1, meta: trades >= 1 ? `${trades} total` : "Make one trade" },
    { id: "ten-trades", title: "Ten Plays", icon: "ph-fill ph-lightning", role: "magenta",
      earned: trades >= 10, meta: trades >= 10 ? `${trades} total` : `${Math.max(0, 10 - trades)} to go` },
    { id: "first-10k", title: "First 10K", icon: "ph-fill ph-coins", role: "gold",
      earned: profit >= 10_000, meta: profit >= 10_000 ? `${usd(profit)} profit` : `${usd(Math.max(0, 10_000 - profit))} to go` },
    { id: "first-100k", title: "First 100K", icon: "ph-fill ph-trophy", role: "gold",
      earned: profit >= 100_000, meta: profit >= 100_000 ? `${usd(profit)} profit` : `${usd(Math.max(0, 100_000 - profit))} to go` },
    { id: "week-10", title: "+10% Week", icon: "ph-fill ph-chart-line-up", role: "green",
      earned: weekReturn >= 0.1, meta: `${pct(weekReturn)} this week` },
    { id: "diversified", title: "Diversified", icon: "ph-fill ph-squares-four", role: "cyan",
      earned: sectors >= 5, meta: sectors >= 5 ? `${sectors} sectors` : `${sectors} of 5 sectors` },
    { id: "streak-10", title: "10-Day Streak", icon: "ph-fill ph-flame", role: "gold",
      earned: days >= 10, meta: days >= 10 ? "Active now" : `Day ${days} of 10` },
    { id: "big-winner", title: "Big Winner", icon: "ph-fill ph-medal", role: "ice",
      earned: best.gain >= 0.2, meta: best.name ? `${best.name} ${pct(best.gain)}` : "Hold a winner up 20%" },
  ];
}
