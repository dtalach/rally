import { PhoneFrame, Screen } from "../components/PhoneFrame";
import { Button, Chip } from "../components/ui";

/* 13 · DUEL VICTORY and 14 · DEFEAT · COMEBACK.
   Losing well matters more than winning well for a 12-year-old: defeat leads
   with a comeback quest, the season reset countdown, and "see what Dev traded"
   as the learning path — never a nudge to buy more while down. */

export function Victory({ onRematch, onBack }: { onRematch?: () => void; onBack?: () => void }) {
  return (
    <PhoneFrame glow="rgba(57,255,20,0.18)">
      <Screen>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 18,
            textAlign: "center",
          }}
        >
          <Chip role="green">DUEL COMPLETE</Chip>
          <i
            className="ph-fill ph-trophy"
            style={{ fontSize: 96, color: "var(--gold)", textShadow: "0 0 40px rgba(255,230,0,0.8)" }}
          />
          <div
            className="pixel"
            style={{
              fontSize: 30,
              color: "var(--green)",
              textShadow: "0 0 24px rgba(57,255,20,0.8), 3px 3px 0 #087f2a",
            }}
          >
            YOU WON!
          </div>
          <div style={{ fontSize: 15, color: "var(--text-1)" }}>
            You{" "}
            <span className="num" style={{ color: "var(--green)", fontWeight: 700 }}>
              +5.1%
            </span>{" "}
            · Dev{" "}
            <span className="num" style={{ color: "var(--magenta)", fontWeight: 700 }}>
              +4.3%
            </span>{" "}
            · 30-day duel · $25K each
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Chip role="gold">+$50,000 POT</Chip>
            <Chip role="green">DUELIST TROPHY</Chip>
            <Chip role="cyan">STREAK +1</Chip>
          </div>
          <div style={{ fontSize: 13, color: "var(--text-2)", maxWidth: 280 }}>
            Dev already wants a rematch. Make him regret it.
          </div>
        </div>
        <div style={{ paddingBottom: 28, display: "flex", flexDirection: "column", gap: 10 }}>
          <Button variant="magenta" caret onClick={onRematch}>
            ACCEPT REMATCH
          </Button>
          <Button variant="outline" onClick={onBack} style={{ letterSpacing: 0 }}>
            BACK TO ARENA
          </Button>
        </div>
      </Screen>
    </PhoneFrame>
  );
}

export function Defeat({ onRematch, onSeeTrades }: { onRematch?: () => void; onSeeTrades?: () => void }) {
  return (
    <PhoneFrame glow="rgba(255,43,214,0.16)">
      <Screen>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 18,
            textAlign: "center",
          }}
        >
          <Chip role="magenta">DUEL COMPLETE</Chip>
          <div
            className="pixel"
            style={{ fontSize: 26, color: "var(--magenta)", textShadow: "0 0 22px rgba(255,43,214,0.7)" }}
          >
            SO CLOSE.
          </div>
          <div style={{ fontSize: 15, color: "var(--text-1)" }}>
            You{" "}
            <span className="num" style={{ color: "var(--cyan)", fontWeight: 700 }}>
              +3.4%
            </span>{" "}
            · Dev{" "}
            <span className="num" style={{ color: "var(--green)", fontWeight: 700 }}>
              +4.3%
            </span>{" "}
            · lost by 0.9% · your $25K goes to Dev
          </div>
          <div
            style={{
              borderRadius: "var(--r-card)",
              padding: 18,
              background: "var(--grad-green-card)",
              boxShadow: "0 0 0 1.5px rgba(57,255,20,0.5)",
              display: "flex",
              flexDirection: "column",
              gap: 8,
              maxWidth: 300,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
              <Chip role="green">COMEBACK QUEST</Chip>
            </div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Beat your own return next week</div>
            <div style={{ fontSize: 13, color: "var(--text-2)" }}>+150 XP · losses teach faster than wins</div>
          </div>
          <div style={{ fontSize: 13, color: "var(--gold)" }}>
            New month starts in 19 days — every leaderboard resets to 0%.
          </div>
        </div>
        <div style={{ paddingBottom: 28, display: "flex", flexDirection: "column", gap: 10 }}>
          <Button variant="magenta" caret onClick={onRematch}>
            CHALLENGE DEV AGAIN
          </Button>
          <Button variant="outline" onClick={onSeeTrades} style={{ letterSpacing: 0 }}>
            SEE WHAT DEV TRADED
          </Button>
        </div>
      </Screen>
    </PhoneFrame>
  );
}
