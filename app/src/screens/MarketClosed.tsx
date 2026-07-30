import { PhoneFrame, Screen } from "../components/PhoneFrame";
import { TabBar, type Tab } from "../components/TabBar";
import { Avatar, Card, Kicker } from "../components/ui";

/* 15 · MARKET CLOSED — nights, weekends and holidays, which is most of a
   teenager's free time. Countdown to the open, the queued order that fires at
   the bell, Friday's recap, duels (which never sleep) and a weekend quest, so
   the app isn't dead exactly when kids open it. */

export function MarketClosed({ onNavigate }: { onNavigate?: (t: Tab) => void }) {
  return (
    <PhoneFrame glow="rgba(34,247,255,0.1)">
      <Screen scroll>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div
            className="pixel"
            style={{ fontSize: 15, color: "var(--gold)", textShadow: "0 0 14px rgba(255,230,0,0.7)" }}
          >
            RALLY
          </div>
          <Avatar />
        </div>

        <Card
          background="var(--grad-indigo-card)"
          ring="0 0 0 1.5px rgba(34,247,255,0.35)"
          radius="var(--r-card)"
          padding={18}
          style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}
        >
          <i className="ph-fill ph-moon-stars" style={{ fontSize: 34, color: "var(--cyan-soft)" }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Market’s closed</div>
            <div style={{ fontSize: 13, color: "var(--text-2)" }}>
              Opens Monday 9:30 AM ET ·{" "}
              <span className="num" style={{ color: "var(--cyan-soft)", fontWeight: 700 }}>
                38h 12m
              </span>
            </div>
          </div>
        </Card>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "13px 14px",
            borderRadius: "var(--r-tile)",
            background: "rgba(255,230,0,0.07)",
            boxShadow: "inset 0 0 0 1.5px rgba(255,230,0,0.45)",
            flexShrink: 0,
          }}
        >
          <i className="ph-fill ph-clock-countdown" style={{ fontSize: 20, color: "var(--gold)" }} />
          <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "var(--gold)" }}>
            Queued: Buy $5,000 Roblox — fires at open
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--gold)" }}>EDIT</div>
        </div>

        <Card
          background="var(--grad-indigo-card-170)"
          radius="var(--r-card)"
          padding={16}
          style={{ display: "flex", flexDirection: "column", gap: 12, flexShrink: 0 }}
        >
          <Kicker>FRIDAY’S RECAP</Kicker>
          <RecapRow label="Your day" value="+$3,420 (+0.3%)" color="var(--green)" size={16} />
          <RecapRow label="Best play" value="NVIDIA +2.4%" />
          <RecapRow label="Worst play" value="Tesla −1.8%" color="var(--magenta)" />
          <RecapRow label="Race position" value="2nd of 4 · Maya leads" color="var(--cyan)" />
        </Card>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "13px 14px",
            borderRadius: "var(--r-tile)",
            background: "var(--grad-magenta-card)",
            boxShadow: "0 0 0 1.5px rgba(255,43,214,0.5)",
            flexShrink: 0,
          }}
        >
          <i className="ph-fill ph-sword" style={{ fontSize: 20, color: "var(--magenta)" }} />
          <div style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>
            Duels never sleep — you’re down 0.9% to Dev
          </div>
          <i className="ph ph-caret-right" style={{ color: "var(--magenta-soft)" }} />
        </div>

        <Card
          ring="0 0 0 1.5px rgba(57,255,20,0.4)"
          style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 14px", flexShrink: 0 }}
        >
          <i className="ph-fill ph-book-open" style={{ fontSize: 20, color: "var(--green)" }} />
          <div style={{ flex: 1, fontSize: 14, fontWeight: 600, textAlign: "left" }}>
            Weekend quest: What moves a stock price?{" "}
            <span style={{ color: "var(--gold)", fontWeight: 700 }}>+100 XP</span>
          </div>
        </Card>
      </Screen>
      <TabBar active="home" onNavigate={onNavigate} />
    </PhoneFrame>
  );
}

function RecapRow({
  label,
  value,
  color,
  size = 14,
}: {
  label: string;
  value: string;
  color?: string;
  size?: number;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span style={{ fontSize: 14, color: "var(--text-2)" }}>{label}</span>
      <span className="num" style={{ fontSize: size, fontWeight: 700, color }}>
        {value}
      </span>
    </div>
  );
}
