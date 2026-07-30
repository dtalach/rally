import { useState } from "react";
import { PhoneFrame, Screen } from "../components/PhoneFrame";
import { TabBar, type Tab } from "../components/TabBar";
import { Card, Chip, GlowDot, GlowLine, Nudge, ROLE, Segmented, Title, type Role } from "../components/ui";
import { RACE_LINES, RACE_STANDINGS, SEASON } from "../data";

/* 05 · RACE — the crew race for the current period.
   Winning is always on % gain, so the toggle is MO / QTR / YR beside the
   crew/league scope. P1/P2/P3 tags carry through from the chart to the rows.

   Note: this frame still carries the standalone streak flame chip and a
   pip-less avatar from before the "one signal, one home" consolidation pass —
   reproduced as designed. See README for the flagged inconsistency. */

export type RaceLive = {
  monthLabel: string;
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
  }[];
  onPeriod: (p: "month" | "quarter" | "year") => void;
  period: "month" | "quarter" | "year";
};

const PERIOD_TAB: Record<"mo" | "qtr" | "yr", "month" | "quarter" | "year"> = {
  mo: "month",
  qtr: "quarter",
  yr: "year",
};

/**
 * Maps each player's value series into the chart's 340x240 viewBox. All lines
 * share one scale — the race is about who gained more, so the curves must be
 * directly comparable, and each is normalised to its own starting value.
 */
function linePoints(series: number[], allSeries: number[][]) {
  if (series.length < 2) return "";

  const normalise = (s: number[]) => s.map((v) => (s[0] > 0 ? v / s[0] - 1 : 0));
  const allNorm = allSeries.filter((s) => s.length > 1).map(normalise);
  const flat = allNorm.flat();
  const lo = Math.min(0, ...flat);
  const hi = Math.max(0.0001, ...flat);

  const mine = normalise(series);
  const stepX = 310 / (mine.length - 1);
  return mine
    .map((v, i) => `${(i * stepX).toFixed(1)},${(226 - ((v - lo) / (hi - lo)) * 200).toFixed(1)}`)
    .join(" ");
}

const lastPoint = (points: string) => {
  const parts = points.split(" ");
  const [x, y] = (parts[parts.length - 1] ?? "0,0").split(",").map(Number);
  return { x, y };
};

export function Race({ onNavigate, live }: { onNavigate?: (t: Tab) => void; live?: RaceLive }) {
  const [scope, setScope] = useState<"crew" | "league">("crew");
  const [period, setPeriod] = useState<"mo" | "qtr" | "yr">("mo");

  const standings = live?.standings;
  const allSeries = standings?.map((s) => s.series) ?? [];

  return (
    <PhoneFrame>
      <Screen scroll>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <Title>THE RACE</Title>
            <Chip role="gold">{live ? live.monthLabel : SEASON.month}</Chip>
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
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "var(--cyan-deep)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 800,
                color: "var(--cyan-pale)",
              }}
            >
              JD
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
          <Segmented
            options={[
              { id: "crew", label: "MY CREW" },
              { id: "league", label: "LEAGUE" },
            ]}
            value={scope}
            onChange={setScope}
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
            {[60, 120, 180].map((y) => (
              <line key={y} x1="0" y1={y} x2="340" y2={y} stroke="#241442" strokeWidth="1" />
            ))}

            {standings
              ? standings.map((s) => {
                  const points = linePoints(s.series, allSeries);
                  if (!points) return null;
                  const color = ROLE[s.role as Role]?.base ?? "#22f7ff";
                  const end = lastPoint(points);
                  return (
                    <g key={s.id}>
                      {/* Your line is thicker — you're the one being tracked. */}
                      <GlowLine points={points} color={color} width={s.you ? 4.5 : 3} bloom={s.you ? 14 : 11} />
                      <GlowDot cx={end.x} cy={end.y} r={s.you ? 6 : 5} color={color} />
                      <text
                        x={end.x + 10}
                        y={end.y + 4}
                        fill={color}
                        fontSize="11"
                        fontWeight="700"
                        fontFamily="Chakra Petch"
                      >
                        {s.tag}
                      </text>
                    </g>
                  );
                })
              : (
                <>
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
          {(standings ?? RACE_STANDINGS.map((r) => ({ ...r, id: r.tag, stackLabel: r.stack, returnLabel: r.pct }))).map((r) => {
            const tint = ROLE[r.role as Role] ?? ROLE.cyan;
            return (
              <div
                key={r.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "11px 14px",
                  borderRadius: "var(--r-tile)",
                  ...(r.you
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
              </div>
            );
          })}
        </div>

        <Nudge>Maya passed you at 10:04. Avenge yourself.</Nudge>
      </Screen>
      <TabBar active="race" onNavigate={onNavigate} />
    </PhoneFrame>
  );
}
