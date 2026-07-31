/**
 * Seeds the tradable universe.
 *
 * Instruments only — the players are real accounts now, created from the app's
 * signup screen with their own email and their own million. Nothing in this
 * file invents a portfolio, a history or a rival; a fresh database has stocks
 * to buy and nobody holding any of them.
 *
 * Run it with `npm run db:seed`, or once against a deployment via /api/setup.
 */
import { sql } from "drizzle-orm";
import { db, schema } from "./db.js";
import { getQuotes } from "./prices.js";

const INSTRUMENTS = [
  { symbol: "NVDA", name: "NVIDIA", kind: "stock", sector: "Chips", blurb: "Chips · most traded on Rally", badge: "NV", role: "cyan" },
  { symbol: "AMD", name: "AMD", kind: "stock", sector: "Chips", blurb: "Chips · crushing earnings", badge: "AM", role: "green" },
  { symbol: "AAPL", name: "Apple", kind: "stock", sector: "Tech", blurb: "Tech · the phone in your hand", badge: "AP", role: "gold" },
  { symbol: "MSFT", name: "Microsoft", kind: "stock", sector: "Tech", blurb: "Tech · Xbox, Windows, cloud", badge: "MS", role: "cyan" },
  { symbol: "TSLA", name: "Tesla", kind: "stock", sector: "Cars", blurb: "Cars · big swings", badge: "TS", role: "ice" },
  { symbol: "RBLX", name: "Roblox", kind: "stock", sector: "Gaming", blurb: "Gaming · the one you grew up on", badge: "RB", role: "magenta" },
  { symbol: "NKE", name: "Nike", kind: "stock", sector: "Sneakers", blurb: "Sneakers · the swoosh", badge: "NK", role: "ice" },
  { symbol: "SBUX", name: "Starbucks", kind: "stock", sector: "Food", blurb: "Food · your morning order", badge: "SB", role: "green" },
  { symbol: "DIS", name: "Disney", kind: "stock", sector: "Media", blurb: "Media · parks, Marvel, streaming", badge: "DS", role: "magenta" },
  { symbol: "ABNB", name: "Airbnb", kind: "stock", sector: "Travel", blurb: "Travel · every trip you've taken", badge: "AB", role: "magenta" },
  { symbol: "SHOP", name: "Shopify", kind: "stock", sector: "Tech", blurb: "Tech · the shops you buy from", badge: "SH", role: "green" },
  { symbol: "SPY", name: "S&P 500 ETF", kind: "etf", sector: "ETF", blurb: "ETF · the whole market in one buy", badge: "SP", role: "green" },
  { symbol: "VOO", name: "Vanguard S&P 500", kind: "etf", sector: "ETF", blurb: "ETF · steady starter", badge: "VO", role: "cyan" },
  { symbol: "QQQ", name: "Nasdaq 100 ETF", kind: "etf", sector: "ETF", blurb: "ETF · the big tech basket", badge: "QQ", role: "gold" },
];

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

  // Warm the quote cache so the first screen a new player sees has prices on
  // it rather than a spinner.
  const quotes = await getQuotes(INSTRUMENTS.map((i) => i.symbol));
  log(`priced ${quotes.size}/${INSTRUMENTS.length} symbols`);

  return { instruments: INSTRUMENTS.length, priced: quotes.size };
}
