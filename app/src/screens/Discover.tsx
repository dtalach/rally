import { useState } from "react";
import { PhoneFrame, Screen } from "../components/PhoneFrame";
import { TabBar, type Tab } from "../components/TabBar";
import { Avatar, Card, ROLE, Segmented, Ticker, Title } from "../components/ui";
import { PLAYER } from "../data";

/* 04 · TRADE · DISCOVER — a discovery surface.
   Search stays on top; below it the movers board (gainers / losers / most
   traded) and three browsable idea cards. Social context rides along on each
   row ("Maya + 2 own it") — the strongest discovery signal for this audience. */

type Mover = {
  rank: number;
  ticker: string;
  role: string;
  name: string;
  note: string;
  price: string;
  change: string;
  up: boolean;
};

const BOARDS: Record<string, Mover[]> = {
  gainers: [
    { rank: 1, ticker: "AM", role: "green", name: "AMD", note: "Chips · crushing earnings", price: "$196.10", change: "+6.8%", up: true },
    { rank: 2, ticker: "RB", role: "magenta", name: "Roblox", note: "Gaming · Maya + 2 own it", price: "$41.20", change: "+3.1%", up: true },
    { rank: 3, ticker: "NV", role: "cyan", name: "NVIDIA", note: "Chips · most traded on Rally", price: "$172.40", change: "+2.4%", up: true },
  ],
  losers: [
    { rank: 1, ticker: "TS", role: "ice", name: "Tesla", note: "EVs · Dev just sold out", price: "$218.60", change: "−4.2%", up: false },
    { rank: 2, ticker: "NK", role: "#c8fbff", name: "Nike", note: "Sneakers · soft quarter", price: "$74.10", change: "−2.6%", up: false },
    { rank: 3, ticker: "SB", role: "gold", name: "Starbucks", note: "Food · 3 in your crew own it", price: "$88.40", change: "−1.4%", up: false },
  ],
  traded: [
    { rank: 1, ticker: "NV", role: "cyan", name: "NVIDIA", note: "Chips · most traded on Rally", price: "$172.40", change: "+2.4%", up: true },
    { rank: 2, ticker: "SP", role: "green", name: "S&P 500 ETF", note: "ETF · the whole market in one buy", price: "$473.80", change: "+0.6%", up: true },
    { rank: 3, ticker: "RB", role: "magenta", name: "Roblox", note: "Gaming · Maya + 2 own it", price: "$41.20", change: "+3.1%", up: true },
  ],
};

const CATEGORIES = ["GAMING", "AI", "SNEAKERS", "FOOD"];

export type DiscoverLive = {
  rows: {
    symbol: string;
    name: string;
    badge: string;
    role: string;
    note: string;
    priceLabel: string;
    changeLabel: string;
    up: boolean;
  }[];
  board: "gainers" | "losers" | "traded";
  onBoard: (b: "gainers" | "losers" | "traded") => void;
  query: string;
  onQuery: (q: string) => void;
  loading: boolean;
};

export function Discover({
  onNavigate,
  onProfile,
  onOpenStock,
  live,
}: {
  onNavigate?: (t: Tab) => void;
  onProfile?: () => void;
  onOpenStock?: (symbol: string) => void;
  live?: DiscoverLive;
}) {
  const [localBoard, setLocalBoard] = useState<"gainers" | "losers" | "traded">("gainers");
  const [category, setCategory] = useState("GAMING");

  const board = live?.board ?? localBoard;
  const setBoard = (b: "gainers" | "losers" | "traded") =>
    live ? live.onBoard(b) : setLocalBoard(b);

  /** Live rows and design-mock rows normalised to one shape. */
  const rows: {
    symbol: string;
    name: string;
    badge: string;
    role: string;
    note: string;
    price: string;
    change: string;
    up: boolean;
    rank: number;
  }[] = live
    ? live.rows.map((r, i) => ({ ...r, rank: i + 1, price: r.priceLabel, change: r.changeLabel }))
    : BOARDS[board].map((m) => ({ ...m, symbol: m.ticker, badge: m.ticker }));
  const rowRing = board === "losers" ? "rgba(255,43,214,0.3)" : "rgba(57,255,20,0.3)";

  return (
    <PhoneFrame glow="rgba(255,43,214,0.12)">
      <Screen scroll>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Title>FIND YOUR NEXT PLAY</Title>
          <Avatar pip={PLAYER.trophies} onClick={onProfile} />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "13px 16px",
            borderRadius: "var(--r-tile)",
            background: "var(--bg-card)",
            boxShadow: "inset 0 0 0 1.5px rgba(34,247,255,0.35)",
            flexShrink: 0,
          }}
        >
          <i className="ph ph-magnifying-glass" style={{ fontSize: 19, color: "var(--cyan-soft)" }} />
          {live ? (
            <input
              value={live.query}
              onChange={(e) => live.onQuery(e.target.value)}
              placeholder="Search any stock or ETF…"
              style={{
                flex: 1,
                minWidth: 0,
                border: "none",
                background: "transparent",
                color: "#fff",
                fontSize: 14,
                outline: "none",
                padding: 0,
              }}
            />
          ) : (
            <div style={{ fontSize: 14, color: "var(--text-3)", flex: 1 }}>Search any stock or ETF…</div>
          )}
          <div
            className="num"
            style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)", letterSpacing: "0.06em" }}
          >
            15-MIN DELAY
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", flexShrink: 0 }}>
          {CATEGORIES.map((c) => {
            const on = c === category;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                style={{
                  padding: "8px 14px",
                  borderRadius: 20,
                  border: "none",
                  fontFamily: "inherit",
                  fontSize: 13,
                  cursor: "pointer",
                  ...(on
                    ? {
                        fontWeight: 700,
                        background: "var(--grad-btn-magenta)",
                        color: "#fff",
                        boxShadow: "0 0 14px rgba(255,43,214,0.4)",
                      }
                    : {
                        fontWeight: 600,
                        background: "transparent",
                        color: "var(--cyan-soft)",
                        boxShadow: "inset 0 0 0 1.5px rgba(34,247,255,0.4)",
                      }),
                }}
              >
                {c}
              </button>
            );
          })}
        </div>

        <Segmented
          options={[
            { id: "gainers", label: "TOP GAINERS" },
            { id: "losers", label: "TOP LOSERS" },
            { id: "traded", label: "MOST TRADED" },
          ]}
          value={board}
          onChange={setBoard}
          activeSkin={board === "losers" ? "magenta" : "green"}
          style={{ flexShrink: 0 }}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
          {live?.loading && rows.length === 0 && (
            <div style={{ fontSize: 13, color: "var(--text-2)", padding: "8px 2px" }}>Pricing the market…</div>
          )}
          {live && !live.loading && rows.length === 0 && (
            <div style={{ fontSize: 13, color: "var(--text-2)", padding: "8px 2px" }}>
              Nothing matches “{live.query}”. Try a ticker like NVDA.
            </div>
          )}
          {rows.map((m) => (
            <Card
              key={`${board}-${m.symbol}`}
              onClick={onOpenStock ? () => onOpenStock(m.symbol) : undefined}
              ring={`0 0 0 1.5px ${rowRing}`}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px" }}
            >
              <div
                className="num"
                style={{
                  width: 20,
                  textAlign: "center",
                  fontSize: 13,
                  fontWeight: 700,
                  color: m.up ? "var(--green)" : "var(--magenta)",
                }}
              >
                {m.rank}
              </div>
              <Ticker role={m.role} size={38} radius={11} fontSize={12}>
                {m.badge}
              </Ticker>
              <div style={{ flex: 1, textAlign: "left" }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{m.name}</div>
                <div style={{ fontSize: 11, color: "var(--text-2)" }}>{m.note}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="num" style={{ fontSize: 14, fontWeight: 700 }}>
                  {m.price}
                </div>
                <div
                  className="num"
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: m.up ? "var(--green)" : "var(--magenta)",
                  }}
                >
                  {m.up ? "▲" : "▼"} {m.change}
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 2px", flexShrink: 0 }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.1em", color: "var(--cyan-soft)" }}>
            STOCK IDEAS
          </div>
          <div
            className="num"
            style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)", letterSpacing: "0.06em" }}
          >
            15-MIN DELAY
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, overflow: "hidden", flexShrink: 0 }}>
          <IdeaCard
            icon="ph-fill ph-fire"
            role="cyan"
            gradient="var(--grad-cyan-card)"
            title="Stocks you know"
            body="Brands from your world — games, food, sneakers"
          />
          <IdeaCard
            icon="ph-fill ph-shield-check"
            role="green"
            gradient="var(--grad-green-card)"
            title="Steady starters"
            body="ETFs · the whole market in one buy"
          />
          <IdeaCard
            icon="ph-fill ph-rocket-launch"
            role="magenta"
            gradient="var(--grad-magenta-card)"
            title="High risk, high reward"
            body="Big swings · not for your whole stack"
          />
        </div>
      </Screen>
      <TabBar active="trade" onNavigate={onNavigate} />
    </PhoneFrame>
  );
}

function IdeaCard({
  icon,
  role,
  gradient,
  title,
  body,
}: {
  icon: string;
  role: keyof typeof ROLE;
  gradient: string;
  title: string;
  body: string;
}) {
  const t = ROLE[role];
  return (
    <div
      style={{
        flex: 1,
        borderRadius: "var(--r-tile)",
        padding: 13,
        background: gradient,
        boxShadow: `0 0 0 1.5px rgba(${t.rgb},0.4)`,
      }}
    >
      <i className={icon} style={{ fontSize: 20, color: t.base }} />
      <div style={{ fontSize: 13, fontWeight: 700, marginTop: 6, lineHeight: 1.3 }}>{title}</div>
      <div style={{ fontSize: 11, color: "var(--text-2)", marginTop: 2 }}>{body}</div>
    </div>
  );
}
