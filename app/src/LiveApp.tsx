import { useCallback, useEffect, useMemo, useState } from "react";
import { api, useApi, type Period, type Player } from "./api";
import type { Tab } from "./components/TabBar";
import { Login } from "./screens/Login";
import { Home } from "./screens/Home";
import { Portfolio } from "./screens/Portfolio";
import { Discover } from "./screens/Discover";
import { BuySell } from "./screens/BuySell";
import { OrderTicket } from "./screens/OrderTicket";
import { Race } from "./screens/Race";
import { Leaderboards } from "./screens/Leaderboards";
import { VsDuel } from "./screens/VsDuel";
import { PhoneFrame, Screen } from "./components/PhoneFrame";

/* ---------------------------------------------------------------------------
   The running app: real session, real portfolio, real trades.

   MVP slice, as agreed — login, home, portfolio, discover, buy/sell, race and
   leaderboard read and write the database. Duels are still the static design
   screen; it's reachable from the tab bar and clearly marked as not yet live.
--------------------------------------------------------------------------- */

type View =
  | { name: "tab"; tab: Tab }
  | { name: "stock"; symbol: string }
  | { name: "ticket"; symbol: string; side: "buy" | "sell"; amount: number };

const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

/** The same price series the detail screen draws, for the dimmed backdrop. */
function backdropLine(history: number[]) {
  if (history.length < 2) return "0,110 340,22";
  const lo = Math.min(...history);
  const hi = Math.max(...history);
  const span = hi - lo || 1;
  const stepX = 340 / (history.length - 1);
  return history
    .map((v, i) => `${(i * stepX).toFixed(1)},${(118 - ((v - lo) / span) * 100).toFixed(1)}`)
    .join(" ");
}

export default function LiveApp() {
  const [player, setPlayer] = useState<Player | null>(null);
  const [booted, setBooted] = useState(false);
  const [view, setView] = useState<View>({ name: "tab", tab: "home" });

  // Bumping this refetches every screen's data after a trade lands.
  const [dataVersion, setDataVersion] = useState(0);
  const refresh = useCallback(() => setDataVersion((v) => v + 1), []);

  useEffect(() => {
    api
      .me()
      .then((r) => setPlayer(r.player))
      .catch(() => setPlayer(null))
      .finally(() => setBooted(true));
  }, []);

  if (!booted) return <Booting />;
  if (!player) return <Login onSignedIn={setPlayer} />;

  const go = (tab: Tab) => setView({ name: "tab", tab });

  if (view.name === "stock") {
    return (
      <StockDetail
        symbol={view.symbol}
        version={dataVersion}
        onBack={() => go("trade")}
        onNavigate={go}
        onReview={(order) =>
          setView({ name: "ticket", symbol: view.symbol, side: order.side, amount: order.amount })
        }
      />
    );
  }

  if (view.name === "ticket") {
    return (
      <Ticket
        order={view}
        version={dataVersion}
        onDismiss={() => setView({ name: "stock", symbol: view.symbol })}
        onFilled={() => {
          refresh();
          go("folio");
        }}
      />
    );
  }

  switch (view.tab) {
    case "home":
      return <LiveHome version={dataVersion} onNavigate={go} />;
    case "folio":
      return (
        <LiveFolio
          version={dataVersion}
          onNavigate={go}
          onOpen={(symbol) => setView({ name: "stock", symbol })}
        />
      );
    case "trade":
      return <LiveDiscover onNavigate={go} onOpen={(symbol) => setView({ name: "stock", symbol })} />;
    case "race":
      return <LiveRace version={dataVersion} onNavigate={go} />;
    case "duels":
      return <VsDuel onNavigate={go} onTrade={() => go("trade")} />;
  }
}

/* ------------------------------- screens -------------------------------- */

function LiveHome({ version, onNavigate }: { version: number; onNavigate: (t: Tab) => void }) {
  const portfolio = useApi(() => api.portfolio(), [version]);
  const feed = useApi(() => api.feed(), [version]);

  if (portfolio.error) return <Failed message={portfolio.error} onRetry={portfolio.reload} />;
  if (!portfolio.data) return <Booting />;

  const p = portfolio.data;
  return (
    <Home
      onNavigate={onNavigate}
      onTrade={() => onNavigate("trade")}
      live={{
        player: p.player,
        vitals: p.vitals,
        stack: p.stack,
        newPlays: feed.data?.newPlays ?? 0,
        posts: feed.data?.posts ?? [],
      }}
    />
  );
}

function LiveFolio({
  version,
  onNavigate,
  onOpen,
}: {
  version: number;
  onNavigate: (t: Tab) => void;
  onOpen: (symbol: string) => void;
}) {
  const { data, error, reload } = useApi(() => api.portfolio(), [version]);

  if (error) return <Failed message={error} onRetry={reload} />;
  if (!data) return <Booting />;

  return (
    <Portfolio
      onNavigate={onNavigate}
      onOpenHolding={onOpen}
      live={{
        investedLabel: data.stack.investedLabel,
        cashLabel: data.stack.cashLabel,
        positions: data.positions,
      }}
    />
  );
}

function LiveDiscover({
  onNavigate,
  onOpen,
}: {
  onNavigate: (t: Tab) => void;
  onOpen: (symbol: string) => void;
}) {
  const [board, setBoard] = useState<"gainers" | "losers" | "traded">("gainers");
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 250);
    return () => clearTimeout(t);
  }, [query]);

  const { data, error, loading, reload } = useApi(
    () => api.market(board, debounced),
    [board, debounced]
  );

  if (error) return <Failed message={error} onRetry={reload} />;

  return (
    <Discover
      onNavigate={onNavigate}
      onOpenStock={onOpen}
      live={{
        rows: data?.rows ?? [],
        board,
        onBoard: setBoard,
        query,
        onQuery: setQuery,
        loading,
      }}
    />
  );
}

function StockDetail({
  symbol,
  version,
  onBack,
  onNavigate,
  onReview,
}: {
  symbol: string;
  version: number;
  onBack: () => void;
  onNavigate: (t: Tab) => void;
  onReview: (order: { side: "buy" | "sell"; amount: number }) => void;
}) {
  const { data, error, reload } = useApi(() => api.quote(symbol), [symbol, version]);

  if (error) return <Failed message={error} onRetry={reload} />;
  if (!data) return <Booting />;

  return <BuySell onNavigate={onNavigate} onBack={onBack} onReview={onReview} live={data} />;
}

function Ticket({
  order,
  version,
  onDismiss,
  onFilled,
}: {
  order: { symbol: string; side: "buy" | "sell"; amount: number };
  version: number;
  onDismiss: () => void;
  onFilled: () => void;
}) {
  const { data } = useApi(() => api.quote(order.symbol), [order.symbol, version]);
  const race = useApi(() => api.race("month"), [version]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  /** A line that's true for this order, rather than flavour that might not be. */
  const nudge = useMemo(() => {
    const standings = race.data?.standings;
    if (!standings) return "Every coin you park is a coin that can't race.";
    const meIndex = standings.findIndex((s) => s.you);
    const ahead = meIndex > 0 ? standings[meIndex - 1] : null;
    if (!ahead) return "You're leading the race. Now defend it.";
    const gap = (ahead.return - standings[meIndex].return) * 100;
    return `${ahead.name} is ${gap.toFixed(1)}% ahead of you this month.`;
  }, [race.data]);

  const live = useMemo(() => {
    if (!data) return undefined;
    const shares = data.price > 0 ? order.amount / data.price : 0;
    const after =
      order.side === "buy" ? data.balance - order.amount : data.balance + order.amount;
    return {
      side: order.side,
      symbol: data.symbol,
      name: data.name,
      badge: data.symbol.slice(0, 2),
      amountLabel: usd(order.amount),
      sharesLabel: `${shares.toLocaleString("en-US", { maximumFractionDigits: 2 })} shares`,
      priceLabel: data.priceLabel,
      asOfLabel: "fills at next price update",
      coinsBeforeLabel: usd(data.balance),
      coinsAfterLabel: usd(after),
      deltaLabel: `${order.side === "buy" ? "−" : "+"}${usd(order.amount)}`,
      backdropPriceLabel: data.priceLabel,
      backdropChangeLabel: data.changeLabel,
      backdropUp: data.up,
      backdropLine: backdropLine(data.history),
      nudge,
      submitting,
      error,
    };
  }, [data, order, submitting, error, nudge]);

  async function confirm() {
    if (submitting) return;
    setSubmitting(true);
    setError(undefined);
    try {
      await api.trade({ symbol: order.symbol, side: order.side, amount: order.amount });
      onFilled();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Order didn't go through.");
    } finally {
      setSubmitting(false);
    }
  }

  return <OrderTicket onConfirm={confirm} onDismiss={onDismiss} live={live} />;
}

function LiveRace({ version, onNavigate }: { version: number; onNavigate: (t: Tab) => void }) {
  const [period, setPeriod] = useState<Period>("month");
  const [board, setBoard] = useState<"race" | "ranks">("race");

  const race = useApi(() => api.race(period), [period, version]);
  const ranks = useApi(() => api.leaderboard(period), [period, version]);

  if (race.error) return <Failed message={race.error} onRetry={race.reload} />;
  if (!race.data) return <Booting />;

  const monthLabel = new Date()
    .toLocaleString("en-US", { month: "long" })
    .toUpperCase();

  // The race and the high-score board are two views of the same period; the
  // race row list doubles as the switch into the full standings.
  if (board === "ranks" && ranks.data) {
    return (
      <Leaderboards
        onNavigate={onNavigate}
        onTrade={() => onNavigate("trade")}
        onProfile={() => setBoard("race")}
        live={{
          subtitle: ranks.data.subtitle,
          podium: ranks.data.podium,
          rest: ranks.data.rest,
          you: ranks.data.you,
          period,
          onPeriod: setPeriod,
        }}
      />
    );
  }

  return (
    <Race
      onNavigate={onNavigate}
      live={{
        monthLabel,
        streak: race.data.streak,
        standings: race.data.standings,
        period,
        onPeriod: setPeriod,
      }}
    />
  );
}

/* -------------------------------- states -------------------------------- */

function Booting() {
  return (
    <PhoneFrame>
      <Screen>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 14,
          }}
        >
          <div
            className="pixel"
            style={{
              fontSize: 28,
              color: "var(--gold)",
              animation: "logoglow 2.4s ease-in-out infinite",
            }}
          >
            RALLY
          </div>
          <div style={{ fontSize: 13, color: "var(--text-2)" }}>Counting your coins…</div>
        </div>
      </Screen>
    </PhoneFrame>
  );
}

function Failed({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <PhoneFrame glow="rgba(255,43,214,0.16)">
      <Screen>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            textAlign: "center",
            padding: "0 12px",
          }}
        >
          <i className="ph-fill ph-warning-octagon" style={{ fontSize: 52, color: "var(--magenta)" }} />
          <div className="pixel" style={{ fontSize: 16, color: "var(--magenta)" }}>
            GAME OVER?
          </div>
          <div style={{ fontSize: 14, color: "var(--text-1)", maxWidth: 280 }}>{message}</div>
          <button
            type="button"
            onClick={onRetry}
            style={{
              padding: "12px 24px",
              borderRadius: "var(--r-tile)",
              border: "none",
              background: "transparent",
              boxShadow: "inset 0 0 0 1.5px var(--cyan)",
              color: "var(--cyan)",
              fontFamily: "inherit",
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: "0.06em",
              cursor: "pointer",
            }}
          >
            TRY AGAIN
          </button>
        </div>
      </Screen>
    </PhoneFrame>
  );
}
