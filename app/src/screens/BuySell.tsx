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
/** Matches the six decimals the server stores holdings in. */
const SHARE_DECIMALS = 6;

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

/** Cents always, so a computed figure can't come out as $360,876.7. */
const moneyPlain = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const moneyExact = (n: number) => `$${moneyPlain(n)}`;
const sharesText = (n: number) =>
  n.toLocaleString("en-US", { maximumFractionDigits: SHARE_DECIMALS });
/** Two decimals is enough to read an estimate by. */
const sharesShort = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });

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
  const shares = unit === "shares" ? typed : price > 0 ? amount / price : 0;

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
  const maxField = unit === "usd" ? String(Math.floor(max)) : toField(max, unit);

  /* Said in the unit they're typing in, and always with the number that fits,
     so "too much" is never a dead end. */
  const overMessage = !live
    ? ""
    : side === "buy"
      ? unit === "usd"
        ? `Too much — you only have ${moneyExact(live.balance)}.`
        : `Too many — ${sharesText(max)} shares is all your ${moneyExact(live.balance)} buys.`
      : unit === "usd"
        ? `You only hold ${moneyExact(heldValue)} of ${live.name}.`
        : `You only hold ${sharesText(held)} shares of ${live.name}.`;

  const setUnitKeeping = (next: Unit) => {
    if (next === unit) return;
    setUnit(next);
    if (price > 0 && typed > 0) {
      // Floored to the two decimals the estimate was showing, so the number
      // you tap into is the number you were just looking at — and so a switch
      // can never nudge the order past the cash it was inside a moment ago.
      const converted = next === "shares" ? typed / price : typed * price;
      setField(toField(Math.floor(converted * 100) / 100, next));
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
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", color: "var(--text-2)" }}>
              {live ? (side === "buy" ? "HOW MUCH TO BUY" : "HOW MUCH TO SELL") : "AMOUNT"}
            </div>
            <div className="num" style={{ fontSize: 12, color: "var(--cyan-soft)" }}>
              {live && side === "sell" ? (
                <>
                  You hold: <span style={{ fontWeight: 700 }}>{sharesText(held)} shares</span>
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
            /* Two bars, both typeable. The one you last touched is the one the
               order is sized in — a share count typed here is sent as shares —
               and the other shows what that works out to at the last price. */
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <SizeBar
                label="DOLLARS"
                active={unit === "usd"}
                over={overMax && unit === "usd"}
                value={
                  unit === "usd"
                    ? editing
                      ? field
                      : field === ""
                        ? ""
                        : typed.toLocaleString("en-US", { maximumFractionDigits: USD_DECIMALS })
                    : `≈ ${moneyPlain(amount)}`
                }
                ariaLabel="Order amount in dollars"
                onFocus={() => setUnitKeeping("usd")}
                onChange={(v) => setField(sanitize(v, USD_DECIMALS))}
                onEditing={setEditing}
              />
              <SizeBar
                label="SHARES"
                active={unit === "shares"}
                over={overMax && unit === "shares"}
                value={
                  unit === "shares"
                    ? editing
                      ? field
                      : field === ""
                        ? ""
                        : sharesText(typed)
                    : `≈ ${sharesShort(shares)}`
                }
                ariaLabel="Number of shares"
                onFocus={() => setUnitKeeping("shares")}
                onChange={(v) => setField(sanitize(v, SHARE_DECIMALS))}
                onEditing={setEditing}
              />
            </div>
          ) : (
            <>
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
            </>
          )}

          {/* Over the limit gets said out loud, with the number that fits and a
              one-tap way to take it. */}
          {live && overMax && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "11px 13px",
                borderRadius: 14,
                background: "rgba(255,43,214,0.09)",
                boxShadow: "inset 0 0 0 1.5px rgba(255,43,214,0.45)",
              }}
            >
              <i className="ph-fill ph-warning" style={{ fontSize: 18, color: "var(--magenta)" }} />
              <div style={{ flex: 1, fontSize: 12.5, color: "var(--magenta)", lineHeight: 1.4 }}>
                {overMessage}
              </div>
              <button
                type="button"
                onClick={() => setField(maxField)}
                style={{
                  background: "none",
                  border: "none",
                  padding: "4px 2px",
                  fontFamily: "inherit",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--gold)",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                USE MAX
              </button>
            </div>
          )}

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
            <AmountChip gold onClick={() => setField(maxField)}>
              MAX
            </AmountChip>
          </div>
          {/* No Clear button: tapping a bar selects what's in it, so typing
              replaces it outright. */}
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

/**
 * One typeable bar. The active one holds what you typed; the other shows the
 * conversion, and tapping it makes it the one you're typing in.
 */
function SizeBar({
  label,
  active,
  over,
  value,
  ariaLabel,
  onFocus,
  onChange,
  onEditing,
}: {
  label: string;
  active: boolean;
  over: boolean;
  value: string;
  ariaLabel: string;
  onFocus: () => void;
  onChange: (value: string) => void;
  onEditing: (editing: boolean) => void;
}) {
  const ring = over
    ? "inset 0 0 0 1.5px rgba(255,43,214,0.7)"
    : active
      ? "inset 0 0 0 1.5px rgba(34,247,255,0.65), 0 0 16px rgba(34,247,255,0.16)"
      : "inset 0 0 0 1px rgba(34,247,255,0.22)";

  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 14px",
        borderRadius: "var(--r-tile)",
        background: active ? "rgba(34,247,255,0.07)" : "rgba(10,6,30,0.35)",
        boxShadow: ring,
        cursor: "text",
      }}
    >
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.1em",
          color: active ? "var(--cyan-soft)" : "var(--text-3)",
          flexShrink: 0,
          width: 52,
        }}
      >
        {label}
      </span>
      <input
        className="num"
        value={value}
        placeholder="0"
        onChange={(e) => onChange(e.target.value)}
        onFocus={(e) => {
          onFocus();
          onEditing(true);
          // Tapping a bar replaces what's in it — the common intent — rather
          // than dropping a caret into the middle of the old number.
          e.currentTarget.select();
        }}
        onBlur={() => onEditing(false)}
        inputMode="decimal"
        type="text"
        enterKeyHint="done"
        aria-label={ariaLabel}
        style={{
          flex: 1,
          minWidth: 0,
          border: "none",
          background: "transparent",
          fontFamily: "inherit",
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          textAlign: "right",
          color: over ? "var(--magenta)" : active ? "var(--cyan)" : "var(--text-2)",
          textShadow: active && !over ? "0 0 16px rgba(34,247,255,0.45)" : "none",
          padding: 0,
          outline: "none",
          caretColor: "var(--cyan)",
        }}
      />
    </label>
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
