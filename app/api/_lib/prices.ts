import { inArray, sql } from "drizzle-orm";
import { db, schema } from "./db.js";
import { round2 } from "./money.js";

/* ---------------------------------------------------------------------------
   Quotes.

   The UI promises "prices delayed 15 min", so that is exactly what this does:
   a quote is served from the Postgres cache until it is 15 minutes old, then
   refetched. That keeps the promise honest and keeps us far inside Finnhub's
   free-tier rate limit.

   Two adapters behind one interface. Without FINNHUB_API_KEY the simulated
   adapter runs, so the whole stack — trading, valuation, the race — works
   end to end before any third-party account exists. Swapping to real prices
   is an env var, not a code change.
--------------------------------------------------------------------------- */

export type Quote = {
  symbol: string;
  /** Latest (delayed) price. */
  price: number;
  /** Previous session's close, which is what the day's % change is measured against. */
  prevClose: number;
  fetchedAt: Date;
};

export const CACHE_TTL_MS = 15 * 60 * 1000;

export const usingRealPrices = () => Boolean(process.env.FINNHUB_API_KEY);

interface Provider {
  fetch(symbols: string[]): Promise<Map<string, { price: number; prevClose: number }>>;
}

/** https://finnhub.io/docs/api/quote — `c` current, `pc` previous close. */
const finnhub: Provider = {
  async fetch(symbols) {
    const key = process.env.FINNHUB_API_KEY!;
    const out = new Map<string, { price: number; prevClose: number }>();

    // Finnhub quotes one symbol per request; a handful in parallel is fine at
    // 60 req/min, and the 15-minute cache means this runs rarely.
    await Promise.all(
      symbols.map(async (symbol) => {
        const res = await fetch(
          `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${key}`,
          { signal: AbortSignal.timeout(8000) }
        );
        if (!res.ok) throw new Error(`finnhub ${res.status} for ${symbol}`);
        const j = (await res.json()) as { c?: number; pc?: number };
        // Finnhub returns c=0 for symbols it doesn't cover rather than an error.
        if (!j.c || !j.pc) return;
        out.set(symbol, { price: j.c, prevClose: j.pc });
      })
    );
    return out;
  },
};

/**
 * Deterministic pseudo-market: each symbol has a base price and walks a smooth,
 * seeded path, so prices move believably between refreshes and are identical
 * for every player at a given minute — nobody gets a different fill than a
 * rival for the same trade.
 */
const simulated: Provider = {
  async fetch(symbols) {
    const out = new Map<string, { price: number; prevClose: number }>();
    const now = Date.now();
    const day = Math.floor(now / 86_400_000);
    const bucket = Math.floor(now / CACHE_TTL_MS);

    for (const symbol of symbols) {
      const base = BASE_PRICES[symbol] ?? seededBase(symbol);
      const prevClose = round2(base * (1 + wobble(`${symbol}:${day - 1}`) * 0.06));
      const price = round2(prevClose * (1 + wobble(`${symbol}:${bucket}`) * 0.05));
      out.set(symbol, { price, prevClose });
    }
    return out;
  },
};

/** Rough real-world prices so the simulated feed looks sane next to the design. */
const BASE_PRICES: Record<string, number> = {
  NVDA: 172.4, AMD: 196.1, AAPL: 216.9, MSFT: 428.5, TSLA: 218.6,
  RBLX: 41.2, NKE: 74.1, SBUX: 88.4, DIS: 96.3, NTDOY: 18.7,
  SPY: 473.8, VOO: 435.2, QQQ: 402.6, ABNB: 132.4, SHOP: 78.9,
};

/** Hash a string to [-1, 1] — same input, same output, forever. */
function wobble(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) / 0xffffffff) * 2 - 1;
}

const seededBase = (symbol: string) => round2(40 + Math.abs(wobble(symbol)) * 260);

const provider = (): Provider => (usingRealPrices() ? finnhub : simulated);

/**
 * Quotes for the given symbols, refreshing only what has gone stale.
 * Never throws on a provider failure — a stale cached price beats a broken
 * portfolio screen, and the UI already tells the player prices are delayed.
 */
export async function getQuotes(symbols: string[]): Promise<Map<string, Quote>> {
  const wanted = [...new Set(symbols.map((s) => s.toUpperCase()))];
  if (wanted.length === 0) return new Map();

  const d = db();
  const cached = await d
    .select()
    .from(schema.quotes)
    .where(inArray(schema.quotes.symbol, wanted));

  const bySymbol = new Map<string, Quote>();
  for (const row of cached) {
    bySymbol.set(row.symbol, {
      symbol: row.symbol,
      price: Number(row.price),
      prevClose: Number(row.prevClose),
      fetchedAt: row.fetchedAt,
    });
  }

  let refreshed = new Set<string>();

  const now = Date.now();
  const stale = wanted.filter((s) => {
    const hit = bySymbol.get(s);
    return !hit || now - hit.fetchedAt.getTime() > CACHE_TTL_MS;
  });

  if (stale.length > 0) {
    try {
      const fresh = await provider().fetch(stale);
      const rows = [...fresh.entries()].map(([symbol, q]) => ({
        symbol,
        price: String(q.price),
        prevClose: String(q.prevClose),
        fetchedAt: new Date(),
      }));
      if (rows.length > 0) {
        await d
          .insert(schema.quotes)
          .values(rows)
          .onConflictDoUpdate({
            target: schema.quotes.symbol,
            set: {
              price: sql`excluded.price`,
              prevClose: sql`excluded.prev_close`,
              fetchedAt: sql`excluded.fetched_at`,
            },
          });
      }
      for (const [symbol, q] of fresh) {
        bySymbol.set(symbol, { symbol, ...q, fetchedAt: new Date() });
      }
      refreshed = new Set(fresh.keys());
    } catch (err) {
      // Serve what we have. A stale price is a better answer than an error page.
      console.error("quote refresh failed, serving cache:", err);
    }
  }

  await recordHistory(bySymbol, refreshed);
  return bySymbol;
}

/**
 * Append what we just saw to the price series.
 *
 * A symbol with no history yet is backfilled from the quote in hand: its
 * previous close, stamped at the last US market close, and its current price.
 * Both are real published numbers, so a chart drawn the first time anyone opens
 * a stock has a real segment in it rather than nothing — and every sample after
 * that is one this app observed live. Waiting for the 15-minute cache to expire
 * instead would leave the screen blank for the first quarter of an hour.
 */
async function recordHistory(served: Map<string, Quote>, refreshed: Set<string>) {
  if (served.size === 0) return;
  const d = db();
  const symbols = [...served.keys()];

  const seen = await d
    .selectDistinct({ symbol: schema.priceHistory.symbol })
    .from(schema.priceHistory)
    .where(inArray(schema.priceHistory.symbol, symbols));
  const known = new Set(seen.map((r) => r.symbol));

  const rows: { symbol: string; price: string; at: Date }[] = [];
  for (const [symbol, q] of served) {
    if (!known.has(symbol)) {
      rows.push({ symbol, price: String(q.prevClose), at: lastMarketClose(q.fetchedAt) });
      rows.push({ symbol, price: String(q.price), at: q.fetchedAt });
    } else if (refreshed.has(symbol)) {
      rows.push({ symbol, price: String(q.price), at: q.fetchedAt });
    }
  }
  if (rows.length > 0) await d.insert(schema.priceHistory).values(rows);
}

/** 4pm New York on the last weekday before now, as a UTC instant. */
function lastMarketClose(now: Date) {
  const close = new Date(now);
  close.setUTCHours(20, 0, 0, 0); // 16:00 ET during daylight time
  if (close >= now) close.setUTCDate(close.getUTCDate() - 1);
  while (close.getUTCDay() === 0 || close.getUTCDay() === 6) {
    close.setUTCDate(close.getUTCDate() - 1);
  }
  return close;
}

export const dayChange = (q: Quote) => (q.price - q.prevClose) / q.prevClose;
