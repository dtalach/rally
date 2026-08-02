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

/* ---------------------------------------------------------------------------
   History — the series behind the detail chart's 1D/1W/1M/1Y tabs.
--------------------------------------------------------------------------- */

export type HistoryRange = "1D" | "1W" | "1M" | "1Y";

export const HISTORY_RANGES = ["1D", "1W", "1M", "1Y"] as const;

/** Lookback, sample count, and the Finnhub candle resolution per range. */
const HISTORY_SPEC: Record<HistoryRange, { days: number; points: number; resolution: string }> = {
  "1D": { days: 1, points: 48, resolution: "15" },
  "1W": { days: 7, points: 42, resolution: "60" },
  "1M": { days: 30, points: 30, resolution: "D" },
  "1Y": { days: 365, points: 52, resolution: "W" },
};

/** https://finnhub.io/docs/api/stock-candles — `c` closes, `s` status. */
async function finnhubCandles(symbol: string, range: HistoryRange): Promise<number[]> {
  const key = process.env.FINNHUB_API_KEY!;
  const spec = HISTORY_SPEC[range];
  const to = Math.floor(Date.now() / 1000);
  const from = to - spec.days * 86_400;
  const res = await fetch(
    `https://finnhub.io/api/v1/stock/candle?symbol=${encodeURIComponent(symbol)}&resolution=${spec.resolution}&from=${from}&to=${to}&token=${key}`,
    { signal: AbortSignal.timeout(8000) }
  );
  if (!res.ok) throw new Error(`finnhub candle ${res.status} for ${symbol}`);
  const j = (await res.json()) as { s?: string; c?: number[] };
  if (j.s !== "ok" || !j.c || j.c.length < 2) throw new Error(`finnhub candle empty for ${symbol}`);
  return j.c.map(round2);
}

/**
 * Replays the same seeded walk the simulated quote provider uses, at points
 * spaced back through the range — so the series is exactly the prices players
 * actually traded at, and its last point is the current quote.
 */
function simulatedHistory(symbol: string, range: HistoryRange): number[] {
  const spec = HISTORY_SPEC[range];
  const base = BASE_PRICES[symbol] ?? seededBase(symbol);
  const now = Date.now();
  const out: number[] = [];
  for (let i = 0; i < spec.points; i++) {
    const t = now - spec.days * 86_400_000 * (1 - i / (spec.points - 1));
    const day = Math.floor(t / 86_400_000);
    const bucket = Math.floor(t / CACHE_TTL_MS);
    const prevClose = base * (1 + wobble(`${symbol}:${day - 1}`) * 0.06);
    out.push(round2(prevClose * (1 + wobble(`${symbol}:${bucket}`) * 0.05)));
  }
  return out;
}

/**
 * Price series for one chart range. Real candles when a Finnhub key is set;
 * otherwise (or if the candle endpoint is unavailable on the plan) the
 * simulated walk, scaled so the line ends at the price the screen shows.
 */
export async function priceHistory(
  symbol: string,
  range: HistoryRange,
  current?: Quote
): Promise<number[]> {
  if (usingRealPrices()) {
    try {
      return await finnhubCandles(symbol, range);
    } catch (err) {
      console.error(`candle fetch failed for ${symbol} ${range}, using synthetic series:`, err);
    }
  }
  const points = simulatedHistory(symbol, range);
  const last = points[points.length - 1];
  if (current && last > 0 && current.price !== last) {
    const scale = current.price / last;
    return points.map((v) => round2(v * scale));
  }
  return points;
}

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
    } catch (err) {
      // Serve what we have. A stale price is a better answer than an error page.
      console.error("quote refresh failed, serving cache:", err);
    }
  }

  return bySymbol;
}

export const dayChange = (q: Quote) => (q.price - q.prevClose) / q.prevClose;
