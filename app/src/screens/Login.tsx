import { useState } from "react";
import { PhoneFrame, Screen } from "../components/PhoneFrame";
import { Button, Chip } from "../components/ui";
import { api, type Player } from "../api";

/* Sign in, or make an account.
   Not part of the original 20 frames — the design's onboarding is the coin
   drop, which this is the front door to: create an account and a million
   lands in it. Same visual language as the rest — pixel logo, glass cards,
   the gold PRESS START button. */

const MIN_PASSWORD = 8;

export function Login({ onSignedIn }: { onSignedIn: (p: Player) => void }) {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const signingUp = mode === "up";
  const ready =
    email.trim().length > 3 &&
    password.length >= MIN_PASSWORD &&
    (!signingUp || name.trim().length >= 2);

  async function submit() {
    if (!ready || busy) return;
    setBusy(true);
    setError(undefined);
    try {
      const { player } = signingUp
        ? await api.signup(name.trim(), email.trim(), password)
        : await api.login(email.trim(), password);
      onSignedIn(player);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't sign in.");
      setPassword("");
    } finally {
      setBusy(false);
    }
  }

  const swap = () => {
    setMode(signingUp ? "in" : "up");
    setError(undefined);
    setPassword("");
  };

  return (
    <PhoneFrame glow="rgba(255,230,0,0.16)">
      <Screen scroll gap={16} padding="24px 24px 0">
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
          <Chip role="gold">{signingUp ? "NEW PLAYER" : "SIGN IN"}</Chip>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          {signingUp && (
            <Field
              label="WHAT DO WE CALL YOU"
              value={name}
              onChange={setName}
              placeholder="Your name"
              autoComplete="name"
              autoCapitalize="words"
            />
          )}
          <Field
            label="EMAIL"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
          />
          <Field
            label="PASSWORD"
            value={password}
            onChange={setPassword}
            placeholder={signingUp ? `At least ${MIN_PASSWORD} characters` : "Your password"}
            type={show ? "text" : "password"}
            autoComplete={signingUp ? "new-password" : "current-password"}
            autoCapitalize="none"
            trailing={
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? "Hide password" : "Show password"}
                style={{
                  background: "none",
                  border: "none",
                  padding: 4,
                  cursor: "pointer",
                  display: "flex",
                  color: "var(--cyan-soft)",
                }}
              >
                <i className={show ? "ph ph-eye-slash" : "ph ph-eye"} style={{ fontSize: 19 }} />
              </button>
            }
          />

          {error && <Problem>{error}</Problem>}

          <Button
            variant="gold"
            height={56}
            caret
            blink={!busy && ready}
            type="submit"
            disabled={busy || !ready}
            style={{ opacity: ready && !busy ? 1 : 0.55 }}
          >
            {busy ? (signingUp ? "CREATING…" : "CHECKING…") : signingUp ? "DROP MY COINS" : "PRESS START"}
          </Button>
        </form>

        {signingUp && (
          <div style={{ textAlign: "center", fontSize: 12, color: "var(--cyan-soft)" }}>
            You'll start with{" "}
            <span className="num" style={{ fontWeight: 700, color: "var(--gold)" }}>
              $1,000,000
            </span>{" "}
            in coins.
          </div>
        )}

        <button
          type="button"
          onClick={swap}
          style={{
            background: "none",
            border: "none",
            fontFamily: "inherit",
            fontSize: 13,
            color: "var(--cyan)",
            cursor: "pointer",
            padding: "6px 0",
          }}
        >
          {signingUp ? "Already have an account? Sign in" : "New here? Create an account"}
        </button>

        <div style={{ textAlign: "center", fontSize: 12, color: "var(--text-4)", paddingBottom: 24 }}>
          Fake money · real prices, 15 min delayed · not investing advice
        </div>
      </Screen>
    </PhoneFrame>
  );
}

function Field({
  label,
  value,
  onChange,
  trailing,
  ...input
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  trailing?: React.ReactNode;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  // The show/hide button sits inside the field box but outside the <label>,
  // so it doesn't get swept up as part of the input's accessible name.
  const id = `field-${label.toLowerCase().replace(/[^a-z]+/g, "-")}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      <label
        htmlFor={id}
        style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "var(--cyan-soft)" }}
      >
        {label}
      </label>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "12px 14px",
          borderRadius: "var(--r-tile)",
          background: "var(--bg-card)",
          boxShadow: "inset 0 0 0 1.5px rgba(34,247,255,0.35)",
        }}
      >
        <input
          {...input}
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            flex: 1,
            minWidth: 0,
            border: "none",
            background: "transparent",
            outline: "none",
            fontFamily: "inherit",
            fontSize: 16,
            fontWeight: 600,
            color: "#fff",
            caretColor: "var(--cyan)",
          }}
        />
        {trailing}
      </div>
    </div>
  );
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
