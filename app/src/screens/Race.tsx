import { useState } from "react";
import { PhoneFrame, Screen } from "../components/PhoneFrame";
import { TabBar, type Tab } from "../components/TabBar";
import { Avatar, Card, Chip, GlowDot, GlowLine, Nudge, ROLE, Segmented, Title, type Role } from "../components/ui";
import { RACE_LINES, RACE_STANDINGS, SEASON } from "../data";

/* 05 · RACE — the crew race for the current period.
   Winning is always on % gain, so the toggle is MO / QTR / YR beside the
   crew/league scope. P1/P2/P3 tags carry through from the chart to the rows.

   Note: this frame still carries the standalone streak flame chip and a
   pip-less avatar from before the "one signal, one home" consolidation pass —
   reproduced as designed. See README for the flagged inconsistency. */

export type RaceLive = {
  /** JULY · Q3 · FY2026 — follows the MO/QTR/YR toggle. */
  label: string;
  streak: number;
  standings: {
    id: number;
    name: string;
    you: boolean;
    tag: string;
    role: string;
    stackLabel: string;
    returnLabel: string;
    series: number[];
    return: number;
  }[];
  /** Computed from the standings above — omitted when there's nothing true to say. */
  nudge?: string;
  /** LEAGUE swaps the chart for the high-score board; both read the same period. */
  onScope?: (scope: "crew" | "league") => void;
  onPeriod: (p: "month" | "quarter" | "year") => void;
  period: "month" | "quarter" | "year";
};

const PERIOD_TAB: Record<"mo" | "qtr" | "yr", "month" | "quarter" | "year"> = {
  mo: "month",
  qtr: "quarter",
  yr: "year",
};

/* Chart geometry. The plot is inset on the left for the % axis and on the
   right for the P1/P2/P3 end tags. */
const PLOT_LEFT = 38;
const PLOT_RIGHT = 302;
const PLOT_TOP = 26;
const PLOT_BOTTOM = 226;

/** Two percentage points — the narrowest the % axis is ever drawn. */
const MIN_SPAN = 0.02;

/** Each series as a return relative to its own first day. */
const normalise = (s: number[]) => s.map((v) => (s[0] > 0 ? v / s[0] - 1 : 0));

/**
 * One shared vertical scale across every player — the race is about who gained
 * more, so the curves have to be directly comparable. Zero is always included,
 * because "flat since the period started" is the line that matters.
 */
function domain(allSeries: number[][]) {
  const flat = allSeries.filter((x) => x.length > 1).map(normalise).flat();
  let lo = Math.min(0, ...flat);
  let hi = Math.max(0, ...flat);

  // A race where nobody has moved yet would otherwise collapse to a zero-height
  // scale and print "+0%" on every tick. Hold the axis open at ±1% until real
  // spread exceeds it.
  if (hi - lo < MIN_SPAN) {
    lo = Math.min(lo, -MIN_SPAN / 2);
    hi = Math.max(hi, MIN_SPAN / 2);
  }

  const pad = (hi - lo) * 0.12;
  return { lo: lo - pad, hi: hi + pad };
}

const yFor = (v: number, lo: number, hi: number) =>
  PLOT_BOTTOM - ((v - lo) / (hi - lo)) * (PLOT_BOTTOM - PLOT_TOP);

function linePoints(series: number[], lo: number, hi: number) {
  if (series.length < 2) return "";
  const mine = normalise(series);
  const stepX = (PLOT_RIGHT - PLOT_LEFT) / (mine.length - 1);
  return mine
    .map((v, i) => `${(PLOT_LEFT + i * stepX).toFixed(1)},${yFor(v, lo, hi).toFixed(1)}`)
    .join(" ");
}

/** Round tick values (1/2/5 x 10^n) so the axis reads in whole percents. */
function niceTicks(lo: number, hi: number, count = 4) {
  const rough = (hi - lo) / count || 0.01;
  const mag = 10 ** Math.floor(Math.log10(rough));
  const norm = rough / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag;
  const ticks: number[] = [];
  for (let t = Math.ceil(lo / step) * step; t <= hi + 1e-9; t += step) ticks.push(t);
  return ticks;
}

const tickLabel = (v: number) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v * 100).toFixed(0)}%`;

const lastPoint = (points: string) => {
  const parts = points.split(" ");
  const [x, y] = (parts[parts.length - 1] ?? "0,0").split(",").map(Number);
  return { x, y };
};

export function Race({ onNavigate, live }: { onNavigate?: (t: Tab) => void; live?: RaceLive }) {
  const [scope, setScope] = useState<"crew" | "league">("crew");
  const [period, setPeriod] = useState<"mo" | "qtr" | "yr">("mo");
  /** Tapping a row isolates that racer's line; tapping it again clears. */
  const [focused, setFocused] = useState<string | null>(null);

  const standings = live?.standings;
  const allSeries = standings?.map((s) => s.series) ?? [];
  const { lo, hi } = domain(allSeries);
  const ticks = niceTicks(lo, hi);

  return (
    <PhoneFrame>
      <Screen scroll>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <Title>THE RACE</Title>
            <Chip role="gold">{live ? live.label : SEASON.month}</Chip>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "5px 10px",
                borderRadius: 20,
                border: "1.5px solid var(--gold)",
                fontSize: 13,
                fontWeight: 700,
                color: "var(--gold)",
                boxShadow: "0 0 12px rgba(255,230,0,0.4)",
              }}
            >
              <i className="ph-fill ph-flame" />
              <span className="num">{live ? live.streak : 9}</span>
            </div>
            <Avatar ring={false} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
          <Segmented
            options={[
              { id: "crew", label: "MY CREW" },
              { id: "league", label: "LEAGUE" },
            ]}
            value={scope}
            onChange={(next) => {
              setScope(next);
              live?.onScope?.(next);
            }}
            activeSkin="magenta"
            style={{ flex: 1 }}
          />
          <div style={{ display: "flex", gap: 6, padding: 4, borderRadius: 12, background: "var(--bg-card)" }}>
            {(["mo", "qtr", "yr"] as const).map((p) => {
              const on = p === period;
              return (
                <button
                  key={p}
                  type="button"
                  className="num"
                  onClick={() => {
                    setPeriod(p);
                    live?.onPeriod(PERIOD_TAB[p]);
                  }}
                  style={{
                    textAlign: "center",
                    padding: "8px 10px",
                    borderRadius: 9,
                    border: "none",
                    fontFamily: "inherit",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    ...(on
                      ? {
                          background: "rgba(34,247,255,0.15)",
                          color: "var(--cyan)",
                          boxShadow: "inset 0 0 0 1px rgba(34,247,255,0.5)",
                        }
                      : { background: "transparent", color: "var(--text-2)" }),
                  }}
                >
                  {p.toUpperCase()}
                </button>
              );
            })}
          </div>
        </div>

        <Card
          background="var(--grad-indigo-card-170)"
          radius="var(--r-card)"
          padding="14px 12px 8px"
          style={{ flexShrink: 0 }}
        >
          <svg viewBox="0 0 340 240" style={{ width: "100%", height: 250 }}>
            {standings ? (
              <>
                {/* % return axis — without it the lines are decorative. */}
                {ticks.map((t) => {
                  const y = yFor(t, lo, hi);
                  const isZero = Math.abs(t) < 1e-9;
                  return (
                    <g key={t}>
                      <line
                        x1={PLOT_LEFT}
                        y1={y}
                        x2={PLOT_RIGHT}
                        y2={y}
                        stroke={isZero ? "#3a2f6e" : "#241442"}
                        strokeWidth="1"
                        strokeDasharray={isZero ? undefined : "3 4"}
                      />
                      <text
                        x={PLOT_LEFT - 6}
                        y={y + 3.5}
                        textAnchor="end"
                        fill={isZero ? "var(--text-2)" : "var(--text-3)"}
                        fontSize="9"
                        fontWeight="700"
                        fontFamily="Chakra Petch"
                      >
                        {tickLabel(t)}
                      </text>
                    </g>
                  );
                })}

                {/* Draw unfocused lines first so the focused one sits on top. */}
                {[...standings]
                  .sort((a, b) => Number(String(a.id) === focused) - Number(String(b.id) === focused))
                  .map((r) => {
                    const points = linePoints(r.series, lo, hi);
                    if (!points) return null;
                    const color = ROLE[r.role as Role]?.base ?? "#22f7ff";
                    const end = lastPoint(points);
                    const dimmed = focused !== null && String(r.id) !== focused;
                    return (
                      <g key={r.id} opacity={dimmed ? 0.16 : 1}>
                        <GlowLine
                          points={points}
                          color={color}
                          width={r.you ? 4.5 : 3}
                          bloom={dimmed ? 0 : r.you ? 14 : 11}
                        />
                        <GlowDot cx={end.x} cy={end.y} r={r.you ? 6 : 5} color={color} />
                        <text
                          x={end.x + 9}
                          y={end.y + 4}
                          fill={color}
                          fontSize="11"
                          fontWeight="700"
                          fontFamily="Chakra Petch"
                        >
                          {r.tag}
                        </text>
                      </g>
                    );
                  })}
              </>
            ) : (
              <>
                {[60, 120, 180].map((y) => (
                  <line key={y} x1="0" y1={y} x2="340" y2={y} stroke="#241442" strokeWidth="1" />
                ))}
                <GlowLine points={RACE_LINES.p1} color="#39ff14" width={3.5} bloom={12} />
                <GlowLine points={RACE_LINES.p2} color="#22f7ff" width={4.5} bloom={14} />
                <GlowLine points={RACE_LINES.p3} color="#ff2bd6" width={3} bloom={10} />
                <GlowDot cx={310} cy={34} r={5} color="#39ff14" />
                <text x="320" y="38" fill="#39ff14" fontSize="11" fontWeight="700" fontFamily="Chakra Petch">
                  P1
                </text>
                <GlowDot cx={310} cy={86} r={6} color="#22f7ff" />
                <text x="320" y="90" fill="#22f7ff" fontSize="11" fontWeight="700" fontFamily="Chakra Petch">
                  P2
                </text>
                <GlowDot cx={310} cy={146} r={5} color="#ff2bd6" />
                <text x="320" y="150" fill="#ff2bd6" fontSize="11" fontWeight="700" fontFamily="Chakra Petch">
                  P3
                </text>
              </>
            )}
          </svg>
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
          {(
            standings ??
            RACE_STANDINGS.map((r) => ({ ...r, id: r.tag, stackLabel: r.stack, returnLabel: r.pct }))
          ).map((r) => {
            const tint = ROLE[r.role as Role] ?? ROLE.cyan;
            const id = String(r.id);
            const isFocused = focused === id;
            const dimmed = focused !== null && !isFocused;

            return (
              <button
                key={r.id}
                type="button"
                className="press"
                aria-pressed={isFocused}
                onClick={() => setFocused(isFocused ? null : id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "11px 14px",
                  borderRadius: "var(--r-tile)",
                  border: "none",
                  font: "inherit",
                  color: "inherit",
                  textAlign: "left",
                  width: "100%",
                  cursor: "pointer",
                  // Focus is shown in the racer's own colour, so the row and the
                  // line it isolates read as the same object.
                  opacity: dimmed ? 0.45 : 1,
                  transition: "opacity 160ms ease",
                  ...(isFocused
                    ? {
                        background: `rgba(${tint.rgb},0.1)`,
                        boxShadow: `0 0 0 1.5px ${tint.base}, 0 0 20px rgba(${tint.rgb},0.35)`,
                      }
                    : r.you
                      ? {
                          background: "var(--grad-cyan-card)",
                          boxShadow: "0 0 0 1.5px var(--cyan), 0 0 20px rgba(34,247,255,0.3)",
                        }
                      : { background: "var(--bg-card)", boxShadow: "var(--ring)" }),
                }}
              >
                {r.you ? <Chip>{r.tag}</Chip> : <Chip role={r.role as Role}>{r.tag}</Chip>}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>
                    {r.name}
                    {r.you && <span style={{ fontSize: 11, color: "var(--cyan)" }}> ◄ YOU</span>}
                  </div>
                  <div className="num" style={{ fontSize: 12, color: "var(--text-2)" }}>
                    {r.stackLabel}
                  </div>
                </div>
                <div
                  className="num"
                  style={{
                    fontSize: 17,
                    fontWeight: 700,
                    color: tint.base,
                    textShadow: `0 0 12px rgba(${tint.rgb},0.5)`,
                  }}
                >
                  {r.returnLabel}
                </div>
              </button>
            );
          })}
        </div>

        {focused !== null && (
          <button
            type="button"
            onClick={() => setFocused(null)}
            style={{
              alignSelf: "center",
              background: "none",
              border: "none",
              fontFamily: "inherit",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.12em",
              color: "var(--cyan-soft)",
              cursor: "pointer",
              padding: "2px 0",
              flexShrink: 0,
            }}
          >
            SHOW ALL RACERS
          </button>
        )}

        {live ? (
          live.nudge && <Nudge>{live.nudge}</Nudge>
        ) : (
          <Nudge>Maya passed you at 10:04. Avenge yourself.</Nudge>
        )}
      </Screen>
      <TabBar active="race" onNavigate={onNavigate} />
    </PhoneFrame>
  );
}
