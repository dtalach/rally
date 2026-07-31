import { useState } from "react";
import { PhoneFrame, Screen } from "../components/PhoneFrame";
import { Avatar, ROLE, Sheet, type Role } from "../components/ui";
import { PLAYER } from "../data";
import { isMuted, playFill, setMuted } from "../sound";
import { useSession } from "../useSession";
import { isStandalone, needsPermission, type ShakeState } from "../useShake";

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
  onSignOut,
  live,
  shake,
}: {
  onTrophyRoom?: () => void;
  onDismiss?: () => void;
  onSignOut?: () => void;
  live?: ProfileLive;
  /** Owned by the app shell, so the listener outlives this sheet. */
  shake?: { state: ShakeState; enable: () => void; disable: () => void };
}) {
  const [muted, setMutedState] = useState(isMuted);
  const me = useSession();

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
          <Avatar ring={false} />
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
          <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: -6 }}>
            {live.toNextLabel}
            {me?.email ? ` · ${me.email}` : ""}
          </div>
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
          label={(() => {
            const n = live ? live.crewSize : PLAYER.crewSize;
            return `My Crew · ${n} racer${n === 1 ? "" : "s"}`;
          })()}
        />
        {/* Toggling the sound on previews it, so the control demonstrates
            what it controls. */}
        {live && (
        <ToggleRow
          icon={muted ? "ph ph-speaker-slash" : "ph-fill ph-speaker-high"}
          iconColor={muted ? "var(--text-3)" : "var(--gold)"}
          label="Coin sound on trades"
          on={!muted}
          onToggle={() => {
            const next = !muted;
            setMuted(next);
            setMutedState(next);
            if (!next) playFill();
          }}
        />
        )}

        {live && shake && (
        <ToggleRow
          icon={shake.state === "on" ? "ph-fill ph-device-mobile-speaker" : "ph ph-device-mobile"}
          iconColor={shake.state === "on" ? "var(--magenta)" : "var(--text-3)"}
          label="Shake for coins"
          hint={
            shake.state === "unsupported"
              ? "Not available on this device"
              : shake.state === "denied"
                ? "Blocked — allow Motion in Safari settings"
                : shake.state === "no-response"
                  ? isStandalone()
                    ? "iOS didn't ask. Try turning this on in Safari first."
                    : "iOS didn't respond. Try again."
                  : shake.state === "on"
                    ? "Shake the phone to hear your stack"
                    : needsPermission()
                      ? "Tap to allow motion access"
                      : undefined
          }
          on={shake.state === "on"}
          disabled={shake.state === "unsupported"}
          onToggle={() => (shake.state === "on" ? shake.disable() : shake.enable())}
        />
        )}

        <ProfileRow icon="ph ph-shield-check" label="Parent view & settings" />

        {live && onSignOut && (
          <button
            type="button"
            onClick={onSignOut}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "13px 14px",
              borderRadius: 14,
              border: "none",
              background: "transparent",
              boxShadow: "inset 0 0 0 1.5px rgba(255,43,214,0.4)",
              fontFamily: "inherit",
              fontSize: 14,
              fontWeight: 700,
              color: "var(--magenta)",
              cursor: "pointer",
            }}
          >
            <i className="ph ph-sign-out" style={{ fontSize: 18 }} />
            Sign out
          </button>
        )}
      </Sheet>
    </PhoneFrame>
  );
}

function ToggleRow({
  icon,
  iconColor,
  label,
  hint,
  on,
  disabled,
  onToggle,
}: {
  icon: string;
  iconColor: string;
  label: string;
  hint?: string;
  on: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        padding: "13px 14px",
        borderRadius: 14,
        background: "rgba(34,247,255,0.05)",
        boxShadow: "inset 0 0 0 1px rgba(34,247,255,0.25)",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <i className={icon} style={{ fontSize: 20, color: iconColor, flexShrink: 0 }} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{label}</div>
          {hint && <div style={{ fontSize: 11, color: "var(--text-3)" }}>{hint}</div>}
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        disabled={disabled}
        onClick={onToggle}
        style={{
          width: 46,
          height: 27,
          borderRadius: 15,
          border: "none",
          padding: 3,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: on ? "flex-end" : "flex-start",
          cursor: disabled ? "not-allowed" : "pointer",
          ...(on
            ? { background: "var(--grad-btn-green)", boxShadow: "0 0 12px rgba(57,255,20,0.4)" }
            : { background: "var(--bg-hairline)", boxShadow: "inset 0 0 0 1.5px #3a2f6e" }),
        }}
      >
        <div
          style={{ width: 21, height: 21, borderRadius: "50%", background: on ? "#fff" : "var(--text-3)" }}
        />
      </button>
    </div>
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
