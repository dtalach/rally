/**
 * Seeds the test crew.
 *
 * Honest note about the history: these accounts didn't exist last quarter, so
 * the daily snapshots before today are *generated* — each player walks a seeded
 * path from their starting stack to their current one. Everything from the
 * moment you run this forward is real: real quotes, real orders, real
 * revaluation. The generated rows are marked `seeded = 'true'` so they can be
 * told apart, and dropped once there's genuine history.
 *
 * Run it with `npm run db:seed`, or once against a deployment via /api/setup.
 */
import { sql } from "drizzle-orm";
import { db, schema } from "./db";
import { hashPin } from "./session";
import { getQuotes } from "./prices";
import { round2, round6 } from "./money";

const INSTRUMENTS = [
  { symbol: "NVDA", name: "NVIDIA", kind: "stock", sector: "Chips", blurb: "Chips · most traded on Rally", badge: "NV", role: "cyan" },
  { symbol: "AMD", name: "AMD", kind: "stock", sector: "Chips", blurb: "Chips · crushing earnings", badge: "AM", role: "green" },
  { symbol: "AAPL", name: "Apple", kind: "stock", sector: "Tech", blurb: "Tech · the phone in your hand", badge: "AP", role: "gold" },
  { symbol: "MSFT", name: "Microsoft", kind: "stock", sector: "Tech", blurb: "Tech · Xbox, Windows, cloud", badge: "MS", role: "cyan" },
  { symbol: "TSLA", name: "Tesla", kind: "stock", sector: "Cars", blurb: "Cars · big swings", badge: "TS", role: "ice" },
  { symbol: "RBLX", name: "Roblox", kind: "stock", sector: "Gaming", blurb: "Gaming · Maya + 2 own it", badge: "RB", role: "magenta" },
  { symbol: "NKE", name: "Nike", kind: "stock", sector: "Sneakers", blurb: "Sneakers · the swoosh", badge: "NK", role: "ice" },
  { symbol: "SBUX", name: "Starbucks", kind: "stock", sector: "Food", blurb: "Food · your morning order", badge: "SB", role: "green" },
  { symbol: "DIS", name: "Disney", kind: "stock", sector: "Media", blurb: "Media · parks, Marvel, streaming", badge: "DS", role: "magenta" },
  { symbol: "ABNB", name: "Airbnb", kind: "stock", sector: "Travel", blurb: "Travel · every trip you've taken", badge: "AB", role: "magenta" },
  { symbol: "SHOP", name: "Shopify", kind: "stock", sector: "Tech", blurb: "Tech · the shops you buy from", badge: "SH", role: "green" },
  { symbol: "SPY", name: "S&P 500 ETF", kind: "etf", sector: "ETF", blurb: "ETF · the whole market in one buy", badge: "SP", role: "green" },
  { symbol: "VOO", name: "Vanguard S&P 500", kind: "etf", sector: "ETF", blurb: "ETF · steady starter", badge: "VO", role: "cyan" },
  { symbol: "QQQ", name: "Nasdaq 100 ETF", kind: "etf", sector: "ETF", blurb: "ETF · the big tech basket", badge: "QQ", role: "gold" },
];

/** PINs are printed at the end — these are throwaway test accounts. */
const CREW = [
  { handle: "jordan", name: "Jordan", initials: "JD", pin: "1234", cash: 527830, start: 1_000_000,
    holdings: [["NVDA", 208200], ["SPY", 146900], ["AAPL", 104100], ["RBLX", 79600], ["TSLA", 44700], ["NKE", 28900]] },
  { handle: "maya", name: "Maya R.", initials: "MR", pin: "2345", cash: 310400, start: 1_000_000,
    holdings: [["NVDA", 402000], ["AMD", 288000], ["RBLX", 120000], ["QQQ", 89600]] },
  { handle: "dev", name: "Dev N.", initials: "DN", pin: "3456", cash: 612000, start: 1_000_000,
    holdings: [["AAPL", 180000], ["MSFT", 160000], ["SPY", 98000], ["DIS", 40000]] },
  { handle: "kai", name: "Kai L.", initials: "KL", pin: "4567", cash: 148000, start: 1_000_000,
    holdings: [["AMD", 340000], ["SHOP", 220000], ["ABNB", 180000], ["NVDA", 160000], ["SBUX", 92000]] },
] as const;

const DAYS_OF_HISTORY = 120;

/** Same deterministic wobble the simulated feed uses, so curves look related. */
function wobble(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) / 0xffffffff) * 2 - 1;
}

export async function seed(log: (m: string) => void = console.log) {
  const d = db();

  log("instruments…");
  await d
    .insert(schema.instruments)
    .values(INSTRUMENTS)
    .onConflictDoUpdate({
      target: schema.instruments.symbol,
      set: {
        name: sql`excluded.name`,
        blurb: sql`excluded.blurb`,
        badge: sql`excluded.badge`,
        role: sql`excluded.role`,
        sector: sql`excluded.sector`,
        kind: sql`excluded.kind`,
      },
    });

  // Price everything once so holdings are share counts, not dollar guesses.
  const quotes = await getQuotes(INSTRUMENTS.map((i) => i.symbol));
  log(`priced ${quotes.size}/${INSTRUMENTS.length} symbols`);

  for (const p of CREW) {
    log(`player ${p.handle}…`);
    const [player] = await d
      .insert(schema.players)
      .values({
        handle: p.handle,
        name: p.name,
        initials: p.initials,
        pinHash: hashPin(p.pin),
        cash: String(p.cash),
      })
      .onConflictDoUpdate({
        target: schema.players.handle,
        set: { name: sql`excluded.name`, cash: sql`excluded.cash` },
      })
      .returning();

    // Rebuild holdings from scratch so re-running the seed is idempotent.
    await d.delete(schema.holdings).where(sql`${schema.holdings.playerId} = ${player.id}`);

    let invested = 0;
    for (const [symbol, targetValue] of p.holdings) {
      const q = quotes.get(symbol);
      if (!q) {
        log(`  no quote for ${symbol}, skipping`);
        continue;
      }
      const shares = round6(targetValue / q.price);
      invested += round2(shares * q.price);
      await d.insert(schema.holdings).values({
        playerId: player.id,
        symbol,
        shares: String(shares),
        // Bought somewhere below today's price — gives a plausible unrealised gain.
        costBasis: String(round2(targetValue * (0.86 + Math.abs(wobble(`${p.handle}${symbol}`)) * 0.1))),
      });
    }

    const total = round2(p.cash + invested);

    // Generated history: walk from the starting stack to today's value.
    const rows = [];
    for (let i = DAYS_OF_HISTORY; i >= 1; i--) {
      const t = 1 - i / DAYS_OF_HISTORY;
      const drift = p.start + (total - p.start) * t;
      const noise = wobble(`${p.handle}:${i}`) * 0.012 * drift;
      const day = new Date();
      day.setUTCDate(day.getUTCDate() - i);
      rows.push({
        playerId: player.id,
        asOf: day.toISOString().slice(0, 10),
        totalValue: String(round2(drift + noise)),
        seeded: "true",
      });
    }
    rows.push({
      playerId: player.id,
      asOf: new Date().toISOString().slice(0, 10),
      totalValue: String(total),
      seeded: "false",
    });

    await d.delete(schema.snapshots).where(sql`${schema.snapshots.playerId} = ${player.id}`);
    await d.insert(schema.snapshots).values(rows);

    log(`  cash $${p.cash.toLocaleString()} + invested $${invested.toLocaleString()} = $${total.toLocaleString()}`);
  }

  log("Sign in with:");
  for (const p of CREW) log(`  ${p.name.padEnd(10)} PIN ${p.pin}`);

  return CREW.map((p) => ({ name: p.name, handle: p.handle }));
}
