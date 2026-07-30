import { PhoneFrame, Screen } from "../components/PhoneFrame";
import { TabBar, type Tab } from "../components/TabBar";
import { Avatar, BackCaret, Chip, ROLE, type Role } from "../components/ui";
import { PLAYER } from "../data";

/* 08 · TROPHY ROOM — what the avatar opens.
   Medals rather than sprites: a glowing ring per trophy, colour-coded by type,
   with the earn date or the stat underneath. Locked tiles tease the goal
   ("$61K to go") instead of showing a question mark. */

const EARNED: { icon: string; role: Role; title: string; meta: string }[] = [
  { icon: "ph-fill ph-coins", role: "gold", title: "First 10K", meta: "Jul 27" },
  { icon: "ph-fill ph-sword", role: "magenta", title: "5 Duels Won", meta: "7–2 record" },
  { icon: "ph-fill ph-chart-line-up", role: "green", title: "+10% Week", meta: "Jun 30" },
  { icon: "ph-fill ph-flame", role: "gold", title: "10-Day Streak", meta: "Active now" },
  { icon: "ph-fill ph-users-three", role: "cyan", title: "Crew Builder", meta: "4 recruits" },
  { icon: "ph-fill ph-medal", role: "ice", title: "Top 5% Finish", meta: "June · monthly" },
];

const LOCKED = [
  { title: "First 100K", meta: "$61K to go" },
  { title: "Diversified", meta: "Own 5 sectors" },
  { title: "Giant Slayer", meta: "Beat a top-100" },
];

export type TrophyRoomLive = {
  name: string;
  earnedCount: number;
  totalCount: number;
  trophies: { id: string; title: string; icon: string; role: string; earned: boolean; meta: string }[];
};

export function TrophyRoom({
  onNavigate,
  onBack,
  live,
}: {
  onNavigate?: (t: Tab) => void;
  onBack?: () => void;
  live?: TrophyRoomLive;
}) {
  const got = live ? live.earnedCount : PLAYER.trophies;
  const total = live ? live.totalCount : PLAYER.trophiesTotal;
  const pct = Math.round((got / total) * 100);

  const liveEarned = live?.trophies.filter((t) => t.earned) ?? [];
  const liveLocked = live?.trophies.filter((t) => !t.earned) ?? [];

  return (
    <PhoneFrame glow="rgba(255,230,0,0.12)">
      <Screen scroll>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <BackCaret onClick={onBack} />
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: "0.06em",
                color: "var(--gold)",
                textShadow: "0 0 16px rgba(255,230,0,0.5)",
              }}
            >
              TROPHY ROOM
            </div>
            <div style={{ fontSize: 13, color: "var(--text-2)" }}>
              {live ? live.name : PLAYER.name} ·{" "}
              <span className="num" style={{ color: "#fff", fontWeight: 700 }}>
                {got} of {total}
              </span>{" "}
              collected
            </div>
          </div>
          <Avatar />
        </div>

        <div
          style={{
            height: 9,
            borderRadius: 5,
            background: "var(--bg-track)",
            boxShadow: "inset 0 0 0 1px rgba(255,230,0,0.35)",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: `${pct}%`,
              height: 9,
              borderRadius: 5,
              background: "linear-gradient(90deg,#ffe600,#c98b00)",
              boxShadow: "0 0 12px rgba(255,230,0,0.45)",
            }}
          />
        </div>

        {!live && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "13px 16px",
            borderRadius: "var(--r-tile)",
            background: "var(--grad-green-card)",
            boxShadow: "0 0 0 1.5px rgba(57,255,20,0.55)",
            flexShrink: 0,
          }}
        >
          <i className="ph-fill ph-seal-check" style={{ fontSize: 26, color: "var(--green)" }} />
          <div style={{ flex: 1 }}>
            <Chip role="green" style={{ display: "inline-block" }}>
              NEW!
            </Chip>{" "}
            <span style={{ fontSize: 14, fontWeight: 700 }}>First $10K of profit</span>
          </div>
          <div
            className="num"
            style={{ fontSize: 15, fontWeight: 700, color: "var(--gold)", textShadow: "0 0 10px rgba(255,230,0,0.5)" }}
          >
            +500 XP
          </div>
        </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, flexShrink: 0 }}>
          {(live ? liveEarned : EARNED).map((t) => {
            const tint = ROLE[(t.role as Role) in ROLE ? (t.role as Role) : "gold"];
            return (
              <div
                key={t.title}
                style={{
                  borderRadius: 18,
                  padding: "14px 8px 12px",
                  background: `linear-gradient(170deg,rgba(${tint.rgb},0.1),#0e0526)`,
                  boxShadow: `0 0 0 1.5px rgba(${tint.rgb},0.55)`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: "50%",
                    background: `rgba(${tint.rgb},0.12)`,
                    boxShadow: `0 0 0 2.5px ${tint.base}, 0 0 18px rgba(${tint.rgb},0.45)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <i className={t.icon} style={{ fontSize: 26, color: tint.base }} />
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 700, lineHeight: 1.25 }}>{t.title}</div>
                <div className="num" style={{ fontSize: 10.5, color: "var(--text-3)" }}>
                  {t.meta}
                </div>
              </div>
            );
          })}
        </div>

        <div
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 2px", flexShrink: 0 }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", color: "var(--cyan-soft)" }}>
            NEXT UP
          </div>
          <div style={{ fontSize: 11, color: "var(--text-3)" }}>{total - got} more to find</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, flexShrink: 0 }}>
          {(live ? liveLocked : LOCKED).map((t) => (
            <div
              key={t.title}
              style={{
                borderRadius: 18,
                padding: "14px 8px 12px",
                background: "var(--bg-card-deep)",
                boxShadow: "inset 0 0 0 1.5px var(--bg-hairline)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: "50%",
                  background: "var(--bg-card)",
                  boxShadow: "inset 0 0 0 2px var(--bg-hairline)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <i className="ph-fill ph-lock-simple" style={{ fontSize: 22, color: "var(--text-locked-icon)" }} />
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-locked)", lineHeight: 1.25 }}>
                {t.title}
              </div>
              <div style={{ fontSize: 10.5, color: "var(--text-locked-dim)" }}>{t.meta}</div>
            </div>
          ))}
        </div>
      </Screen>
      <TabBar active="home" onNavigate={onNavigate} />
    </PhoneFrame>
  );
}
