import type { ReactNode } from "react";
import { useDeviceMode } from "../useDeviceMode";

/**
 * HOME · FOLIO · [TRADE] · RACE · DUELS
 *
 * TRADE is a raised, glowing magenta arcade button in the centre — the
 * coin-slot button on the cabinet — because trading is the action that drives
 * every other number in the app. It glows hotter on trade screens.
 */
export type Tab = "home" | "folio" | "trade" | "race" | "duels";

export function TabBar({
  active,
  onNavigate,
}: {
  active?: Tab;
  onNavigate?: (tab: Tab) => void;
}) {
  const device = useDeviceMode();
  const tradeActive = active === "trade";

  const item = (id: Exclude<Tab, "trade">, label: string, icon: string) => {
    const isActive = active === id;
    return (
      <NavSlot key={id} flex={1} onClick={() => onNavigate?.(id)}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            fontSize: 11,
            fontWeight: 700,
            ...(isActive
              ? {
                  color: "var(--cyan-white)",
                  letterSpacing: "0.05em",
                  textShadow: "0 0 14px var(--cyan)",
                }
              : { color: "var(--text-3)" }),
          }}
        >
          <i className={`${isActive ? "ph-fill" : "ph"} ph-${icon}`} style={{ fontSize: 23 }} />
          {label}
        </div>
      </NavSlot>
    );
  };

  return (
    <div
      style={{
        // On a real phone the bar grows by the home-indicator inset so the
        // labels sit above it rather than under the swipe area.
        height: device ? "calc(var(--nav-h) + env(safe-area-inset-bottom))" : "var(--nav-h)",
        flexShrink: 0,
        borderTop: "2px solid var(--cyan-rule)",
        background: "var(--grad-nav)",
        boxShadow: "0 -10px 30px rgba(0,217,232,0.25)",
        display: "flex",
        alignItems: "center",
        padding: device ? "0 6px calc(14px + env(safe-area-inset-bottom))" : "0 6px 14px",
        // Positioned so it paints above the scroll surface, which is itself
        // positioned. Otherwise a pulled-down screen slides over the nav.
        position: "relative",
      }}
    >
      {item("home", "HOME", "house")}
      {item("folio", "FOLIO", "chart-pie-slice")}

      <NavSlot flex={1.2} onClick={() => onNavigate?.("trade")}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 3,
            marginTop: -30,
          }}
        >
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: "50%",
              background: "var(--grad-btn-magenta)",
              boxShadow: `0 0 0 4px var(--bg-frame), 0 0 24px rgba(255,43,214,${
                tradeActive ? 0.9 : 0.55
              }), inset 0 -4px 0 rgba(0,0,0,0.25)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <i className="ph-fill ph-arrows-left-right" style={{ fontSize: 26, color: "#fff" }} />
          </div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.08em",
              color: tradeActive ? "#fff" : "var(--magenta-soft)",
            }}
          >
            TRADE
          </div>
        </div>
      </NavSlot>

      {item("race", "RACE", "flag-checkered")}
      {item("duels", "DUELS", "sword")}
    </div>
  );
}

function NavSlot({
  flex,
  onClick,
  children,
}: {
  flex: number;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="press"
      style={{
        flex,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "none",
        border: "none",
        padding: 0,
        font: "inherit",
        cursor: onClick ? "pointer" : "default",
        alignSelf: "stretch",
      }}
    >
      {children}
    </button>
  );
}
