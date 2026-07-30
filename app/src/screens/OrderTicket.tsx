import { PhoneFrame, Screen } from "../components/PhoneFrame";
import { Button, Card, Chip, Sheet } from "../components/ui";
import { NVDA } from "../data";

/* 10 · ORDER TICKET — the stock screen dimmed behind a pulled-up ticket.
   Coins before / this order / coins after / fees, an arcade nudge, then the
   blinking LOCK IT IN. Delayed-price honesty repeats at the point of action:
   "fills at next price update".

   Note: the design's "Coins before $1,000,400" is stale against the $975,400
   balance shown on frame 09 — reproduced as designed, flagged in the README. */

export function OrderTicket({ onConfirm, onDismiss }: { onConfirm?: () => void; onDismiss?: () => void }) {
  return (
    <PhoneFrame glow="rgba(255,230,0,0.12)">
      {/* dimmed stock detail behind the sheet */}
      <Screen style={{ filter: "brightness(0.45) saturate(0.8)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <i className="ph ph-caret-left" style={{ fontSize: 22, color: "var(--cyan-soft)" }} />
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
            <div className="num" style={{ fontSize: 15, fontWeight: 700, color: "var(--green)" }}>
              ▲ {NVDA.change}
            </div>
          </div>
        </div>
        <Card background="var(--grad-indigo-card-170)" radius="var(--r-card)" padding="12px 10px 6px">
          <svg viewBox="0 0 340 130" style={{ width: "100%", height: 135 }}>
            <polyline points={NVDA.line} fill="none" stroke="#39ff14" strokeWidth="3.5" />
          </svg>
        </Card>
      </Screen>

      <Sheet>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Chip role="green">ORDER TICKET</Chip>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Cancel order"
            style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex" }}
          >
            <i className="ph ph-x" style={{ fontSize: 20, color: "var(--text-3)" }} />
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "var(--r-tile)",
              background: "#0c2d4a",
              boxShadow: "0 0 0 2px var(--cyan), 0 0 18px rgba(34,247,255,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 15,
              fontWeight: 700,
              color: "var(--cyan)",
            }}
          >
            NV
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 700 }}>Buy {NVDA.name}</div>
            <div className="num" style={{ fontSize: 13, color: "var(--text-2)" }}>
              {NVDA.price} as of 9:26 · fills at next price update
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="num" style={{ fontSize: 20, fontWeight: 700, color: "var(--cyan)" }}>
              {NVDA.orderAmount}
            </div>
            <div className="num" style={{ fontSize: 12, color: "var(--text-2)" }}>
              ≈ {NVDA.orderShares}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 9,
            borderRadius: "var(--r-tile)",
            padding: "14px 16px",
            background: "rgba(34,247,255,0.06)",
            boxShadow: "inset 0 0 0 1px rgba(34,247,255,0.2)",
          }}
        >
          <Line label="Coins before" value="$1,000,400" />
          <Line label="This order" value="−$25,000" color="var(--magenta)" />
          <Line label="Coins after" value="$975,400" color="var(--gold)" />
          <Line label="Fees" value="$0 · always" color="var(--green)" numeric={false} />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "11px 14px",
            borderRadius: 14,
            background: "rgba(255,230,0,0.08)",
            boxShadow: "inset 0 0 0 1.5px rgba(255,230,0,0.4)",
          }}
        >
          <i className="ph-fill ph-lightning" style={{ color: "var(--gold)", fontSize: 18 }} />
          <div style={{ fontSize: 13, color: "var(--gold)", flex: 1 }}>
            This puts you 1 good day from passing Maya.
          </div>
        </div>

        <Button
          variant="green"
          height={56}
          fontSize={16}
          caret
          blink
          onClick={onConfirm}
          style={{ boxShadow: "0 0 26px rgba(57,255,20,0.5), inset 0 -4px 0 rgba(0,0,0,0.2)" }}
        >
          LOCK IT IN
        </Button>
        <div style={{ textAlign: "center", fontSize: 12, color: "var(--text-4)" }}>
          Fake money · delayed prices · not investing advice · swipe down to cancel
        </div>
      </Sheet>
    </PhoneFrame>
  );
}

function Line({
  label,
  value,
  color,
  numeric = true,
}: {
  label: string;
  value: string;
  color?: string;
  numeric?: boolean;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
      <span style={{ color: "var(--text-2)" }}>{label}</span>
      <span className={numeric ? "num" : undefined} style={{ fontWeight: 700, color }}>
        {value}
      </span>
    </div>
  );
}
