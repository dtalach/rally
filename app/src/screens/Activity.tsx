import { PhoneFrame, Screen } from "../components/PhoneFrame";
import { TabBar, type Tab } from "../components/TabBar";
import { BackCaret, Card, Chip, Title } from "../components/ui";

/* 16 · ACTIVITY — events *about you*: who passed you, who accepted, what you
   unlocked. The HOME feed is about what everyone else is doing; the two stay
   deliberately disjoint. */

const EVENTS = [
  { icon: "ph-fill ph-flag-checkered", color: "#ff2bd6", title: "Maya passed you in the race", body: "She’s +21.4% · you’re +14.4%", time: "2h" },
  { icon: "ph-fill ph-sword", color: "#22f7ff", title: "Dev accepted your duel", body: "1 week · best % return wins", time: "5h" },
  { icon: "ph-fill ph-trophy", color: "#ffe600", title: "Achievement: First $10K profit", body: "+500 XP earned", time: "1d" },
  { icon: "ph-fill ph-user-plus", color: "#39ff14", title: "Kai joined with your code", body: "Your crew is now 4 racers", time: "1d" },
  { icon: "ph-fill ph-chart-line-up", color: "#39ff14", title: "NVIDIA up 5% since you bought", body: "Your best call this month", time: "2d" },
  { icon: "ph-fill ph-medal", color: "#9df4ff", title: "July season: Top 3% finish", body: "Season resets Monday", time: "3d" },
];

export function Activity({ onNavigate, onBack }: { onNavigate?: (t: Tab) => void; onBack?: () => void }) {
  return (
    <PhoneFrame glow="rgba(255,230,0,0.1)">
      <Screen scroll>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <BackCaret onClick={onBack} />
          <Title style={{ flex: 1 }}>ACTIVITY</Title>
          <Chip role="gold">4 NEW</Chip>
        </div>

        {EVENTS.map((e) => (
          <Card
            key={e.title}
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 14px", flexShrink: 0 }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: `${e.color}18`,
                boxShadow: `inset 0 0 0 1.5px ${e.color}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <i className={e.icon} style={{ fontSize: 19, color: e.color }} />
            </div>
            <div style={{ flex: 1, textAlign: "left" }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{e.title}</div>
              <div style={{ fontSize: 12, color: "var(--text-2)" }}>{e.body}</div>
            </div>
            <div className="num" style={{ fontSize: 11, color: "var(--text-3)" }}>
              {e.time}
            </div>
          </Card>
        ))}
      </Screen>
      <TabBar active="home" onNavigate={onNavigate} />
    </PhoneFrame>
  );
}
