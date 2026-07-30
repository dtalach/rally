import { useState } from "react";
import { PhoneFrame, Screen } from "../components/PhoneFrame";
import { BackCaret, Card, Kicker } from "../components/ui";

/* 19 · PUSH NOTIFICATIONS and 20 · NOTIFICATION SETTINGS.
   Push is the retention engine and the parent-complaint engine, so the cadence
   promise is part of the design: max 3 a day, nothing 9 PM–7 AM, and quiet
   hours are locked rather than user-editable. */

const PUSHES = [
  { title: "Maya just passed you", body: "She’s +21.4% — your move. Tap to see the race.", time: "now", fresh: true },
  { title: "Your duel ends tonight", body: "You’re up 0.4% on Dev. Hold or make one last play?", time: "20m", fresh: true },
  { title: "Market opens in 15 minutes", body: "Your queued Roblox buy fires at the open.", time: "9:15 AM", fresh: false },
  { title: "Weekly recap is in", body: "+2.1% this week · you beat 71% of your league.", time: "8:00 AM", fresh: false },
  { title: "Streak check-in", body: "Day 10 — open the app today to keep the flame.", time: "7:30 AM", fresh: false },
];

export function PushNotifications() {
  return (
    <PhoneFrame
      glow="rgba(255,43,214,0.1)"
      background="linear-gradient(180deg,#120a30,#0a0420 55%)"
    >
      <Screen padding="26px 20px 0" gap={22}>
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 2 }}>
          <div className="num" style={{ fontSize: 64, fontWeight: 200, letterSpacing: "-0.02em", lineHeight: 1 }}>
            9:41
          </div>
          <div style={{ fontSize: 15, color: "var(--text-1)" }}>Monday, July 27</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.1em",
              color: "var(--text-3)",
              paddingLeft: 4,
            }}
          >
            NOTIFICATION CENTER
          </div>
          {PUSHES.map((p) => (
            <div
              key={p.title}
              style={{
                borderRadius: 18,
                padding: "13px 14px",
                background: p.fresh ? "rgba(21,10,51,0.95)" : "rgba(21,10,51,0.82)",
                boxShadow: p.fresh
                  ? "0 0 0 1px rgba(34,247,255,0.45), 0 0 22px rgba(255,43,214,0.25)"
                  : "0 0 0 1px rgba(34,247,255,0.2)",
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
              }}
            >
              <div
                className="pixel"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: "var(--grad-btn-gold)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  color: "var(--gold-ink)",
                  flexShrink: 0,
                }}
              >
                R
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>{p.title}</span>
                  <span className="num" style={{ fontSize: 11, color: "var(--text-3)" }}>
                    {p.time}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: "var(--text-1)", marginTop: 2 }}>{p.body}</div>
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            textAlign: "center",
            fontSize: 12,
            color: "var(--text-3)",
            marginTop: "auto",
            paddingBottom: 26,
          }}
        >
          Max 3 pushes/day · nothing between 9 PM–7 AM · tuned in Parent View
        </div>
      </Screen>
    </PhoneFrame>
  );
}

type Toggle = { icon: string; color: string; title: string; body: string; on: boolean };

const GAME: Toggle[] = [
  { icon: "ph-fill ph-flag-checkered", color: "#ff2bd6", title: "Race moves", body: "When a rival passes you or you take the lead", on: true },
  { icon: "ph-fill ph-sword", color: "#22f7ff", title: "Duel updates", body: "Accepts, final-day warnings, results", on: true },
  { icon: "ph-fill ph-flame", color: "#ffe600", title: "Streak reminders", body: "One nudge if your flame is about to die", on: true },
];

const MARKET: Toggle[] = [
  { icon: "ph-fill ph-bell-ringing", color: "#39ff14", title: "Market open", body: "9:30 AM bell + your queued orders", on: true },
  { icon: "ph-fill ph-chart-line-up", color: "#9df4ff", title: "Big moves", body: "A holding moves ±5% in a day", on: false },
  { icon: "ph-fill ph-book-open", color: "#39ff14", title: "Quests & learning", body: "New quests and explainers", on: false },
];

export function NotificationSettings({ onBack }: { onBack?: () => void }) {
  const [state, setState] = useState(() => [...GAME, ...MARKET].map((t) => t.on));

  const row = (t: Toggle, index: number) => (
    <Card key={t.title} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 14px", flexShrink: 0 }}>
      <i className={t.icon} style={{ fontSize: 20, color: t.color }} />
      <div style={{ flex: 1, textAlign: "left" }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>{t.title}</div>
        <div style={{ fontSize: 12, color: "var(--text-2)" }}>{t.body}</div>
      </div>
      <Switch on={state[index]} onToggle={() => setState((s) => s.map((v, i) => (i === index ? !v : v)))} />
    </Card>
  );

  return (
    <PhoneFrame glow="rgba(34,247,255,0.1)">
      <Screen scroll gap={12}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <BackCaret onClick={onBack} />
          <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "0.04em", flex: 1 }}>NOTIFICATIONS</div>
        </div>
        <div style={{ fontSize: 13, color: "var(--text-2)", flexShrink: 0 }}>
          Rally sends at most <span style={{ color: "#fff", fontWeight: 700 }}>3 pushes a day</span>. You pick
          which ones matter.
        </div>

        <Kicker style={{ marginTop: 4, flexShrink: 0 }}>THE GAME</Kicker>
        {GAME.map((t, i) => row(t, i))}

        <Kicker style={{ marginTop: 4, flexShrink: 0 }}>THE MARKET</Kicker>
        {MARKET.map((t, i) => row(t, GAME.length + i))}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "13px 14px",
            borderRadius: "var(--r-tile)",
            background: "rgba(255,230,0,0.06)",
            boxShadow: "inset 0 0 0 1.5px rgba(255,230,0,0.4)",
            marginTop: 4,
            flexShrink: 0,
          }}
        >
          <i className="ph-fill ph-moon" style={{ fontSize: 20, color: "var(--gold)" }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Quiet hours</div>
            {/* Copy kept verbatim from the design; "school nights" vs the
                every-day window is a flagged, unresolved inconsistency. */}
            <div style={{ fontSize: 12, color: "var(--text-2)" }}>
              9 PM – 7 AM · always on for school nights
            </div>
          </div>
          <div className="num" style={{ fontSize: 12, fontWeight: 700, color: "var(--gold)" }}>
            LOCKED
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "11px 14px",
            borderRadius: 14,
            background: "rgba(34,247,255,0.05)",
            boxShadow: "inset 0 0 0 1px rgba(34,247,255,0.25)",
            flexShrink: 0,
          }}
        >
          <i className="ph ph-shield-check" style={{ fontSize: 18, color: "var(--cyan-soft)" }} />
          <div style={{ fontSize: 12, color: "var(--text-2)", flex: 1 }}>
            Parents can cap or mute everything from Parent View
          </div>
        </div>
      </Screen>
    </PhoneFrame>
  );
}

function Switch({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      style={{
        width: 46,
        height: 27,
        borderRadius: 15,
        border: "none",
        padding: 3,
        display: "flex",
        alignItems: "center",
        justifyContent: on ? "flex-end" : "flex-start",
        cursor: "pointer",
        ...(on
          ? { background: "var(--grad-btn-green)", boxShadow: "0 0 12px rgba(57,255,20,0.4)" }
          : { background: "var(--bg-hairline)", boxShadow: "inset 0 0 0 1.5px #3a2f6e" }),
      }}
    >
      <div
        style={{ width: 21, height: 21, borderRadius: "50%", background: on ? "#fff" : "var(--text-3)" }}
      />
    </button>
  );
}
