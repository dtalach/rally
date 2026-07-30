import { PhoneFrame, Screen } from "../components/PhoneFrame";
import { ROLE, Sheet, type Role } from "../components/ui";
import { PLAYER } from "../data";

/* 17 · PROFILE PULL-UP — what the avatar opens.
   Level ring, XP bar, the four vitals, then Trophy Room, crew and parent view.
   Trophies get no nav tab; they live here and come to you through toasts. */

const STATS: { value: string; label: string; role: Role }[] = [
  { value: `#${PLAYER.rank}`, label: "RANK", role: "cyan" },
  { value: String(PLAYER.streak), label: "STREAK", role: "gold" },
  { value: PLAYER.duelRecord, label: "DUELS", role: "green" },
  { value: String(PLAYER.trophies), label: "TROPHIES", role: "magenta" },
];

export type ProfileLive = {
  name: string;
  initials: string;
  level: number;
  levelTitle: string;
  xpPct: number;
  toNextLabel: string;
  rank: number;
  streak: number;
  duels: number;
  duelRecord: string;
  crewSize: number;
  earnedCount: number;
  totalCount: number;
};

export function ProfilePullUp({
  onTrophyRoom,
  onDismiss,
  live,
}: {
  onTrophyRoom?: () => void;
  onDismiss?: () => void;
  live?: ProfileLive;
}) {
  const stats: { value: string; label: string; role: Role }[] = live
    ? [
        { value: `#${live.rank}`, label: "RANK", role: "cyan" },
        { value: String(live.streak), label: "STREAK", role: "gold" },
        { value: live.duelRecord, label: "DUELS", role: "green" },
        { value: String(live.earnedCount), label: "TROPHIES", role: "magenta" },
      ]
    : STATS;

  return (
    <PhoneFrame>
      {/* The screen behind, dimmed. Tapping it dismisses, which is what the
          sheet presentation implies — there's no back chevron by design. */}
      <div
        onClick={onDismiss}
        style={{ position: "absolute", inset: 0, zIndex: 3 }}
        aria-hidden
      />
      <Screen style={{ filter: "brightness(0.4) saturate(0.8)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="pixel" style={{ fontSize: 15, color: "var(--gold)" }}>
            RALLY
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
              fontWeight: 700,
              color: "var(--cyan-pale)",
            }}
          >
            JD
          </div>
        </div>
        <div style={{ borderRadius: "var(--r-card)", height: 150, background: "var(--grad-violet-card)" }} />
        <div style={{ borderRadius: "var(--r-card)", height: 120, background: "var(--grad-indigo-card-170)" }} />
      </Screen>

      <Sheet paddingBottom={36}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: "50%",
              background: "var(--cyan-deep)",
              boxShadow: "0 0 0 3px var(--bg-frame), 0 0 0 6px var(--cyan), 0 0 24px rgba(34,247,255,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              fontWeight: 700,
              color: "var(--cyan-pale)",
            }}
          >
            {live ? live.initials : PLAYER.initials}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 19, fontWeight: 700 }}>{live ? live.name : PLAYER.name}</div>
            <div style={{ fontSize: 13, color: "var(--cyan-soft)" }}>
              LVL {live ? live.level : PLAYER.level} · {live ? live.levelTitle : PLAYER.levelTitle}
            </div>
            <div
              style={{
                height: 7,
                borderRadius: 4,
                background: "var(--bg-track)",
                boxShadow: "inset 0 0 0 1px var(--cyan-deep)",
                marginTop: 6,
              }}
            >
              <div
                style={{
                  width: `${live ? live.xpPct : PLAYER.xpPct}%`,
                  height: 7,
                  borderRadius: 4,
                  background: "linear-gradient(90deg,#39ff14,#22f7ff)",
                }}
              />
            </div>
          </div>
        </div>

        {live && (
          <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: -6 }}>{live.toNextLabel}</div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          {stats.map((s) => {
            const t = ROLE[s.role];
            return (
              <div
                key={s.label}
                style={{
                  flex: 1,
                  borderRadius: 14,
                  padding: 10,
                  background: `rgba(${t.rgb},0.07)`,
                  boxShadow: `inset 0 0 0 1px rgba(${t.rgb},0.3)`,
                  textAlign: "center",
                }}
              >
                <div className="num" style={{ fontSize: 18, fontWeight: 700, color: t.base }}>
                  {s.value}
                </div>
                <div style={{ fontSize: 10, color: "var(--text-2)", fontWeight: 700 }}>{s.label}</div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onTrophyRoom}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "13px 14px",
            borderRadius: 14,
            border: "none",
            background: "rgba(255,230,0,0.06)",
            boxShadow: "inset 0 0 0 1.5px rgba(255,230,0,0.4)",
            fontFamily: "inherit",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <i className="ph-fill ph-trophy" style={{ fontSize: 20, color: "var(--gold)" }} />
            <span style={{ fontSize: 14, fontWeight: 700 }}>Trophy Room</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--gold)", fontWeight: 700 }}>
            {live ? live.earnedCount : PLAYER.trophies} /{" "}
            {live ? live.totalCount : PLAYER.trophiesTotal} <i className="ph ph-caret-right" />
          </div>
        </button>

        <ProfileRow
          icon="ph ph-users-three"
          label={`My Crew · ${live ? live.crewSize : PLAYER.crewSize} racers`}
        />
        <ProfileRow icon="ph ph-shield-check" label="Parent view & settings" />
      </Sheet>
    </PhoneFrame>
  );
}

function ProfileRow({ icon, label }: { icon: string; label: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "13px 14px",
        borderRadius: 14,
        background: "rgba(34,247,255,0.05)",
        boxShadow: "inset 0 0 0 1px rgba(34,247,255,0.25)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <i className={icon} style={{ fontSize: 20, color: "var(--cyan-soft)" }} />
        <span style={{ fontSize: 14, fontWeight: 600 }}>{label}</span>
      </div>
      <i className="ph ph-caret-right" style={{ color: "var(--cyan-soft)" }} />
    </div>
  );
}
