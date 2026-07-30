import { useCallback } from "react";
import { Link, Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { SCREENS, SCREEN_BY_ID, TAB_ROOT, type Nav, type ScreenId } from "./screens";
import type { Tab } from "./components/TabBar";
import { Chip } from "./components/ui";

/* Two ways in:
     /             the design canvas — all 20 frames side by side, for review
     /app/:screen  a single phone frame you can actually navigate            */

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Gallery />} />
      <Route path="/app" element={<Navigate to="/app/press-start" replace />} />
      <Route path="/app/:screen" element={<AppShell />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function useNav(): Nav {
  const navigate = useNavigate();
  const go = useCallback((id: ScreenId) => navigate(`/app/${id}`), [navigate]);
  const tab = useCallback((t: Tab) => navigate(`/app/${TAB_ROOT[t]}`), [navigate]);
  return { go, tab };
}

function AppShell() {
  const { screen } = useParams<{ screen: string }>();
  const nav = useNav();
  const def = screen && screen in SCREEN_BY_ID ? SCREEN_BY_ID[screen as ScreenId] : undefined;

  if (!def) return <Navigate to="/app/press-start" replace />;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        padding: "32px 16px",
      }}
    >
      {def.render(nav)}
      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <Chip role="magenta">
          {def.no} · {def.title}
        </Chip>
        <Link to="/" style={{ fontSize: 13, color: "var(--cyan-soft)" }}>
          all frames
        </Link>
      </div>
    </div>
  );
}

function Gallery() {
  const nav = useNav();

  return (
    <section style={{ padding: "64px 72px 120px", display: "flex", flexDirection: "column", gap: 40 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 880 }}>
        <div className="pixel" style={{ fontSize: 10, color: "var(--magenta)", textShadow: "0 0 10px #ff2bd6" }}>
          RALLY · NEON GLASS × ARCADE
        </div>
        <h1 style={{ fontSize: 42, margin: 0, color: "#fff", fontWeight: 700, letterSpacing: "-0.03em" }}>
          Stock combat system
        </h1>
        <p style={{ color: "var(--text-2)", fontSize: 17, margin: 0, maxWidth: 740, textWrap: "pretty" }}>
          Neon-glass surfaces, rounded cards and readable type carry the UI; the arcade brings the soul — the
          pixel logo, P1/P2 tags, HIGH SCORES, health bars, trophies and trash-talk copy. Twenty frames, built
          from the Claude Design handoff. Tap any frame label, or open{" "}
          <Link to="/app/press-start">the navigable app</Link>.
        </p>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 48, alignItems: "flex-start" }}>
        {SCREENS.map((s) => (
          <div key={s.id} style={{ display: "flex", flexDirection: "column", gap: 10, width: 390 }}>
            <button
              type="button"
              onClick={() => nav.go(s.id)}
              title="Open in the navigable app"
              style={{
                alignSelf: "flex-start",
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
              }}
            >
              <Chip role="magenta">
                {s.no} · {s.title}
              </Chip>
            </button>
            {s.render(nav)}
          </div>
        ))}
      </div>
    </section>
  );
}
