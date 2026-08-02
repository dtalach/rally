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
  range: string;
  history: number[];
  /** Set when the window has fewer than two real samples to draw. */
  historyNote?: string;
};

/* The order can be sized in dollars or in shares. Kids think in both — "put
   $50 in" and "buy 3 shares" — and a share count typed here is sent as a share
   count, so the fill is exactly that many shares rather than an approximation
   of a dollar figure. */
type Unit = "usd" | "shares";

const USD_DECIMALS = 2;
/** Whole shares only — you buy 3 of something, not 3.4172 of it. */
const SHARE_DECIMALS = 0;

const decimalsFor = (unit: Unit) => (unit === "usd" ? USD_DECIMALS : SHARE_DECIMALS);

/** Keeps the field to digits and a single decimal point of the right depth. */
function sanitize(input: string, decimals: number) {
  const cleaned = input.replace(/[^0-9.]/g, "");
  const dot = cleaned.indexOf(".");
  if (dot === -1) return cleaned;
  // Whole-number fields drop the point along with everything after it, rather
  // than leaving a trailing "3." that reads as an unfinished number.
  if (decimals === 0) return cleaned.slice(0, dot);
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
  onRange,
  live,
}: {
  onNavigate?: (t: Tab) => void;
  onBack?: () => void;
  onReview?: (order: { side: "buy" | "sell"; shares?: number; all?: boolean }) => void;
  onRange?: (range: string) => void;
  live?: BuySellLive;
}) {
  const [range, setRange] = useState<(typeof RANGES)[number]>(
    (live?.range as (typeof RANGES)[number]) ?? "1D"
  );
  const [unit, setUnit] = useState<Unit>("shares");
  // Starts empty. A pre-filled figure is an order you didn't choose, and the
  // one that used to be here was the largest one you could afford.
  const [field, setField] = useState("");
  // While the field has focus it shows exactly what was typed; the rest of the
  // time it's grouped and prefixed, because $25,000 reads better than 25000.
  const [editing, setEditing] = useState(false);
  /* "ALL" has to mean every share, including the fraction of one left over from
     a dollar-sized order placed before whole shares were the rule. */
  const [wantsAll, setWantsAll] = useState(false);

  const price = live?.price ?? 0;
  const held = live?.position?.shares ?? 0;
  const balance = live?.balance ?? 0;
  const typed = parse(field);

  /* Whole shares are the order. A dollar figure is a way of saying how many —
     it floors to the shares it actually covers, so the ticket and the fill are
     the same number rather than a rounding apart. */
  const shares = Math.floor(unit === "shares" ? typed : price > 0 ? typed / price : 0);
  const cost = shares * price;

  const maxBuy = price > 0 ? Math.floor(balance / price) : 0;
  const maxSell = Math.floor(held);
  const canBuy = shares > 0 && shares <= maxBuy;
  const canSell = held > 0 && shares > 0 && shares <= maxSell;

  /* One message, for whichever limit the number in the box has broken. */
  const overBuy = shares > maxBuy;
  const overSell = held > 0 && shares > maxSell;
  const problem = !live
    ? undefined
    : overBuy && (held === 0 || overSell)
      ? {
          text: `${sharesText(shares)} shares costs ${moneyExact(cost)} — you have ${moneyExact(balance)}, enough for ${sharesText(maxBuy)}.`,
          fix: String(maxBuy),
        }
      : overBuy
        ? { text: `Too many to buy — ${moneyExact(balance)} covers ${sharesText(maxBuy)}.`, fix: String(maxBuy) }
        : overSell
          ? { text: `You only hold ${sharesText(maxSell)} shares of ${live.name}.`, fix: String(maxSell) }
          : undefined;

  const setUnitKeeping = (next: Unit) => {
    if (next === unit) return;
    setUnit(next);
    setWantsAll(false);
    if (price > 0 && typed > 0) {
      // Carry the order across, in the unit you're switching into.
      setField(next === "shares" ? String(shares) : toField(cost, next));
    }
  };

  const bump = (step: number) => {
    setWantsAll(false);
    setField((f) => toField(parse(f) + step, unit));
  };

  const setSize = (value: string, all = false) => {
    setWantsAll(all);
    setField(value);
  };

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
          {live?.historyNote ? (
            /* Two points make a line. Fewer than that and the honest thing is
               to say so, not to draw something. */
            <div
              style={{
                height: 135,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "0 24px",
                textAlign: "center",
              }}
            >
              <i className="ph ph-chart-line" style={{ fontSize: 26, color: "var(--text-3)" }} />
              <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.45 }}>
                {live.historyNote}
              </div>
            </div>
          ) : (
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
          )}
          <div style={{ display: "flex", gap: 6, padding: "4px 2px 6px" }}>
            {RANGES.map((r) => {
              const on = r === range;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setRange(r);
                    onRange?.(r);
                  }}
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

        <Card
          background="var(--grad-indigo-card-170)"
          radius="var(--r-card)"
          padding={16}
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", color: "var(--text-2)" }}>
              {live ? "HOW MANY" : "AMOUNT"}
            </div>
            <div className="num" style={{ fontSize: 12, color: "var(--cyan-soft)" }}>
              {live && held > 0 ? (
                <>
                  You hold: <span style={{ fontWeight: 700 }}>{sharesText(held)}</span> ·{" "}
                </>
              ) : null}
              Balance: <span style={{ fontWeight: 700 }}>{live ? live.balanceLabel : NVDA.balance}</span>
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
                over={Boolean(problem) && unit === "usd"}
                value={
                  unit === "usd" && editing
                    ? field
                    : shares > 0
                      ? `≈ ${moneyPlain(cost)}`
                      : ""
                }
                ariaLabel="Order amount in dollars"
                onFocus={() => setUnitKeeping("usd")}
                onChange={(v) => setSize(sanitize(v, USD_DECIMALS))}
                onEditing={setEditing}
              />
              <SizeBar
                label="SHARES"
                active={unit === "shares"}
                over={Boolean(problem) && unit === "shares"}
                value={
                  unit === "shares" && editing ? field : shares > 0 ? sharesText(shares) : ""
                }
                ariaLabel="Number of shares"
                onFocus={() => setUnitKeeping("shares")}
                onChange={(v) => setSize(sanitize(v, SHARE_DECIMALS))}
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
          {live && problem && (
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
                {problem.text}
              </div>
              <button
                type="button"
                onClick={() => setSize(problem.fix)}
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
                <AmountChip onClick={() => bump(100)}>+$100</AmountChip>
                <AmountChip onClick={() => bump(1000)}>+$1K</AmountChip>
              </>
            ) : (
              <>
                <AmountChip onClick={() => bump(1)}>+1</AmountChip>
                <AmountChip onClick={() => bump(10)}>+10</AmountChip>
              </>
            )}
            <AmountChip gold onClick={() => setSize(String(maxBuy))}>
              MAX BUY
            </AmountChip>
            {held > 0 && (
              <AmountChip gold onClick={() => setSize(String(maxSell), true)}>
                ALL
              </AmountChip>
            )}
          </div>
          {/* No Clear button: tapping a bar selects what's in it, so typing
              replaces it outright. */}
        </Card>

        {/* The side is chosen by which action you take, rather than by a mode
            switch you had to set first. SELL only appears when there's
            something to sell. */}
        <div style={{ display: "flex", gap: 10 }}>
          <Button
            variant="green"
            height={56}
            fontSize={16}
            caret
            onClick={() => onReview?.({ side: "buy", shares })}
            style={{
              flex: 1,
              boxShadow: "0 0 26px rgba(57,255,20,0.5), inset 0 -4px 0 rgba(0,0,0,0.2)",
            }}
            disabled={Boolean(live) && !canBuy}
          >
            BUY
          </Button>
          {(!live || held > 0) && (
            <Button
              variant="magenta"
              height={56}
              fontSize={16}
              caret
              onClick={() =>
                onReview?.(wantsAll ? { side: "sell", all: true } : { side: "sell", shares })
              }
              style={{
                flex: 1,
                boxShadow: "0 0 26px rgba(255,43,214,0.5), inset 0 -4px 0 rgba(0,0,0,0.25)",
              }}
              disabled={Boolean(live) && !canSell}
            >
              SELL
            </Button>
          )}
        </div>
        <div style={{ textAlign: "center", fontSize: 13, color: "var(--text-4)" }}>
          Zero fees · settles instantly · it's fake money
        </div>
      </Screen>
      <TabBar active="trade" onNavigate={onNavigate} />
    </PhoneFrame>
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
