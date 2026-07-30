import { PhoneFrame, Screen } from "../components/PhoneFrame";
import { TabBar, type Tab } from "../components/TabBar";
import { Avatar, Card, Chip, Ticker, Title } from "../components/ui";
import { ALLOCATION, HOLDINGS, PLAYER, STACK } from "../data";

/* 03 · PORTFOLIO — invested vs cash with a colour-keyed allocation bar, then
   every holding with shares, weight, value and day change. */

export type PortfolioLive = {
  trophies: number;
  investedLabel: string;
  cashLabel: string;
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
