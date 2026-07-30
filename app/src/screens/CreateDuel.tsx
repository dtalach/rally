import { useState } from "react";
import { PhoneFrame, Screen } from "../components/PhoneFrame";
import { TabBar, type Tab } from "../components/TabBar";
import { Button, Card, Kicker, Segmented, Title } from "../components/ui";
import { STACK } from "../data";

/* 12 · CREATE A DUEL
   Rival · duration (30/60/90 days) · wager from your stack · winner takes the
   whole pot. Taunts are preset-only — no free text, so there's no moderation
   burden and no bullying vector. Ignored challenges expire after 48h. */

const WAGERS = ["$5K", "$25K", "$100K", "CUSTOM"];
const TAUNTS = ["You’re going down", "GL HF", "Bring your ETFs"];

export function CreateDuel({ onNavigate, onSend }: { onNavigate?: (t: Tab) => void; onSend?: () => void }) {
  const [duration, setDuration] = useState<"30" | "60" | "90">("60");
  const [wager, setWager] = useState("$25K");
  const [taunt, setTaunt] = useState(TAUNTS[0]);

  return (
    <PhoneFrame glow="rgba(255,43,214,0.14)">
      <Screen scroll>
        <Title>NEW DUEL</Title>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
          <Kicker>CHOOSE YOUR OPPONENT</Kicker>
          <Card style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px" }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: "50%",
                background: "#ff2bd622",
                boxShadow: "inset 0 0 0 1.5px var(--magenta)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                fontWeight: 700,
                color: "var(--magenta)",
              }}
            >
              DN
            </div>
            <div style={{ flex: 1, textAlign: "left" }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>Dev N.</div>
              <div style={{ fontSize: 12, color: "var(--text-2)" }}>Won your last duel · rematch?</div>
            </div>
            <i className="ph-fill ph-check-circle" style={{ fontSize: 24, color: "var(--green)" }} />
          </Card>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
          <Kicker>DURATION</Kicker>
          <Segmented
            options={[
              { id: "30", label: "30 DAYS" },
              { id: "60", label: "60 DAYS" },
              { id: "90", label: "90 DAYS" },
            ]}
            value={duration}
            onChange={setDuration}
            activeSkin="magenta"
            fontSize={13}
            padY={9}
            numeric
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <Kicker>YOUR WAGER · FROM YOUR STACK</Kicker>
            <div className="num" style={{ fontSize: 11, color: "var(--text-3)" }}>
              Cash {STACK.cash}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {WAGERS.map((w) => {
              const on = w === wager;
              return (
                <button
                  key={w}
                  type="button"
                  className={w === "CUSTOM" ? undefined : "num"}
                  onClick={() => setWager(w)}
                  style={{
                    flex: 1,
                    textAlign: "center",
                    padding: "9px 0",
                    borderRadius: 10,
                    border: "none",
                    fontFamily: "inherit",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    ...(on
                      ? {
                          background: "rgba(255,230,0,0.12)",
                          color: "var(--gold)",
                          boxShadow: "inset 0 0 0 1.5px rgba(255,230,0,0.5)",
                        }
                      : {
                          background: "transparent",
                          color: "var(--cyan-soft)",
                          boxShadow: "inset 0 0 0 1.5px rgba(34,247,255,0.4)",
                        }),
                  }}
                >
                  {w}
                </button>
              );
            })}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-2)" }}>
            Dev must match your $25,000 to accept. Winner’s stack gets the full $50,000.
          </div>
        </div>

        <div
          style={{
            borderRadius: "var(--r-tile)",
            padding: "14px 16px",
            background: "var(--grad-gold-card)",
            boxShadow: "0 0 0 1.5px rgba(255,230,0,0.5)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexShrink: 0,
          }}
        >
          <i className="ph-fill ph-trophy" style={{ fontSize: 24, color: "var(--gold)" }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Winner takes the whole pot</div>
            <div style={{ fontSize: 12, color: "var(--text-2)" }}>
              Biggest gain on the wager wins both stakes · expires in 48h if ignored
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
          <Kicker>OPENING TAUNT · PRESETS ONLY</Kicker>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {TAUNTS.map((t) => {
              const on = t === taunt;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTaunt(t)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 20,
                    border: "none",
                    fontFamily: "inherit",
                    fontSize: 13,
                    cursor: "pointer",
                    ...(on
                      ? {
                          fontWeight: 700,
                          background: "rgba(34,247,255,0.15)",
                          color: "var(--cyan)",
                          boxShadow: "inset 0 0 0 1.5px rgba(34,247,255,0.5)",
                        }
                      : {
                          fontWeight: 600,
                          background: "transparent",
                          color: "var(--text-2)",
                          boxShadow: "inset 0 0 0 1.5px var(--bg-hairline)",
                        }),
                  }}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ marginTop: "auto", paddingBottom: 28, flexShrink: 0 }}>
          <Button variant="magenta" caret onClick={onSend}>
            SEND CHALLENGE
          </Button>
        </div>
      </Screen>
      <TabBar active="duels" onNavigate={onNavigate} />
    </PhoneFrame>
  );
}
