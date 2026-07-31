import { useState } from "react";
import { PhoneFrame, Screen } from "../components/PhoneFrame";
import { TabBar, type Tab } from "../components/TabBar";
import { BackCaret, Button, Card, Chip, GlowDot, GlowLine } from "../components/ui";
import { NVDA } from "../data";

/* 09 · TRADE · BUY/SELL — stock detail and the order builder.
   Prices are 15-minute delayed, and the UI says so rather than implying a
   live tick: "As of 9:26 AM · prices delayed 15 min". */

const RANGES = ["1D", "1W", "1M", "1Y"] as const;

export type BuySellLive = {
  symbol: string;
  name: string;
  priceLabel: string;
  changeLabel: string;
  up: boolean;
  asOfLabel: string;
  balanceLabel: string;
  balance: number;
  price: number;
  position: {
    shares: number;
    sharesLabel: string;
    valueLabel: string;
    gainLabel: string;
    up: boolean;
  } | null;
  history: number[];
};

/* The order can be sized in dollars or in shares. Kids think in both — "put
   $50 in" and "buy 3 shares" — and a share count typed here is sent as a share
   count, so the fill is exactly that many shares rather than an approximation
   of a dollar figure. */
type Unit = "usd" | "shares";

const USD_DECIMALS = 2;
const SHARE_DECIMALS = 4;

const decimalsFor = (unit: Unit) => (unit === "usd" ? USD_DECIMALS : SHARE_DECIMALS);

/** Keeps the field to digits and a single decimal point of the right depth. */
function sanitize(input: string, decimals: number) {
  const cleaned = input.replace(/[^0-9.]/g, "");
  const dot = cleaned.indexOf(".");
  if (dot === -1) return cleaned;
  const whole = cleaned.slice(0, dot);
  const rest = cleaned.slice(dot + 1).replace(/\./g, "");
  return `${whole}.${rest.slice(0, decimals)}`;
}

const parse = (raw: string) => {
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
};

/** Trims to the unit's precision without leaving trailing zeroes in the field. */
const toField = (n: number, unit: Unit) => String(Number(n.toFixed(decimalsFor(unit))));

/** For the field itself: $25,000 rather than $25,000.00. */
const money = (n: number) =>
  `$${n.toLocaleString("en-US", { maximumFractionDigits: USD_DECIMALS })}`;
/** For figures the app computed: cents always, so $360,876.7 can't happen. */
const moneyExact = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const sharesText = (n: number) =>
  n.toLocaleString("en-US", { maximumFractionDigits: SHARE_DECIMALS });

/** Maps a price series into the 340x130 chart box. */
function priceLine(history: number[]) {
  if (history.length < 2) return NVDA.line;
  const lo = Math.min(...history);
  const hi = Math.max(...history);
  const span = hi - lo || 1;
  const stepX = 340 / (history.length - 1);
  return history
    .map((v, i) => `${(i * stepX).toFixed(1)},${(118 - ((v - lo) / span) * 100).toFixed(1)}`)
    .join(" ");
}

export function BuySell({
  onNavigate,
  onBack,
  onReview,
  live,
}: {
  onNavigate?: (t: Tab) => void;
  onBack?: () => void;
  onReview?: (order: { side: "buy" | "sell"; amount?: number; shares?: number }) => void;
  live?: BuySellLive;
}) {
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [range, setRange] = useState<(typeof RANGES)[number]>("1D");
  const [unit, setUnit] = useState<Unit>("usd");
  const [field, setField] = useState("25000");
  // While the field has focus it shows exactly what was typed; the rest of the
  // time it's grouped and prefixed, because $25,000 reads better than 25000.
  const [editing, setEditing] = useState(false);

  const price = live?.price ?? 0;
  const held = live?.position?.shares ?? 0;
  const heldValue = held * price;
  const typed = parse(field);

  const amount = unit === "usd" ? typed : typed * price;
  const shares = unit === "shares" ? typed : price > 0 ? amount / price : 145;

  /* The most you can ask for, in whatever unit is showing. A buy in shares is
     floored to whole cents' worth so the estimate can't round past your cash. */
  const max = !live
    ? 975400
    : unit === "usd"
      ? side === "buy"
        ? live.balance
        : heldValue
      : side === "buy"
        ? price > 0
          ? Math.floor((live.balance / price) * 100) / 100
          : 0
        : held;

  const overMax = unit === "usd" ? typed > max + 0.01 : typed > max + 0.000001;

  const setUnitKeeping = (next: Unit) => {
    if (next === unit) return;
    setUnit(next);
    if (price > 0 && typed > 0) {
      setField(toField(next === "shares" ? typed / price : typed * price, next));
    }
  };

  const bump = (step: number) => setField((f) => toField(parse(f) + step, unit));

  return (
    <PhoneFrame glow="rgba(57,255,20,0.12)">
      <Screen>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <BackCaret onClick={onBack} />
          <Chip>
            {live ? live.symbol : NVDA.symbol} · {(live ? live.name : NVDA.name).toUpperCase()}
          </Chip>
          <i className="ph ph-star" style={{ fontSize: 20, color: "var(--text-3)" }} />
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <div className="num" style={{ fontSize: 38, fontWeight: 700, letterSpacing: "-0.02em" }}>
              {live ? live.priceLabel : NVDA.price}
            </div>
            <div
              className="num"
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: live && !live.up ? "var(--magenta)" : "var(--green)",
                textShadow: `0 0 12px ${live && !live.up ? "rgba(255,43,214,0.5)" : "rgba(57,255,20,0.5)"}`,
              }}
            >
              {live && !live.up ? "▼" : "▲"} {live ? live.changeLabel : NVDA.change}
            </div>
            <div className="num" style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>
              {live ? live.asOfLabel : NVDA.asOf}
            </div>
          </div>
          {(!live || live.position) && (
            <div style={{ textAlign: "right", fontSize: 12, color: "var(--text-2)", lineHeight: 1.6 }}>
              You own
              <br />
              <span className="num" style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>
                {live ? live.position!.sharesLabel : NVDA.shares}
              </span>
              <br />
              <span
                className="num"
                style={{
                  color: live && !live.position!.up ? "var(--magenta)" : "var(--green)",
                  fontWeight: 700,
                }}
              >
                {live ? live.position!.gainLabel : NVDA.gain}
              </span>
            </div>
          )}
        </div>

        <Card background="var(--grad-indigo-card-170)" radius="var(--r-card)" padding="12px 10px 6px">
          <svg viewBox="0 0 340 130" style={{ width: "100%", height: 135 }}>
            <line x1="0" y1="43" x2="340" y2="43" stroke="#241442" strokeWidth="1" />
            <line x1="0" y1="86" x2="340" y2="86" stroke="#241442" strokeWidth="1" />
            {(() => {
              const color = live && !live.up ? "#ff2bd6" : "#39ff14";
              const points = live ? priceLine(live.history) : NVDA.line;
              const last = points.split(" ").pop()!.split(",").map(Number);
              return (
                <>
                  <GlowLine points={points} color={color} width={3.5} bloom={12} />
                  <GlowDot cx={last[0]} cy={last[1]} color={color} />
                </>
              );
            })()}
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            {live ? (
              <div style={{ display: "flex", gap: 5 }}>
                <UnitTab label="$" on={unit === "usd"} onClick={() => setUnitKeeping("usd")} />
                <UnitTab
                  label="SHARES"
                  on={unit === "shares"}
                  onClick={() => setUnitKeeping("shares")}
                />
              </div>
            ) : (
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", color: "var(--text-2)" }}>
                AMOUNT
              </div>
            )}
            <div className="num" style={{ fontSize: 12, color: "var(--cyan-soft)" }}>
              {live && side === "sell" ? (
                <>
                  You hold:{" "}
                  <span style={{ fontWeight: 700 }}>
                    {unit === "shares" ? sharesText(held) : moneyExact(heldValue)}
                  </span>
                </>
              ) : (
                <>
                  Balance:{" "}
                  <span style={{ fontWeight: 700 }}>{live ? live.balanceLabel : NVDA.balance}</span>
                </>
              )}
            </div>
          </div>
          {live ? (
            <input
              className="num"
              value={editing ? field : unit === "usd" ? money(typed) : sharesText(typed)}
              onChange={(e) => setField(sanitize(e.target.value, decimalsFor(unit)))}
              onFocus={(e) => {
                setEditing(true);
                // Tapping the figure replaces it — the common intent — rather
                // than dropping a caret into the middle of the old number.
                e.currentTarget.select();
              }}
              onBlur={() => setEditing(false)}
              inputMode="decimal"
              type="text"
              enterKeyHint="done"
              aria-label={unit === "usd" ? "Order amount in dollars" : "Number of shares"}
              style={{
                width: "100%",
                border: "none",
                background: "transparent",
                fontFamily: "inherit",
                fontSize: 40,
                fontWeight: 700,
                letterSpacing: "-0.02em",
                textAlign: "center",
                color: "var(--cyan)",
                textShadow: "0 0 18px rgba(34,247,255,0.5)",
                padding: 0,
                outline: "none",
                caretColor: "var(--cyan)",
              }}
            />
          ) : (
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
          )}
          <div style={{ textAlign: "center", fontSize: 13, color: overMax ? "var(--magenta)" : "var(--text-2)" }}>
            {overMax ? (
              side === "buy" ? (
                unit === "shares" ? (
                  `${moneyExact(amount)} — more than your cash`
                ) : (
                  "More than your cash"
                )
              ) : (
                "More than you hold"
              )
            ) : (
              <>
                ≈{" "}
                <span className="num" style={{ fontWeight: 700, color: "#fff" }}>
                  {!live
                    ? NVDA.orderShares
                    : unit === "usd"
                      ? `${shares.toLocaleString("en-US", { maximumFractionDigits: 2 })} shares`
                      : moneyExact(amount)}
                </span>
              </>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {unit === "usd" ? (
              <>
                <AmountChip onClick={() => bump(1000)}>+$1K</AmountChip>
                <AmountChip onClick={() => bump(10000)}>+$10K</AmountChip>
                <AmountChip onClick={() => bump(100000)}>+$100K</AmountChip>
              </>
            ) : (
              <>
                <AmountChip onClick={() => bump(1)}>+1</AmountChip>
                <AmountChip onClick={() => bump(10)}>+10</AmountChip>
                <AmountChip onClick={() => bump(100)}>+100</AmountChip>
              </>
            )}
            <AmountChip
              gold
              onClick={() => setField(unit === "usd" ? String(Math.floor(max)) : toField(max, unit))}
            >
              MAX
            </AmountChip>
          </div>
          {live && (
            <button
              type="button"
              onClick={() => setField("")}
              style={{
                background: "none",
                border: "none",
                fontFamily: "inherit",
                fontSize: 12,
                color: "var(--text-3)",
                cursor: "pointer",
                padding: 0,
              }}
            >
              Clear
            </button>
          )}
        </Card>

        <Button
          variant={side === "buy" ? "green" : "magenta"}
          height={56}
          fontSize={16}
          caret
          onClick={() =>
            onReview?.(unit === "usd" ? { side, amount: typed } : { side, shares: typed })
          }
          style={{
            boxShadow:
              side === "buy"
                ? "0 0 26px rgba(57,255,20,0.5), inset 0 -4px 0 rgba(0,0,0,0.2)"
                : "0 0 26px rgba(255,43,214,0.5), inset 0 -4px 0 rgba(0,0,0,0.25)",
          }}
          disabled={Boolean(live) && (overMax || typed <= 0 || amount < 1)}
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

/** Dollars-or-shares switch, sized to sit where the AMOUNT label used to. */
function UnitTab({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      style={{
        padding: "5px 10px",
        borderRadius: 8,
        border: "none",
        fontFamily: "inherit",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.08em",
        cursor: "pointer",
        ...(on
          ? {
              background: "rgba(34,247,255,0.15)",
              color: "var(--cyan)",
              boxShadow: "inset 0 0 0 1px rgba(34,247,255,0.5)",
            }
          : {
              background: "transparent",
              color: "var(--text-3)",
              boxShadow: "inset 0 0 0 1px rgba(34,247,255,0.18)",
            }),
      }}
    >
      {label}
    </button>
  );
}

function AmountChip({
  children,
  gold,
  onClick,
}: {
  children: React.ReactNode;
  gold?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
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
