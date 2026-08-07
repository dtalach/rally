/* ---------------------------------------------------------------------------
   Client for the `/api` functions. One place that knows how to talk to the
   server, so screens deal in data rather than fetch plumbing.
--------------------------------------------------------------------------- */

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api/${path}`, {
      credentials: "same-origin",
      headers: init?.body ? { "content-type": "application/json" } : undefined,
      ...init,
    });
  } catch {
    throw new ApiError(0, "Can't reach Rally. Check your connection.");
  }

  const body = await res.json().catch(() => ({}) as Record<string, unknown>);
  if (!res.ok) {
    throw new ApiError(res.status, (body as { error?: string }).error ?? "Something went wrong.");
  }
  return body as T;
}

const get = <T,>(path: string) => call<T>(path);
const post = <T,>(path: string, body: unknown) =>
  call<T>(path, { method: "POST", body: JSON.stringify(body) });

/* ------------------------------- types --------------------------------- */

export type Player = { id: number; email: string; name: string; initials: string };

export type Vitals = {
  level: number;
  rank: number;
  streak: number;
  duels: number;
  trophies: number;
};

export type Position = {
  symbol: string;
  name: string;
  badge: string;
  role: string;
  shares: number;
  sharesLabel: string;
  weightLabel: string;
  weight: number;
  valueLabel: string;
  changeLabel: string;
  up: boolean;
};

export type Portfolio = {
  player: { name: string; initials: string };
  vitals: Vitals;
  stack: {
    total: number;
    totalLabel: string;
    cash: number;
    cashLabel: string;
    invested: number;
    investedLabel: string;
    allTimeLabel: string;
    todayLabel: string;
    dayChange: number;
    monthReturn: number;
    monthReturnLabel: string;
  };
  growth: {
    series: number[];
    changeLabel: string;
    up: boolean;
    totalLabel: string;
  };
  positions: Position[];
};

export type FeedPost = {
  id: number;
  name: string;
  initials: string;
  role: string;
  time: string;
  verb: string;
  amountLabel: string;
  side: string;
};

export type MarketRow = {
  symbol: string;
  name: string;
  badge: string;
  role: string;
  note: string;
  priceLabel: string;
  changeLabel: string;
  up: boolean;
};

export type QuoteDetail = {
  symbol: string;
  name: string;
  price: number;
  priceLabel: string;
  changeLabel: string;
  up: boolean;
  asOfLabel: string;
  balance: number;
  balanceLabel: string;
  position: {
    shares: number;
    sharesLabel: string;
    valueLabel: string;
    gainLabel: string;
    up: boolean;
  } | null;
  range: string;
  history: number[];
  /** Present when the window hasn't got two samples yet. */
  historyNote?: string;
};

export type Standing = {
  id: number;
  name: string;
  initials: string;
  you: boolean;
  tag: string;
  role: string;
  stackLabel: string;
  return: number;
  returnLabel: string;
  series: number[];
};

export type LeaderRow = {
  id: number;
  name: string;
  initials: string;
  you: boolean;
  rank: number;
  returnLabel: string;
  return: number;
};

export type Trophy = {
  id: string;
  title: string;
  icon: string;
  role: string;
  earned: boolean;
  meta: string;
};

export type Profile = {
  player: { name: string; initials: string };
  level: number;
  levelTitle: string;
  xpPct: number;
  toNextLabel: string;
  rank: number;
  streak: number;
  duels: number;
  duelRecord: string;
  crewSize: number;
  stackLabel: string;
  monthReturnLabel: string;
  trophies: Trophy[];
  earnedCount: number;
  totalCount: number;
};

export type Period = "month" | "quarter" | "year";

/* ------------------------------ endpoints ------------------------------- */

export const api = {
  me: () => get<{ player: Player | null; realPrices: boolean }>("me"),
  login: (email: string, password: string) =>
    post<{ player: Player }>("login", { email, password }),
  signup: (name: string, email: string, password: string) =>
    post<{ player: Player }>("signup", { name, email, password }),
  logout: () => post<{ ok: true }>("logout", {}),

  portfolio: () => get<Portfolio>("portfolio"),
  profile: () => get<Profile>("profile"),
  feed: () => get<{ newPlays: number; posts: FeedPost[] }>("feed"),
  market: (board: "gainers" | "losers" | "traded", q = "") =>
    get<{ board: string; rows: MarketRow[] }>(
      `market?board=${board}${q ? `&q=${encodeURIComponent(q)}` : ""}`
    ),
  quote: (symbol: string, range = "1D") =>
    get<QuoteDetail>(`quote?symbol=${encodeURIComponent(symbol)}&range=${range}`),
  /** Size the order in dollars, in shares, or with `all` — never all three. */
  trade: (order: {
    symbol: string;
    side: "buy" | "sell";
    amount?: number;
    shares?: number;
    all?: boolean;
  }) =>
    post<{
      ok: true;
      side: string;
      name: string;
      amountLabel: string;
      sharesLabel: string;
      cashAfter: number;
    }>("trade", order),

  race: (period: Period) =>
    get<{ period: Period; label: string; streak: number; standings: Standing[] }>(
      `race?period=${period}`
    ),
  leaderboard: (period: Period) =>
    get<{
      period: Period;
      subtitle: string;
      monthLabel: string;
      podium: LeaderRow[];
      rest: LeaderRow[];
      you: (LeaderRow & { gapLabel: string }) | null;
    }>(`leaderboard?period=${period}`),
};

/* -------------------------------- hooks --------------------------------- */

import { useCallback, useEffect, useState } from "react";

export type Async<T> = {
  data: T | undefined;
  error: string | undefined;
  loading: boolean;
  reload: () => void;
};

/**
 * Responses already seen, keyed by request. Module-level so it survives screen
 * unmounts — switching tabs must not throw the data away.
 */
const cache = new Map<string, unknown>();

/**
 * Drop everything on the way in or out of an account. Without this, signing in
 * as someone else would paint their screens with the last player's portfolio
 * until the refetch landed.
 */
export function clearApiCache() {
  cache.clear();
}

/**
 * Fetch with stale-while-revalidate.
 *
 * A native app doesn't blank the screen when you switch tabs; it shows what it
 * had and quietly updates. So do we: if this key has been fetched before, its
 * last value renders immediately and the refetch happens behind it. Only a
 * genuinely first-time request shows a loading state.
 */
export function useApi<T>(key: string, fn: () => Promise<T>, deps: unknown[]): Async<T> {
  const [data, setData] = useState<T | undefined>(() => cache.get(key) as T | undefined);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(() => !cache.has(key));
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let live = true;

    const hit = cache.get(key) as T | undefined;
    if (hit !== undefined) {
      setData(hit);
      setLoading(false);
    } else {
      // Keep whatever we were showing (e.g. last period's race) instead of
      // blanking to a loading splash — native apps don't flash empty frames
      // when you flip a toggle or revisit a tab.
      setLoading(true);
    }

    fn()
      .then((d) => {
        cache.set(key, d);
        if (!live) return;
        setData(d);
        setError(undefined);
      })
      .catch((e: unknown) => {
        if (!live) return;
        // Keep showing stale data on a failed refresh — an error screen over
        // a portfolio you were just looking at is worse than a slightly old one.
        setError(e instanceof Error ? e.message : "Something went wrong.");
      })
      .finally(() => live && setLoading(false));

    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ...deps, nonce]);

  return { data, error, loading, reload: useCallback(() => setNonce((n) => n + 1), []) };
}
