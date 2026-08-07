import { PhoneFrame, Screen } from "../components/PhoneFrame";
import { TabBar, type Tab } from "../components/TabBar";
import { Avatar, Card, Chip, GlowDot, GlowLine, Ticker, Title } from "../components/ui";
import { ALLOCATION, HOLDINGS, PLAYER, STACK } from "../data";

/* 03 · PORTFOLIO — invested vs cash with a colour-keyed allocation bar, the
   player's real stack growth chart from portfolio snapshots, then every
   holding with shares, weight, value and day change. */

export type PortfolioLive = {
  trophies: number;
  investedLabel: string;
  cashLabel: string;
  growth?: {
    series: number[];
    changeLabel: string;
    up: boolean;
    totalLabel: string;
  };
  positions: {
    symbol: string;
    name: string;
    badge: string;
    role: string;
    sharesLabel: string;
    weightLabel: string;
    weight: number;
    valueLabel: string;
    changeLabel: string;
    up: boolean;
  }[];
};

/** Allocation bar colours, in the palette's own order. */
const BAR_COLORS = ["#22f7ff", "#39ff14", "#ffe600", "#ff2bd6", "#087f92", "#9df4ff"];

/** Adapts a design-mock holding to the same shape the live rows use. */
const mockToRow = (h: (typeof HOLDINGS)[number]): PortfolioLive["positions"][number] => ({
  symbol: h.ticker,
  name: h.name,
  badge: h.ticker,
  role: h.role,
  sharesLabel: h.shares,
  weightLabel: h.weight,
  weight: parseFloat(h.weight) / 100,
  valueLabel: h.value,
  changeLabel: h.change,
  up: h.up,
});

/** Maps the stack series into the 340×130 chart box. */
function growthLine(history: number[]) {
  if (history.length < 2) return "";
  const lo = Math.min(...history);
  const hi = Math.max(...history);
  const span = hi - lo || 1;
  const stepX = 340 / (history.length - 1);
  return history
    .map((v, i) => `${(i * stepX).toFixed(1)},${(118 - ((v - lo) / span) * 100).toFixed(1)}`)
    .join(" ");
}

export function Portfolio({
  onNavigate,
  onProfile,
  onOpenHolding,
  live,
}: {
  onNavigate?: (t: Tab) => void;
  onProfile?: () => void;
  onOpenHolding?: (symbol: string) => void;
  live?: PortfolioLive;
}) {
  const positions = live?.positions ?? null;
  const allocation =
    positions?.map((p, i) => ({ pct: p.weight * 100, color: BAR_COLORS[i % BAR_COLORS.length] })) ??
    ALLOCATION;
  const growth = live?.growth;
  const growthPoints = growth && growth.series.length >= 2 ? growthLine(growth.series) : "";

  return (
    <PhoneFrame>
      <Screen scroll>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Title>MY HOLDINGS</Title>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Chip role="cyan">{(positions ?? HOLDINGS).length} POSITIONS</Chip>
            <Avatar pip={live ? live.trophies : PLAYER.trophies} onClick={onProfile} />
          </div>
        </div>

        <Card
          background="var(--grad-indigo-card)"
          radius="var(--r-card)"
          padding={16}
          style={{ display: "flex", flexDirection: "column", gap: 10, flexShrink: 0 }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span style={{ color: "var(--text-2)" }}>Invested</span>
            <span className="num" style={{ fontWeight: 700, color: "var(--cyan)" }}>
              {live ? live.investedLabel : STACK.invested}
            </span>
          </div>
          <div style={{ height: 12, borderRadius: 6, overflow: "hidden", display: "flex", background: "var(--bg-hairline)" }}>
            {allocation.map((a, i) => (
              <div key={i} style={{ width: `${a.pct}%`, background: a.color }} />
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span style={{ color: "var(--text-2)" }}>Cash ready to trade</span>
            <span className="num" style={{ fontWeight: 700, color: "var(--gold)" }}>
              {live ? live.cashLabel : STACK.cash}
            </span>
          </div>
        </Card>

        {/* Real stack history from portfolio_snapshots — not mock points. */}
        {(growthPoints || !live) && (
          <Card background="var(--grad-indigo-card-170)" radius="var(--r-card)" padding="12px 10px 10px">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "0 4px 6px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-2)" }}>
                YOUR GROWTH
              </div>
              <div
                className="num"
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: growth && !growth.up ? "var(--magenta)" : "var(--green)",
                }}
              >
                {growth ? `${growth.up ? "▲" : "▼"} ${growth.changeLabel} all-time` : "▲ +14.0% all-time"}
              </div>
            </div>
            <svg viewBox="0 0 340 130" style={{ width: "100%", height: 120 }}>
              <line x1="0" y1="43" x2="340" y2="43" stroke="#241442" strokeWidth="1" />
              <line x1="0" y1="86" x2="340" y2="86" stroke="#241442" strokeWidth="1" />
              {(() => {
                const color = growth && !growth.up ? "#ff2bd6" : "#39ff14";
                const points =
                  growthPoints ||
                  "0,90 40,85 80,70 120,75 160,55 200,50 240,40 280,35 320,28 340,22";
                const last = points.split(" ").pop()!.split(",").map(Number);
                return (
                  <>
                    <GlowLine points={points} color={color} width={3.5} bloom={12} />
                    <GlowDot cx={last[0]} cy={last[1]} color={color} />
                  </>
                );
              })()}
            </svg>
            {growth && (
              <div
                className="num"
                style={{
                  textAlign: "right",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--text-2)",
                  padding: "0 4px",
                }}
              >
                Now {growth.totalLabel}
              </div>
            )}
          </Card>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
          {positions && positions.length === 0 && (
            <Card style={{ padding: "18px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>All cash. Zero plays.</div>
              <div style={{ fontSize: 13, color: "var(--text-2)" }}>
                Your coins don’t race while they’re parked. Tap TRADE to make your first play.
              </div>
            </Card>
          )}

          {(positions ?? HOLDINGS.map(mockToRow)).map((h) => (
            <Card
              key={h.name}
              onClick={onOpenHolding ? () => onOpenHolding(h.symbol) : undefined}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px" }}
            >
              <Ticker role={h.role}>{h.badge}</Ticker>
              <div style={{ flex: 1, textAlign: "left" }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{h.name}</div>
                <div className="num" style={{ fontSize: 12, color: "var(--text-2)" }}>
                  {h.sharesLabel} · {h.weightLabel}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="num" style={{ fontSize: 15, fontWeight: 700 }}>
                  {h.valueLabel}
                </div>
                <div
                  className="num"
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: h.up ? "var(--green)" : "var(--magenta)",
                  }}
                >
                  {h.up ? "▲" : "▼"} {h.changeLabel}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Screen>
      <TabBar active="folio" onNavigate={onNavigate} />
    </PhoneFrame>
  );
}
