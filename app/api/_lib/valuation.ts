import { and, desc, eq, lte, sql } from "drizzle-orm";
import { db, schema } from "./db.js";
import { round2, toNum } from "./money.js";
import { dayChange, getQuotes } from "./prices.js";
import { STARTING_STACK } from "./game.js";

/* ---------------------------------------------------------------------------
   Valuation.

   The rules the design settled on:
   - The stack never resets. Total dollars are a vanity metric that rewards
     playing early.
   - Competition is on % gain for the month, quarter or year — so every period
     needs a baseline value, which is what the snapshot table is for.
--------------------------------------------------------------------------- */

export type Period = "month" | "quarter" | "year";

export type PositionView = {
  symbol: string;
  name: string;
  badge: string;
  role: string;
  shares: number;
  price: number;
  value: number;
  costBasis: number;
  /** Day change, i.e. against yesterday's close. */
  dayChange: number;
  /** Weight in the invested portion, 0–1. */
  weight: number;
};

export type StackView = {
  cash: number;
  invested: number;
  total: number;
  dayChange: number;
  dayChangeValue: number;
  positions: PositionView[];
};

/** Current value of a player's portfolio, priced from the quote cache. */
export async function valuePlayer(playerId: number): Promise<StackView> {
  const d = db();

  const [player] = await d.select().from(schema.players).where(eq(schema.players.id, playerId));
  if (!player) throw new Error(`no player ${playerId}`);

  const rows = await d
    .select({
      symbol: schema.holdings.symbol,
      shares: schema.holdings.shares,
      costBasis: schema.holdings.costBasis,
      name: schema.instruments.name,
      badge: schema.instruments.badge,
      role: schema.instruments.role,
    })
    .from(schema.holdings)
    .innerJoin(schema.instruments, eq(schema.instruments.symbol, schema.holdings.symbol))
    .where(eq(schema.holdings.playerId, playerId));

  const quotes = await getQuotes(rows.map((r) => r.symbol));
  const cash = toNum(player.cash);

  let invested = 0;
  let prevInvested = 0;

  const priced = rows.map((r) => {
    const shares = toNum(r.shares);
    const q = quotes.get(r.symbol);
    const price = q?.price ?? 0;
    const value = round2(shares * price);
    invested += value;
    prevInvested += shares * (q?.prevClose ?? price);
    return {
      symbol: r.symbol,
      name: r.name,
      badge: r.badge,
      role: r.role,
      shares,
      price,
      value,
      costBasis: toNum(r.costBasis),
      dayChange: q ? dayChange(q) : 0,
      weight: 0,
    };
  });

  invested = round2(invested);
  const total = round2(cash + invested);

  // Weights are of the invested portion — cash isn't a position.
  for (const p of priced) p.weight = invested > 0 ? p.value / invested : 0;
  priced.sort((a, b) => b.value - a.value);

  // The day's move is the holdings' move; cash doesn't change with the market.
  const dayChangeValue = round2(invested - prevInvested);
  const prevTotal = cash + prevInvested;

  return {
    cash,
    invested,
    total,
    dayChangeValue,
    dayChange: prevTotal > 0 ? (total - prevTotal) / prevTotal : 0,
    positions: priced,
  };
}

/** Inclusive start date of the current month, quarter or year, as YYYY-MM-DD. */
export function periodStart(period: Period, now = new Date()): string {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const startMonth = period === "month" ? m : period === "quarter" ? Math.floor(m / 3) * 3 : 0;
  return new Date(Date.UTC(y, startMonth, 1)).toISOString().slice(0, 10);
}

export const today = (now = new Date()) => now.toISOString().slice(0, 10);

/**
 * What the current period is called, for the chip beside THE RACE.
 * Months read as their own name, quarters as Q1–Q4, years as a fiscal year —
 * the seasons are calendar-aligned, so FY is simply the calendar year.
 */
export function periodLabel(period: Period, now = new Date()): string {
  if (period === "month") {
    return now.toLocaleString("en-US", { month: "long", timeZone: "UTC" }).toUpperCase();
  }
  if (period === "quarter") {
    return `Q${Math.floor(now.getUTCMonth() / 3) + 1}`;
  }
  return `FY${now.getUTCFullYear()}`;
}

/**
 * Record today's value so tomorrow has a baseline. Called on portfolio reads —
 * cheap, idempotent, and it means the history builds itself without a cron job.
 */
export async function recordSnapshot(playerId: number, total: number) {
  await db()
    .insert(schema.snapshots)
    .values({ playerId, asOf: today(), totalValue: String(total), seeded: "false" })
    .onConflictDoUpdate({
      target: [schema.snapshots.playerId, schema.snapshots.asOf],
      set: { totalValue: sql`excluded.total_value`, seeded: sql`'false'` },
    });
}

/**
 * % return for the period: today's value against the last snapshot on or
 * before the period's first day. Falls back to the player's earliest snapshot
 * when they joined mid-period, so a new player isn't credited with the whole
 * period's gain.
 */
export async function periodReturn(playerId: number, period: Period, total: number) {
  const d = db();
  const start = periodStart(period);

  const [atStart] = await d
    .select({ v: schema.snapshots.totalValue })
    .from(schema.snapshots)
    .where(and(eq(schema.snapshots.playerId, playerId), lte(schema.snapshots.asOf, start)))
    .orderBy(desc(schema.snapshots.asOf))
    .limit(1);

  let baseline = toNum(atStart?.v);

  if (!baseline) {
    const [earliest] = await d
      .select({ v: schema.snapshots.totalValue })
      .from(schema.snapshots)
      .where(eq(schema.snapshots.playerId, playerId))
      .orderBy(schema.snapshots.asOf)
      .limit(1);
    baseline = toNum(earliest?.v);
  }

  if (!baseline) return 0;
  return (total - baseline) / baseline;
}

/**
 * Consecutive days ending today on which the player actually opened the app.
 * Snapshots are written on every portfolio read, and seeded history is flagged,
 * so a non-seeded snapshot per day is a genuine record of showing up — the
 * streak is earned, not decorative.
 */
export async function streak(playerId: number) {
  const rows = await db()
    .select({ asOf: schema.snapshots.asOf })
    .from(schema.snapshots)
    .where(and(eq(schema.snapshots.playerId, playerId), eq(schema.snapshots.seeded, "false")))
    .orderBy(desc(schema.snapshots.asOf))
    .limit(400);

  const days = new Set(rows.map((r) => r.asOf));
  let count = 0;
  const cursor = new Date();

  // A streak that hasn't been continued *today* is still alive until tomorrow,
  // so start counting from today and allow the first day to be missing.
  for (let i = 0; i < 400; i++) {
    const key = cursor.toISOString().slice(0, 10);
    if (days.has(key)) count++;
    else if (i > 0) break;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return count;
}

/** Level from lifetime profit — a milestone ladder, not an arbitrary counter. */
export function level(total: number) {
  const profit = Math.max(0, total - STARTING_STACK);
  return Math.min(50, 1 + Math.floor(Math.sqrt(profit / 4000)));
}

/** The daily value series that draws the race lines. */
export async function series(playerId: number, period: Period) {
  const rows = await db()
    .select({ asOf: schema.snapshots.asOf, v: schema.snapshots.totalValue })
    .from(schema.snapshots)
    .where(and(eq(schema.snapshots.playerId, playerId), sql`${schema.snapshots.asOf} >= ${periodStart(period)}`))
    .orderBy(schema.snapshots.asOf);

  return rows.map((r) => ({ asOf: r.asOf, value: toNum(r.v) }));
}

/**
 * Every portfolio snapshot for the player, in order — the folio growth chart.
 * Always ends on `total` (today's live value). If we only have one reading yet,
 * seeds the series from the opening stack so the line still has a real start.
 */
export async function growthSeries(playerId: number, total: number) {
  const rows = await db()
    .select({ v: schema.snapshots.totalValue })
    .from(schema.snapshots)
    .where(eq(schema.snapshots.playerId, playerId))
    .orderBy(schema.snapshots.asOf);

  const values = rows.map((r) => toNum(r.v)).filter((v) => v > 0);
  if (values.length === 0) return [STARTING_STACK, total];
  if (values.length === 1) {
    const only = values[0]!;
    // Brand-new account: show join → now rather than a single dot.
    if (Math.abs(only - STARTING_STACK) < 0.01) return [STARTING_STACK, total];
    return [STARTING_STACK, only === total ? only : total].filter(
      (v, i, arr) => i === 0 || v !== arr[i - 1]
    );
  }
  if (Math.abs(values[values.length - 1]! - total) > 0.01) values.push(total);
  return values;
}
