import type { CSSProperties, ReactNode } from "react";
import { useDeviceMode } from "../useDeviceMode";

/**
 * On desktop: the iOS frame every screen is reviewed in — 390x844, 44px radius,
 * a cyan hairline ring, ambient scanlines and a cyan top bloom (both from
 * `.frame`), plus a drawn status bar and notch. `glow` is the third box-shadow;
 * each screen tints it by its own role colour.
 *
 * On a real phone: none of that chrome, because the hardware already supplies
 * it. The frame fills the viewport and pads itself out of the notch and home
 * indicator via the safe-area insets. The scanlines and bloom stay — they're
 * the design's ambient texture, not part of the bezel.
 */
export function PhoneFrame({
  children,
  glow = "rgba(34,247,255,0.12)",
  background = "var(--bg-frame)",
  style,
}: {
  children: ReactNode;
  glow?: string;
  background?: string;
  style?: CSSProperties;
}) {
  const device = useDeviceMode();

  if (device) {
    return (
      <div
        className="frame"
        style={{
          width: "100%",
          height: "100dvh",
          background,
          position: "relative",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          color: "#fff",
          paddingTop: "env(safe-area-inset-top)",
          ...style,
        }}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className="frame"
      style={{
        width: "var(--frame-w)",
        height: "var(--frame-h)",
        borderRadius: "var(--r-frame)",
        background,
        boxShadow: `var(--ring), 0 6px 28px rgba(0,0,0,0.65), 0 0 30px ${glow}`,
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        color: "#fff",
        flexShrink: 0,
        ...style,
      }}
    >
      <StatusBar />
      <Notch />
      {children}
    </div>
  );
}

export function StatusBar() {
  return (
    <div
      style={{
        height: 52,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        padding: "0 26px 6px",
        fontSize: 12,
        color: "var(--text-3)",
        position: "relative",
        zIndex: 3,
        flexShrink: 0,
      }}
    >
      <span className="num">9:41</span>
      <span style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 13 }}>
        <i className="ph ph-cell-signal-full" />
        <i className="ph ph-wifi-high" />
        <i className="ph ph-battery-full" />
      </span>
    </div>
  );
}

export function Notch() {
  return (
    <div
      style={{
        position: "absolute",
        top: 11,
        left: "50%",
        transform: "translateX(-50%)",
        width: 104,
        height: 28,
        borderRadius: 16,
        background: "var(--bg-notch)",
        zIndex: 5,
      }}
    />
  );
}

/**
 * The padded scroll surface between the status bar and the tab bar.
 * `overflow:hidden` in the prototype (frames were static); here the feed and
 * list screens are allowed to scroll, which is what the design intends —
 * "the feed is meant to scroll". On a real phone every screen scrolls, since
 * the viewport is whatever the device gives us rather than a fixed 844px.
 */
export function Screen({
  children,
  gap = 14,
  padding = "12px 20px 0",
  style,
  scroll = false,
}: {
  children: ReactNode;
  gap?: number;
  padding?: string;
  style?: CSSProperties;
  scroll?: boolean;
}) {
  const device = useDeviceMode();
  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        overflowY: scroll || device ? "auto" : "hidden",
        overflowX: "hidden",
        WebkitOverflowScrolling: "touch",
        overscrollBehaviorY: "contain",
        padding,
        display: "flex",
        flexDirection: "column",
        gap,
        scrollbarWidth: "none",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
