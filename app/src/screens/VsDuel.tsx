import { PhoneFrame, Screen } from "../components/PhoneFrame";
import { TabBar, type Tab } from "../components/TabBar";
import { Button, GlowLine } from "../components/ui";
import { DUEL, PLAYER } from "../data";

/* 07 · VS DUEL — a live 1v1.
   Both players commit the same amount from their stack; biggest % gain on the
   wager takes the whole pot. Duels run on their own 30/60/90-day clock,
   independent of the month/quarter/year seasons. */

export function VsDuel({ onNavigate, onTrade }: { onNavigate?: (t: Tab) => void; onTrade?: () => void }) {
  return (
    <PhoneFrame glow="rgba(57,255,20,0.1)">
      <Screen padding="14px 20px 0" gap={16}>
        {/* health bars */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--cyan)", letterSpacing: "0.04em" }}>
              P1 · YOU
            </div>
            <div
              style={{
                height: 16,
                borderRadius: 10,
                boxShadow: "inset 0 0 0 1.5px var(--cyan)",
                padding: 3,
              }}
            >
              <div
                style={{
                  width: `${DUEL.youBar}%`,
                  height: "100%",
                  borderRadius: 7,
                  background: "linear-gradient(90deg,#39ff14,#ffe600)",
                  boxShadow: "0 0 10px rgba(57,255,20,0.6)",
                }}
              />
            </div>
          </div>
          <div className="pixel" style={{ fontSize: 13, color: "var(--gold)", textShadow: "0 0 12px var(--gold)" }}>
            VS
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--magenta)", letterSpacing: "0.04em" }}>
              P2 · {DUEL.rivalShort}
            </div>
            <div
              style={{
                height: 16,
                borderRadius: 10,
                boxShadow: "inset 0 0 0 1.5px var(--magenta)",
                padding: 3,
                width: "100%",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <div
                style={{
                  width: `${DUEL.themBar}%`,
                  height: "100%",
                  borderRadius: 7,
                  background: "linear-gradient(270deg,#ff2bd6,#ffe600)",
                  boxShadow: "0 0 10px rgba(255,43,214,0.6)",
                }}
              />
            </div>
          </div>
        </div>

        <div style={{ textAlign: "center", fontSize: 14, color: "var(--text-1)" }}>
          <span className="num" style={{ color: "var(--gold)", fontWeight: 700 }}>
            {DUEL.stake} each
          </span>{" "}
          in the pot · {DUEL.duration} ·{" "}
          <span className="num" style={{ color: "var(--gold)", fontWeight: 700 }}>
            {DUEL.left}
          </span>
        </div>

        <div
          style={{
            borderRadius: "var(--r-card)",
            padding: "20px 16px",
            background: "var(--grad-violet-card-170)",
            boxShadow: "var(--ring)",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
            <Fighter
              initials="JD"
              name={PLAYER.name}
              pct={DUEL.you}
              tile="#0c2d4a"
              accent="var(--cyan)"
              accentRgb="34,247,255"
            />
            <div
              className="pixel"
              style={{ fontSize: 24, color: "var(--gold)", textShadow: "0 0 18px #ffe600, 3px 3px 0 #ff2bd6" }}
            >
              VS
            </div>
            <Fighter
              initials={DUEL.rivalInitials}
              name={DUEL.rival}
              pct={DUEL.them}
              tile="#3a0a2e"
              accent="var(--magenta)"
              accentRgb="255,43,214"
            />
          </div>
          <div
            style={{
              textAlign: "center",
              fontSize: 15,
              fontWeight: 700,
              color: "var(--magenta)",
              textShadow: "0 0 12px rgba(255,43,214,0.5)",
            }}
          >
            Down 0.9% — two days to flip it.
          </div>
        </div>

        <svg viewBox="0 0 340 110" style={{ width: "100%", height: 120 }}>
          <GlowLine points={DUEL.youLine} color="#22f7ff" width={3.5} bloom={10} />
          <GlowLine points={DUEL.themLine} color="#ff2bd6" width={3.5} bloom={10} />
        </svg>

        <div style={{ display: "flex", gap: 10 }}>
          <Button variant="teal" height={52} icon="ph ph-chat-teardrop-text" style={{ flex: 1, letterSpacing: 0 }}>
            TAUNT ▾
          </Button>
          <Button
            variant="green"
            height={52}
            icon="ph-fill ph-lightning"
            onClick={onTrade}
            style={{ flex: 1, letterSpacing: 0, boxShadow: "0 0 20px rgba(57,255,20,0.45), inset 0 -4px 0 rgba(0,0,0,0.2)" }}
          >
            TRADE NOW
          </Button>
        </div>

        <div style={{ textAlign: "center", fontSize: 13, color: "var(--text-2)" }}>
          Biggest gain on the $25K takes the whole{" "}
          <span className="num" style={{ color: "var(--gold)", fontWeight: 700 }}>
            {DUEL.pot}
          </span>{" "}
          pot
        </div>
      </Screen>
      <TabBar active="duels" onNavigate={onNavigate} />
    </PhoneFrame>
  );
}

function Fighter({
  initials,
  name,
  pct,
  tile,
  accent,
  accentRgb,
}: {
  initials: string;
  name: string;
  pct: string;
  tile: string;
  accent: string;
  accentRgb: string;
}) {
  return (
    <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
      <div
        style={{
          width: 84,
          height: 84,
          borderRadius: "var(--r-card)",
          background: tile,
          boxShadow: `0 0 0 2.5px ${accent}, 0 0 24px rgba(${accentRgb},0.45)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 26,
          fontWeight: 700,
          color: accent,
        }}
      >
        {initials}
      </div>
      <div style={{ fontSize: 14, fontWeight: 700 }}>{name}</div>
      <div
        className="num"
        style={{
          fontSize: 26,
          fontWeight: 700,
          color: "var(--green)",
          textShadow: "0 0 14px rgba(57,255,20,0.6)",
        }}
      >
        {pct}
      </div>
    </div>
  );
}
