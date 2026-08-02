import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { api, clearApiCache, useApi, type Period, type Player } from "./api";
import type { Tab } from "./components/TabBar";
import { Login } from "./screens/Login";
import { Home } from "./screens/Home";
import { Portfolio } from "./screens/Portfolio";
import { Discover } from "./screens/Discover";
import { BuySell } from "./screens/BuySell";
import { OrderTicket } from "./screens/OrderTicket";
import { Race } from "./screens/Race";
import { Leaderboards } from "./screens/Leaderboards";
import { ProfilePullUp } from "./screens/ProfilePullUp";
import { TrophyRoom } from "./screens/TrophyRoom";
import { PhoneFrame, Screen } from "./components/PhoneFrame";
import { TabBar } from "./components/TabBar";
import { Button } from "./components/ui";
import { RefreshProvider } from "./refresh";
import { SessionProvider } from "./session";
import { playFill, playShake } from "./sound";
import { useShake } from "./useShake";

/* ---------------------------------------------------------------------------
   The running app: real session, real portfolio, real trades.

   MVP slice, as agreed — login, home, portfolio, discover, buy/sell, race and
   leaderboard read and write the database. Duels aren't built yet, so that tab
   says so rather than showing the design's mocked-up match.
--------------------------------------------------------------------------- */

type View =
  | { name: "tab"; tab: Tab }
  | { name: "stock"; symbol: string }
  // An order carries either dollars or shares — whichever the player typed —
  // all the way to the server, so a share order fills as shares.
  | { name: "ticket"; symbol: string; side: "buy" | "sell"; shares?: number; all?: boolean }
  // Profile and trophies are modal over whichever tab you opened them from,
  // so dismissing returns you there rather than dumping you on HOME.
  | { name: "profile"; from: Tab }
  | { name: "trophies"; from: Tab };

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

  // Shake-to-rattle lives at the shell so it works on any screen, not just
  // wherever the toggle happens to be.
  const shake = useShake(playShake);

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
  if (!player) {
    return (
      <Login
        onSignedIn={(p) => {
          clearApiCache();
          setPlayer(p);
        }}
      />
    );
  }

  const go = (tab: Tab) => setView({ name: "tab", tab });

  const signOut = async () => {
    // Clear the cookie first; dropping the player only changes what's drawn.
    await api.logout().catch(() => {});
    clearApiCache();
    setPlayer(null);
    setView({ name: "tab", tab: "home" });
    refresh();
  };

  // Pull-to-refresh on any screen refetches everything the shell owns.
  const openProfile = () =>
    setView({ name: "profile", from: view.name === "tab" ? view.tab : "home" });

  // Remember which tab sits under overlays so we can keep it mounted (and warm)
  // while stock / profile / ticket are open — switching back shouldn't remount.
  const tab =
    view.name === "tab"
      ? view.tab
      : view.name === "profile" || view.name === "trophies"
        ? view.from
        : view.name === "stock" || view.name === "ticket"
          ? "trade"
          : "home";

  const hide = (id: Tab): CSSProperties => ({
    display: view.name === "tab" && tab === id ? undefined : "none",
  });

  return (
    <SessionProvider player={player}>
      <RefreshProvider onRefresh={refresh}>
        {/* All tab roots stay mounted so revisits paint instantly from cache. */}
        <div style={hide("home")}>
          <LiveHome version={dataVersion} onNavigate={go} onProfile={openProfile} />
        </div>
        <div style={hide("folio")}>
          <LiveFolio
            version={dataVersion}
            onNavigate={go}
            onProfile={openProfile}
            onOpen={(symbol) => setView({ name: "stock", symbol })}
          />
        </div>
        <div style={hide("trade")}>
          <LiveDiscover
            onNavigate={go}
            onProfile={openProfile}
            onOpen={(symbol) => setView({ name: "stock", symbol })}
          />
        </div>
        <div style={hide("race")}>
          <LiveRace version={dataVersion} onNavigate={go} onProfile={openProfile} />
        </div>
        <div style={hide("duels")}>
          <DuelsSoon onNavigate={go} />
        </div>

        {view.name === "stock" && (
          <StockDetail
            symbol={view.symbol}
            version={dataVersion}
            onBack={() => go("trade")}
            onNavigate={go}
            onReview={(order) => setView({ name: "ticket", symbol: view.symbol, ...order })}
          />
        )}
        {view.name === "ticket" && (
          <Ticket
            order={view}
            version={dataVersion}
            onDismiss={() => setView({ name: "stock", symbol: view.symbol })}
            onFilled={() => {
              refresh();
              go("folio");
            }}
          />
        )}
        {view.name === "profile" && (
          <LiveProfile
            version={dataVersion}
            shake={shake}
            onSignOut={signOut}
            onDismiss={() => go(view.from)}
            onTrophyRoom={() => setView({ name: "trophies", from: view.from })}
          />
        )}
        {view.name === "trophies" && (
          <LiveTrophies
            version={dataVersion}
            onNavigate={go}
            onBack={() => setView({ name: "profile", from: view.from })}
          />
        )}
      </RefreshProvider>
    </SessionProvider>
  );
}

/* ------------------------------- screens -------------------------------- */

function LiveHome({
  version,
  onNavigate,
  onProfile,
}: {
  version: number;
  onNavigate: (t: Tab) => void;
  onProfile: () => void;
}) {
  const portfolio = useApi("portfolio", () => api.portfolio(), [version]);
  const feed = useApi("feed", () => api.feed(), [version]);

  if (portfolio.error && !portfolio.data) {
    return <Failed message={portfolio.error} onRetry={portfolio.reload} active="home" onNavigate={onNavigate} />;
  }
  if (!portfolio.data) return <TabPending active="home" onNavigate={onNavigate} />;

  const p = portfolio.data;
  return (
    <Home
      onNavigate={onNavigate}
      onProfile={onProfile}
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
  onProfile,
}: {
  version: number;
  onNavigate: (t: Tab) => void;
  onOpen: (symbol: string) => void;
  onProfile: () => void;
}) {
  const { data, error, reload } = useApi("portfolio", () => api.portfolio(), [version]);

  if (error && !data) {
    return <Failed message={error} onRetry={reload} active="folio" onNavigate={onNavigate} />;
  }
  if (!data) return <TabPending active="folio" onNavigate={onNavigate} />;

  return (
    <Portfolio
      onNavigate={onNavigate}
      onProfile={onProfile}
      onOpenHolding={onOpen}
      live={{
        trophies: data.vitals.trophies,
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
  onProfile,
}: {
  onNavigate: (t: Tab) => void;
  onOpen: (symbol: string) => void;
  onProfile: () => void;
}) {
  const [board, setBoard] = useState<"gainers" | "losers" | "traded">("gainers");
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 250);
    return () => clearTimeout(t);
  }, [query]);

  // Cached from the portfolio fetch, so this costs nothing extra.
  const trophyCount = useApi("portfolio", () => api.portfolio(), []).data?.vitals.trophies ?? 0;

  const { data, error, loading, reload } = useApi(
    `market:${board}:${debounced}`,
    () => api.market(board, debounced),
    [board, debounced]
  );

  if (error && !data) {
    return <Failed message={error} onRetry={reload} active="trade" onNavigate={onNavigate} />;
  }

  return (
    <Discover
      onNavigate={onNavigate}
      onProfile={onProfile}
      onOpenStock={onOpen}
      live={{
        trophies: trophyCount,
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
  onReview: (order: { side: "buy" | "sell"; shares?: number; all?: boolean }) => void;
}) {
  // The chart window is a server query — each range loads real market history.
  const [range, setRange] = useState("1D");
  const { data, error, reload } = useApi(
    `quote:${symbol}:${range}`,
    () => api.quote(symbol, range),
    [symbol, range, version]
  );

  if (error && !data) {
    return <Failed message={error} onRetry={reload} active="trade" onNavigate={onNavigate} />;
  }
  if (!data) return <TabPending active="trade" onNavigate={onNavigate} />;

  return (
    <BuySell
      onNavigate={onNavigate}
      onBack={onBack}
      onReview={onReview}
      onRange={setRange}
      live={data}
    />
  );
}

function Ticket({
  order,
  version,
  onDismiss,
  onFilled,
}: {
  order: { symbol: string; side: "buy" | "sell"; shares?: number; all?: boolean };
  version: number;
  onDismiss: () => void;
  onFilled: () => void;
}) {
  const { data } = useApi(`quote:${order.symbol}:1D`, () => api.quote(order.symbol), [
    order.symbol,
    version,
  ]);
  const race = useApi("race:month", () => api.race("month"), [version]);
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
    // Shares are exact — they're what the order asks for. The dollar figure is
    // an estimate until the fill prices it, which is why it carries the "≈".
    const shares = order.all ? (data.position?.shares ?? 0) : (order.shares ?? 0);
    const amount = shares * data.price;
    const after = order.side === "buy" ? data.balance - amount : data.balance + amount;
    return {
      side: order.side,
      symbol: data.symbol,
      name: data.name,
      badge: data.symbol.slice(0, 2),
      amountLabel: `≈ ${usd(amount)}`,
      sharesLabel: `${shares.toLocaleString("en-US", { maximumFractionDigits: 2 })} shares`,
      priceLabel: data.priceLabel,
      asOfLabel: "fills at next price update",
      coinsBeforeLabel: usd(data.balance),
      coinsAfterLabel: usd(after),
      deltaLabel: `${order.side === "buy" ? "−" : "+"}${usd(amount)}`,
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
      await api.trade({
        symbol: order.symbol,
        side: order.side,
        ...(order.all ? { all: true } : { shares: order.shares }),
      });
      // Only on a confirmed fill — the sound means "that happened", not "sent".
      playFill();
      onFilled();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Order didn't go through.");
    } finally {
      setSubmitting(false);
    }
  }

  return <OrderTicket onConfirm={confirm} onDismiss={onDismiss} live={live} />;
}

function LiveRace({
  version,
  onNavigate,
  onProfile,
}: {
  version: number;
  onNavigate: (t: Tab) => void;
  onProfile: () => void;
}) {
  const [period, setPeriod] = useState<Period>("month");
  const [board, setBoard] = useState<"race" | "ranks">("race");

  const race = useApi(`race:${period}`, () => api.race(period), [period, version]);
  const ranks = useApi(`leaderboard:${period}`, () => api.leaderboard(period), [period, version]);
  // Same cache key the home and folio tabs use, so this is almost always a hit;
  // it's here only for the trophy pip, which must not be a made-up number.
  const portfolio = useApi("portfolio", () => api.portfolio(), [version]);

  if (race.error && !race.data) {
    return <Failed message={race.error} onRetry={race.reload} active="race" onNavigate={onNavigate} />;
  }
  if (!race.data) return <TabPending active="race" onNavigate={onNavigate} />;

  // The race and the high-score board are two views of the same period; the
  // race row list doubles as the switch into the full standings. Stay on the
  // race chart until ranks arrive — don't flash a loading splash on the toggle.
  if (board === "ranks" && ranks.data) {
    return (
      <Leaderboards
        onNavigate={onNavigate}
        onTrade={() => onNavigate("trade")}
        onProfile={onProfile}
        live={{
          subtitle: ranks.data.subtitle,
          trophies: portfolio.data?.vitals.trophies ?? 0,
          podium: ranks.data.podium,
          rest: ranks.data.rest,
          you: ranks.data.you,
          period,
          onPeriod: setPeriod,
          onScope: (scope) => setBoard(scope === "league" ? "ranks" : "race"),
        }}
      />
    );
  }

  return (
    <Race
      onNavigate={onNavigate}
      live={{
        label: race.data.label,
        streak: race.data.streak,
        standings: race.data.standings,
        nudge: raceNudge(race.data.standings),
        period,
        onPeriod: setPeriod,
        onScope: (scope) => setBoard(scope === "league" ? "ranks" : "race"),
      }}
    />
  );
}

/** The line under the standings, true for this race rather than flavour. */
function raceNudge(standings: { name: string; you: boolean; return: number }[]) {
  if (standings.length < 2) return "Nobody else is racing yet. Invite someone to make it a race.";
  const i = standings.findIndex((s) => s.you);
  if (i < 0) return undefined;
  const other = standings[i === 0 ? 1 : i - 1];
  const gap = Math.abs(other.return - standings[i].return) * 100;
  // Under a tenth of a point everyone rounds to the same number, and "0.0%
  // ahead" reads as a bug rather than a dead heat.
  if (gap < 0.05) return `You're level with ${other.name}. Nothing between you.`;
  return i === 0
    ? `You're ${gap.toFixed(1)}% ahead of ${other.name}. Defend it.`
    : `${other.name} is ${gap.toFixed(1)}% ahead of you. Your move.`;
}

function LiveProfile({
  version,
  shake,
  onDismiss,
  onSignOut,
  onTrophyRoom,
}: {
  version: number;
  shake: ReturnType<typeof useShake>;
  onSignOut: () => void;
  onDismiss: () => void;
  onTrophyRoom: () => void;
}) {
  const { data, error, reload } = useApi("profile", () => api.profile(), [version]);
  if (error && !data) return <Failed message={error} onRetry={reload} />;
  if (!data) return <SoftPending />;

  return (
    <ProfilePullUp
      onDismiss={onDismiss}
      onTrophyRoom={onTrophyRoom}
      onSignOut={onSignOut}
      shake={shake}
      live={{
        name: data.player.name,
        initials: data.player.initials,
        level: data.level,
        levelTitle: data.levelTitle,
        xpPct: data.xpPct,
        toNextLabel: data.toNextLabel,
        rank: data.rank,
        streak: data.streak,
        duels: data.duels,
        duelRecord: data.duelRecord,
        crewSize: data.crewSize,
        earnedCount: data.earnedCount,
        totalCount: data.totalCount,
      }}
    />
  );
}

function LiveTrophies({
  version,
  onNavigate,
  onBack,
}: {
  version: number;
  onNavigate: (t: Tab) => void;
  onBack: () => void;
}) {
  const { data, error, reload } = useApi("profile", () => api.profile(), [version]);
  if (error && !data) return <Failed message={error} onRetry={reload} active="home" onNavigate={onNavigate} />;
  if (!data) return <SoftPending />;

  return (
    <TrophyRoom
      onNavigate={onNavigate}
      onBack={onBack}
      live={{
        name: data.player.name,
        earnedCount: data.earnedCount,
        totalCount: data.totalCount,
        trophies: data.trophies,
      }}
    />
  );
}

/* -------------------------------- states -------------------------------- */

/** Cold start only — waiting on /api/me before we know whether to show login. */
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

/**
 * In-app wait that keeps the tab bar. Switching tabs should feel instant —
 * the destination tab lights up immediately, and content fills in behind it.
 * Never put the RALLY splash here; that reads as a full app restart.
 */
function TabPending({ active, onNavigate }: { active: Tab; onNavigate: (t: Tab) => void }) {
  return (
    <PhoneFrame>
      <Screen>
        <PendingBody copy="Loading…" />
      </Screen>
      <TabBar active={active} onNavigate={onNavigate} />
    </PhoneFrame>
  );
}

/** Overlay waits (profile / trophies) — no tab bar, still no RALLY splash. */
function SoftPending() {
  return (
    <PhoneFrame>
      <Screen>
        <PendingBody copy="Loading…" />
      </Screen>
    </PhoneFrame>
  );
}

function PendingBody({ copy }: { copy: string }) {
  return (
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
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          border: "2px solid var(--cyan)",
          borderTopColor: "transparent",
          animation: "spin 0.7s linear infinite",
        }}
      />
      <div style={{ fontSize: 13, color: "var(--text-2)" }}>{copy}</div>
    </div>
  );
}

/**
 * Duels aren't built. The design frame for them is a mocked-up match against a
 * player who doesn't exist, so showing it here would be inventing an opponent,
 * a stake and a scoreline — the tab says what's true instead.
 */
function DuelsSoon({ onNavigate }: { onNavigate: (t: Tab) => void }) {
  return (
    <PhoneFrame glow="rgba(255,43,214,0.12)">
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
            padding: "0 20px",
          }}
        >
          <i className="ph-fill ph-sword" style={{ fontSize: 52, color: "var(--magenta)" }} />
          <div className="pixel" style={{ fontSize: 15, color: "var(--magenta)" }}>
            DUELS
          </div>
          <div style={{ fontSize: 14, color: "var(--text-1)", maxWidth: 290, lineHeight: 1.5 }}>
            Head-to-head matches aren't live yet. When they are, you'll stake coins against
            one racer and the bigger % gain takes the pot.
          </div>
          <Button
            variant="outline"
            height={50}
            caret
            onClick={() => onNavigate("race")}
            style={{ maxWidth: 240 }}
          >
            RACE EVERYONE INSTEAD
          </Button>
        </div>
      </Screen>
      <TabBar active="duels" onNavigate={onNavigate} />
    </PhoneFrame>
  );
}

function Failed({
  message,
  onRetry,
  active,
  onNavigate,
}: {
  message: string;
  onRetry: () => void;
  active?: Tab;
  onNavigate?: (t: Tab) => void;
}) {
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
      {active && onNavigate ? <TabBar active={active} onNavigate={onNavigate} /> : null}
    </PhoneFrame>
  );
}
