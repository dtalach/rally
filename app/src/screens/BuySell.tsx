import { useState } from "react";
import { PhoneFrame, Screen } from "../components/PhoneFrame";
import { TabBar, type Tab } from "../components/TabBar";
import { BackCaret, Button, Card, Chip, GlowDot, GlowLine } from "../components/ui";
import { NVDA } from "../data";

/* 09 · TRADE · BUY/SELL — stock detail and the order builder.
   Prices are 15-minute delayed, and the UI says so rather than implying a
   live tick: "As of 9:26 AM · prices delayed 15 min". */

const RANGES = ["1D", "1W", "1M", "1Y"] as const;

export function BuySell({
  onNavigate,
  onBack,
  onReview,
}: {
  onNavigate?: (t: Tab) => void;
  onBack?: () => void;
  onReview?: () => void;
}) {
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [range, setRange] = useState<(typeof RANGES)[number]>("1D");

  return (
    <PhoneFrame glow="rgba(57,255,20,0.12)">
      <Screen>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <BackCaret onClick={onBack} />
          <Chip>
            {NVDA.symbol} · {NVDA.name.toUpperCase()}
          </Chip>
          <i className="ph ph-star" style={{ fontSize: 20, color: "var(--text-3)" }} />
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <div className="num" style={{ fontSize: 38, fontWeight: 700, letterSpacing: "-0.02em" }}>
              {NVDA.price}
            </div>
            <div
              className="num"
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "var(--green)",
                textShadow: "0 0 12px rgba(57,255,20,0.5)",
              }}
            >
              ▲ {NVDA.change}
            </div>
            <div className="num" style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>
              {NVDA.asOf}
            </div>
          </div>
          <div style={{ textAlign: "right", fontSize: 12, color: "var(--text-2)", lineHeight: 1.6 }}>
            You own
            <br />
            <span className="num" style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>
              {NVDA.shares}
            </span>
            <br />
            <span className="num" style={{ color: "var(--green)", fontWeight: 700 }}>
              {NVDA.gain}
            </span>
          </div>
        </div>

        <Card background="var(--grad-indigo-card-170)" radius="var(--r-card)" padding="12px 10px 6px">
          <svg viewBox="0 0 340 130" style={{ width: "100%", height: 135 }}>
            <line x1="0" y1="43" x2="340" y2="43" stroke="#241442" strokeWidth="1" />
            <line x1="0" y1="86" x2="340" y2="86" stroke="#241442" strokeWidth="1" />
            <GlowLine points={NVDA.line} color="#39ff14" width={3.5} bloom={12} />
            <GlowDot cx={340} cy={22} color="#39ff14" />
          </svg>
          <div style={{ display: "flex", gap: 6, padding: "4px 2px 6px" }}>
            {RANGES.map((r) => {
              const on = r === range;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRange(r)}
                  style={{
                    flex: 1,
                    textAlign: "center",
                    padding: "6px 0",
                    borderRadius: 8,
                    border: "none",
                    fontFamily: "inherit",
                    fontSize: 12,
                    cursor: "pointer",
                    ...(on
                      ? {
                          fontWeight: 700,
                          background: "rgba(34,247,255,0.15)",
                          color: "var(--cyan)",
                          boxShadow: "inset 0 0 0 1px rgba(34,247,255,0.5)",
                        }
                      : { fontWeight: 600, background: "transparent", color: "var(--text-3)" }),
                  }}
                >
                  {r}
                </button>
              );
            })}
          </div>
        </Card>

        {/* BUY / SELL */}
        <div style={{ display: "flex", gap: 6, padding: 4, borderRadius: 12, background: "var(--bg-card)" }}>
          <SideTab label="BUY" on={side === "buy"} role="green" onClick={() => setSide("buy")} />
          <SideTab label="SELL" on={side === "sell"} role="magenta" onClick={() => setSide("sell")} />
        </div>

        <Card
          background="var(--grad-indigo-card-170)"
          radius="var(--r-card)"
          padding={16}
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", color: "var(--text-2)" }}>
              AMOUNT
            </div>
            <div className="num" style={{ fontSize: 12, color: "var(--cyan-soft)" }}>
              Balance: <span style={{ fontWeight: 700 }}>{NVDA.balance}</span>
            </div>
          </div>
          <div
            className="num"
            style={{
              fontSize: 40,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              textAlign: "center",
              color: "var(--cyan)",
              textShadow: "0 0 18px rgba(34,247,255,0.5)",
            }}
          >
            {NVDA.orderAmount}
          </div>
          <div style={{ textAlign: "center", fontSize: 13, color: "var(--text-2)" }}>
            ≈{" "}
            <span className="num" style={{ fontWeight: 700, color: "#fff" }}>
              {NVDA.orderShares}
            </span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <AmountChip>+$1K</AmountChip>
            <AmountChip>+$10K</AmountChip>
            <AmountChip>+$100K</AmountChip>
            <AmountChip gold>MAX</AmountChip>
          </div>
        </Card>

        <Button
          variant={side === "buy" ? "green" : "magenta"}
          height={56}
          fontSize={16}
          caret
          onClick={onReview}
          style={{
            boxShadow:
              side === "buy"
                ? "0 0 26px rgba(57,255,20,0.5), inset 0 -4px 0 rgba(0,0,0,0.2)"
                : "0 0 26px rgba(255,43,214,0.5), inset 0 -4px 0 rgba(0,0,0,0.25)",
          }}
        >
          REVIEW {side.toUpperCase()}
        </Button>
        <div style={{ textAlign: "center", fontSize: 13, color: "var(--text-4)" }}>
          Zero fees · settles instantly · it's fake money
        </div>
      </Screen>
      <TabBar active="trade" onNavigate={onNavigate} />
    </PhoneFrame>
  );
}

function SideTab({
  label,
  on,
  role,
  onClick,
}: {
  label: string;
  on: boolean;
  role: "green" | "magenta";
  onClick: () => void;
}) {
  const activeSkin =
    role === "green"
      ? { background: "var(--grad-btn-green)", color: "var(--green-ink)", boxShadow: "0 0 16px rgba(57,255,20,0.45)" }
      : { background: "var(--grad-btn-magenta)", color: "#fff", boxShadow: "0 0 16px rgba(255,43,214,0.45)" };
  const idleSkin =
    role === "green"
      ? { background: "transparent", color: "var(--green)", boxShadow: "inset 0 0 0 1.5px rgba(57,255,20,0.5)" }
      : { background: "transparent", color: "var(--magenta)", boxShadow: "inset 0 0 0 1.5px rgba(255,43,214,0.5)" };

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        textAlign: "center",
        padding: "10px 0",
        borderRadius: 9,
        border: "none",
        fontFamily: "inherit",
        fontSize: 14,
        fontWeight: 700,
        letterSpacing: "0.08em",
        cursor: "pointer",
        ...(on ? activeSkin : idleSkin),
      }}
    >
      {label}
    </button>
  );
}

function AmountChip({ children, gold }: { children: React.ReactNode; gold?: boolean }) {
  return (
    <button
      type="button"
      className="num"
      style={{
        flex: 1,
        textAlign: "center",
        padding: "9px 0",
        borderRadius: 10,
        border: "none",
        fontFamily: "inherit",
        fontSize: 13,
        fontWeight: 700,
        cursor: "pointer",
        ...(gold
          ? {
              background: "rgba(255,230,0,0.12)",
              color: "var(--gold)",
              boxShadow: "inset 0 0 0 1.5px rgba(255,230,0,0.5)",
            }
          : {
              background: "transparent",
              color: "var(--cyan-soft)",
              boxShadow: "inset 0 0 0 1.5px rgba(34,247,255,0.4)",
            }),
      }}
    >
      {children}
    </button>
  );
}
