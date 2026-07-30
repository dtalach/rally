import { useState } from "react";
import { PhoneFrame, Screen } from "../components/PhoneFrame";
import { Button, Chip, ROLE } from "../components/ui";
import { api, useApi, type Player } from "../api";

/* Sign-in for the test crew.
   Not part of the original 20 frames — the design's onboarding is the coin
   drop, which assumes a fresh $1,000,000. These accounts already have running
   portfolios, so this picks up an existing player instead. Same visual
   language: pixel logo, glass cards, the gold PRESS START button. */

const ROLES = ["cyan", "magenta", "green", "gold"] as const;

export function Login({ onSignedIn }: { onSignedIn: (p: Player) => void }) {
  const { data, error: loadError, loading } = useApi(() => api.players(), []);
  const [selected, setSelected] = useState<Player | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!selected || pin.length < 4 || busy) return;
    setBusy(true);
    setError(undefined);
    try {
      const { player } = await api.login(selected.handle, pin);
      onSignedIn(player);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't sign in.");
      setPin("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PhoneFrame glow="rgba(255,230,0,0.16)">
      <Screen scroll gap={18} padding="24px 24px 0">
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.3em",
              color: "var(--cyan)",
              textShadow: "0 0 12px rgba(34,247,255,0.7)",
            }}
          >
            STOCK COMBAT SYSTEM
          </div>
          <div
            className="pixel"
            style={{
              fontSize: 38,
              lineHeight: 1,
              color: "var(--gold)",
              animation: "logoglow 2.4s ease-in-out infinite",
            }}
          >
            RALLY
          </div>
          <Chip role="gold">SELECT PLAYER</Chip>
        </div>

        {loading && <Muted>Loading the crew…</Muted>}
        {loadError && <Problem>{loadError}</Problem>}

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {data?.players.map((p, i) => {
            const tint = ROLE[ROLES[i % ROLES.length]];
            const on = selected?.id === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setSelected(p);
                  setPin("");
                  setError(undefined);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 14px",
                  borderRadius: "var(--r-tile)",
                  border: "none",
                  fontFamily: "inherit",
                  textAlign: "left",
                  color: "#fff",
                  cursor: "pointer",
                  background: on ? "var(--grad-cyan-card)" : "var(--bg-card)",
                  boxShadow: on
                    ? "0 0 0 1.5px var(--cyan), 0 0 20px rgba(34,247,255,0.3)"
                    : "var(--ring)",
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: "50%",
                    background: `${tint.base}22`,
                    boxShadow: `inset 0 0 0 1.5px ${tint.base}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    fontWeight: 700,
                    color: tint.base,
                    flexShrink: 0,
                  }}
                >
                  {p.initials}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: "var(--text-2)" }}>
                    {on ? "Enter your PIN below" : "Tap to select"}
                  </div>
                </div>
                {on && <i className="ph-fill ph-check-circle" style={{ fontSize: 24, color: "var(--green)" }} />}
              </button>
            );
          })}
        </div>

        {selected && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", color: "var(--cyan-soft)" }}>
              4-DIGIT PIN
            </div>
            <input
              autoFocus
              type="tel"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={4}
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/\D/g, "").slice(0, 4));
                setError(undefined);
              }}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="––––"
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: "var(--r-tile)",
                border: "none",
                background: "var(--bg-card)",
                boxShadow: "inset 0 0 0 1.5px rgba(34,247,255,0.35)",
                color: "var(--cyan)",
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: "0.5em",
                textAlign: "center",
                fontVariantNumeric: "tabular-nums",
              }}
            />
            {error && <Problem>{error}</Problem>}
            <Button
              variant="gold"
              height={56}
              caret
              blink={!busy}
              onClick={submit}
              style={{ opacity: pin.length === 4 && !busy ? 1 : 0.55 }}
            >
              {busy ? "CHECKING…" : "PRESS START"}
            </Button>
          </div>
        )}

        <div style={{ textAlign: "center", fontSize: 12, color: "var(--text-4)", paddingBottom: 24 }}>
          Test accounts · fake money, not investing advice
        </div>
      </Screen>
    </PhoneFrame>
  );
}

function Muted({ children }: { children: React.ReactNode }) {
  return <div style={{ textAlign: "center", fontSize: 13, color: "var(--text-2)" }}>{children}</div>;
}

export function Problem({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "11px 14px",
        borderRadius: 14,
        background: "rgba(255,43,214,0.08)",
        boxShadow: "inset 0 0 0 1.5px rgba(255,43,214,0.45)",
        fontSize: 13,
        color: "var(--magenta)",
      }}
    >
      <i className="ph-fill ph-warning" style={{ fontSize: 17 }} />
      <span style={{ flex: 1 }}>{children}</span>
    </div>
  );
}
