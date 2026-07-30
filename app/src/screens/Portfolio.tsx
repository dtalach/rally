import { PhoneFrame, Screen } from "../components/PhoneFrame";
import { TabBar, type Tab } from "../components/TabBar";
import { Avatar, Card, Chip, Ticker, Title } from "../components/ui";
import { ALLOCATION, HOLDINGS, PLAYER, STACK } from "../data";

/* 03 · PORTFOLIO — invested vs cash with a colour-keyed allocation bar, then
   every holding with shares, weight, value and day change. */

export function Portfolio({
  onNavigate,
  onProfile,
  onOpenHolding,
}: {
  onNavigate?: (t: Tab) => void;
  onProfile?: () => void;
  onOpenHolding?: () => void;
}) {
  return (
    <PhoneFrame>
      <Screen scroll>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Title>MY HOLDINGS</Title>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Chip role="cyan">{HOLDINGS.length} POSITIONS</Chip>
            <Avatar pip={PLAYER.trophies} onClick={onProfile} />
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
              {STACK.invested}
            </span>
          </div>
          <div style={{ height: 12, borderRadius: 6, overflow: "hidden", display: "flex" }}>
            {ALLOCATION.map((a, i) => (
              <div key={i} style={{ width: `${a.pct}%`, background: a.color }} />
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span style={{ color: "var(--text-2)" }}>Cash ready to trade</span>
            <span className="num" style={{ fontWeight: 700, color: "var(--gold)" }}>
              {STACK.cash}
            </span>
          </div>
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
          {HOLDINGS.map((h) => (
            <Card
              key={h.name}
              onClick={onOpenHolding}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px" }}
            >
              <Ticker role={h.role}>{h.ticker}</Ticker>
              <div style={{ flex: 1, textAlign: "left" }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{h.name}</div>
                <div className="num" style={{ fontSize: 12, color: "var(--text-2)" }}>
                  {h.shares} · {h.weight}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="num" style={{ fontSize: 15, fontWeight: 700 }}>
                  {h.value}
                </div>
                <div
                  className="num"
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: h.up ? "var(--green)" : "var(--magenta)",
                  }}
                >
                  {h.up ? "▲" : "▼"} {h.change}
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
