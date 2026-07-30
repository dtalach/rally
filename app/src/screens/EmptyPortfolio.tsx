import { PhoneFrame, Screen } from "../components/PhoneFrame";
import { TabBar, type Tab } from "../components/TabBar";
import { Avatar, Button, Chip, Title } from "../components/ui";

/* 18 · EMPTY PORTFOLIO — day one, all cash.
   "It can be $5 or $500K" is the fractional-shares promise; the quest turns
   the empty state into the first rung of the gamification loop. */

export function EmptyPortfolio({ onNavigate, onDiscover }: { onNavigate?: (t: Tab) => void; onDiscover?: () => void }) {
  return (
    <PhoneFrame glow="rgba(255,230,0,0.1)">
      <Screen>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Title>MY HOLDINGS</Title>
          <Avatar />
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: "50%",
              background: "var(--gold)",
              boxShadow: "inset 0 0 0 5px #a87400, 0 0 40px rgba(255,230,0,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ width: 12, height: 38, borderRadius: 4, background: "#a87400" }} />
          </div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>All cash. Zero plays.</div>
          <div
            className="num"
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: "var(--green)",
              textShadow: "0 0 18px rgba(57,255,20,0.5)",
            }}
          >
            $1,000,000 ready
          </div>
          <div style={{ fontSize: 14, color: "var(--text-2)", maxWidth: 270 }}>
            Your coins don’t race while they’re parked. Make your first play — it can be $5 or $500K.
          </div>
          <Chip role="gold">FIRST TRADE QUEST · +200 XP</Chip>
        </div>

        <div style={{ paddingBottom: 24 }}>
          <Button variant="magenta" caret onClick={onDiscover}>
            FIND YOUR FIRST STOCK
          </Button>
        </div>
      </Screen>
      <TabBar active="folio" onNavigate={onNavigate} />
    </PhoneFrame>
  );
}
