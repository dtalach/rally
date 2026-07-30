import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useDeviceMode } from "../useDeviceMode";
import { useRefresh } from "../useRefresh";

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
  const onRefresh = useRefresh();
  const scrollable = scroll || device;

  const ref = useRef<HTMLDivElement>(null);
  const startY = useRef<number | null>(null);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const THRESHOLD = 64;
  const canPull = Boolean(device && onRefresh && scrollable);

  /* Pull-to-refresh. Only arms when the surface is already scrolled to the
     top, so it never fights a normal scroll, and the pull is damped so it
     feels like resistance rather than a free drag. */
  const touchStart = (e: React.TouchEvent) => {
    if (!canPull || refreshing) return;
    startY.current = (ref.current?.scrollTop ?? 0) <= 0 ? e.touches[0].clientY : null;
  };

  const touchMove = (e: React.TouchEvent) => {
    if (startY.current === null) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta <= 0) {
      setPull(0);
      return;
    }
    setPull(Math.min(THRESHOLD * 1.5, delta * 0.5));
  };

  const touchEnd = async () => {
    if (startY.current === null) return;
    startY.current = null;
    if (pull >= THRESHOLD && onRefresh) {
      setRefreshing(true);
      setPull(THRESHOLD * 0.6);
      onRefresh();
      // Long enough to read as a real refresh rather than a flicker.
      setTimeout(() => {
        setRefreshing(false);
        setPull(0);
      }, 650);
    } else {
      setPull(0);
    }
  };

  const armed = pull >= THRESHOLD;

  return (
    <div
      ref={ref}
      onTouchStart={canPull ? touchStart : undefined}
      onTouchMove={canPull ? touchMove : undefined}
      onTouchEnd={canPull ? touchEnd : undefined}
      onTouchCancel={canPull ? touchEnd : undefined}
      style={{
        flex: 1,
        minHeight: 0,
        overflowY: scrollable ? "auto" : "hidden",
        overflowX: "hidden",
        WebkitOverflowScrolling: "touch",
        overscrollBehaviorY: "contain",
        padding,
        display: "flex",
        flexDirection: "column",
        gap,
        scrollbarWidth: "none",
        position: "relative",
        // Clearance for the raised TRADE button, which overhangs the nav by
        // ~30px. Without it the last row of a list sits under the button.
        paddingBottom: scrollable ? 44 : undefined,
        transform: pull > 0 ? `translateY(${pull}px)` : undefined,
        transition: startY.current === null ? "transform 260ms cubic-bezier(0.22,1,0.36,1)" : undefined,
        ...style,
      }}
    >
      {canPull && pull > 0 && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: -44,
            left: 0,
            right: 0,
            height: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.14em",
            color: armed || refreshing ? "var(--gold)" : "var(--text-3)",
            textShadow: armed || refreshing ? "0 0 12px rgba(255,230,0,0.6)" : undefined,
            pointerEvents: "none",
          }}
        >
          <i
            className={refreshing ? "ph-fill ph-coins" : "ph ph-arrow-down"}
            style={{
              fontSize: 15,
              transform: armed && !refreshing ? "rotate(180deg)" : undefined,
              transition: "transform 160ms ease",
            }}
          />
          {refreshing ? "REFRESHING" : armed ? "RELEASE" : "PULL"}
        </div>
      )}
      {children}
    </div>
  );
}
