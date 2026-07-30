import { useState } from "react";
import { PhoneFrame, Screen } from "../components/PhoneFrame";
import { Button, Card, Title } from "../components/ui";
import { PLAYER } from "../data";

/* 11 · PICK YOUR RIVALS — the cold-start fix.
   Contacts, a shareable crew code, and the Rookie League fallback (30 strangers
   start together every Monday) so the race is never empty. */

const CANDIDATES = [
  { initials: "MR", color: "#39ff14", name: "Maya R.", note: "From your contacts", picked: true },
  { initials: "DN", color: "#ff2bd6", name: "Dev N.", note: "From your contacts", picked: true },
  { initials: "KL", color: "#ffe600", name: "Kai L.", note: "Plays Rally already", picked: false },
];

export function PickRivals({ onStart }: { onStart?: () => void }) {
  const [picked, setPicked] = useState(() => CANDIDATES.map((c) => c.picked));
  const count = picked.filter(Boolean).length;

  return (
    <PhoneFrame>
      <Screen scroll>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <Title>PICK 3 RIVALS</Title>
          <div style={{ fontSize: 14, color: "var(--text-2)" }}>
            A race isn’t a race alone. Add friends or join a league — you can always add more later.
          </div>
        </div>

        {CANDIDATES.map((c, i) => (
          <Card key={c.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", flexShrink: 0 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: "50%",
                background: `${c.color}22`,
                boxShadow: `inset 0 0 0 1.5px ${c.color}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                fontWeight: 700,
                color: c.color,
              }}
            >
              {c.initials}
            </div>
            <div style={{ flex: 1, textAlign: "left" }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{c.name}</div>
              <div style={{ fontSize: 12, color: "var(--text-2)" }}>{c.note}</div>
            </div>
            <button
              type="button"
              onClick={() => setPicked((p) => p.map((v, j) => (j === i ? !v : v)))}
              style={{
                padding: "7px 14px",
                borderRadius: 10,
                border: "none",
                fontFamily: "inherit",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                ...(picked[i]
                  ? {
                      background: "rgba(57,255,20,0.15)",
                      color: "var(--green)",
                      boxShadow: "inset 0 0 0 1.5px rgba(57,255,20,0.5)",
                    }
                  : {
                      background: "transparent",
                      color: "var(--cyan)",
                      boxShadow: "inset 0 0 0 1.5px var(--cyan)",
                    }),
              }}
            >
              {picked[i] ? "✓ IN" : "+ ADD"}
            </button>
          </Card>
        ))}

        <div
          style={{
            borderRadius: "var(--r-tile)",
            padding: "14px 16px",
            background: "var(--grad-violet-card)",
            boxShadow: "0 0 0 1.5px rgba(255,43,214,0.5)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexShrink: 0,
          }}
        >
          <i className="ph-fill ph-link" style={{ fontSize: 22, color: "var(--magenta)" }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Share your crew code</div>
            <div className="num" style={{ fontSize: 13, color: "var(--magenta-soft)" }}>
              {PLAYER.crewCode} · tap to copy
            </div>
          </div>
          <i className="ph ph-share-network" style={{ fontSize: 20, color: "var(--magenta-soft)" }} />
        </div>

        <div
          style={{
            borderRadius: "var(--r-tile)",
            padding: "14px 16px",
            background: "var(--bg-card)",
            boxShadow: "0 0 0 1.5px rgba(255,230,0,0.4)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexShrink: 0,
          }}
        >
          <i className="ph-fill ph-users-three" style={{ fontSize: 22, color: "var(--gold)" }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>No crew yet? Join the Rookie League</div>
            <div style={{ fontSize: 12, color: "var(--text-2)" }}>30 new players start together every Monday</div>
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--gold)" }}>JOIN</div>
        </div>

        <div
          style={{ marginTop: "auto", paddingBottom: 28, display: "flex", flexDirection: "column", gap: 10, flexShrink: 0 }}
        >
          <div style={{ textAlign: "center", fontSize: 13, color: "var(--cyan-soft)" }}>
            {count} of 3 picked — {count >= 3 ? "you’re set" : "add one more or join a league"}
          </div>
          <Button variant="green" caret onClick={onStart}>
            START THE RACE
          </Button>
        </div>
      </Screen>
    </PhoneFrame>
  );
}
