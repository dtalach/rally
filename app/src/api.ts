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

export type Player = { id: number; handle: string; name: string; initials: string };

export type Vitals = { level: number; rank: number; streak: number; duels: number };

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
    sharesLabel: string;
    valueLabel: string;
    gainLabel: string;
    up: boolean;
  } | null;
  history: number[];
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

export type Period = "month" | "quarter" | "year";

/* ------------------------------ endpoints ------------------------------- */

export const api = {
  me: () => get<{ player: Player | null; realPrices: boolean }>("me"),
  players: () => get<{ players: Player[] }>("players"),
  login: (handle: string, pin: string) => post<{ player: Player }>("login", { handle, pin }),
  logout: () => post<{ ok: true }>("logout", {}),

  portfolio: () => get<Portfolio>("portfolio"),
  feed: () => get<{ newPlays: number; posts: FeedPost[] }>("feed"),
  market: (board: "gainers" | "losers" | "traded", q = "") =>
    get<{ board: string; rows: MarketRow[] }>(
      `market?board=${board}${q ? `&q=${encodeURIComponent(q)}` : ""}`
    ),
  quote: (symbol: string) => get<QuoteDetail>(`quote?symbol=${encodeURIComponent(symbol)}`),
  trade: (order: { symbol: string; side: "buy" | "sell"; amount?: number; all?: boolean }) =>
    post<{
      ok: true;
      side: string;
      name: string;
      amountLabel: string;
      sharesLabel: string;
      cashAfter: number;
    }>("trade", order),

  race: (period: Period) =>
    get<{ period: Period; streak: number; standings: Standing[] }>(`race?period=${period}`),
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

/** Fetch on mount and whenever `deps` change. */
export function useApi<T>(fn: () => Promise<T>, deps: unknown[]): Async<T> {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let live = true;
    setLoading(true);
    fn()
      .then((d) => {
        if (!live) return;
        setData(d);
        setError(undefined);
      })
      .catch((e: unknown) => {
        if (!live) return;
        setError(e instanceof Error ? e.message : "Something went wrong.");
      })
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  return { data, error, loading, reload: useCallback(() => setNonce((n) => n + 1), []) };
}
