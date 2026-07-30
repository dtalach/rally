import type { CSSProperties, ReactNode } from "react";
import { ROLE, type Role } from "../styles/roles";

export { ROLE, type Role };

/* -------------------------------------------------------------------------
   One label pattern, one shape language, one palette logic — the pieces the
   design chat converged on. Everything here is shared across screens; genuine
   one-offs stay inline in the screen that owns them.
------------------------------------------------------------------------- */

/** The 8px pixel chip — same padding, radius, tinted fill and hairline ring
 *  on every screen, recoloured by role. */
export function Chip({
  children,
  role,
  style,
}: {
  children: ReactNode;
  role?: Role;
  style?: CSSProperties;
}) {
  const tint = role ? ROLE[role] : null;
  return (
    <div
      className="chip"
      style={
        tint
          ? {
              color: tint.base,
              background: `rgba(${tint.rgb},0.12)`,
              boxShadow: `inset 0 0 0 1px rgba(${tint.rgb},0.5)`,
              ...style,
            }
          : style
      }
    >
      {children}
    </div>
  );
}

/** Avatar on every tab root, never on detail screens. The gold trophy pip is
 *  the discoverability trick that makes the profile surface findable. */
export function Avatar({
  initials = "JD",
  size = 34,
  pip,
  ring = true,
  onClick,
}: {
  initials?: string;
  size?: number;
  pip?: number;
  ring?: boolean;
  onClick?: () => void;
}) {
  const avatar = (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "var(--cyan-deep)",
        boxShadow: ring ? "0 0 0 1.5px rgba(34,247,255,0.5)" : undefined,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: Math.round(size * 0.38),
        fontWeight: 700,
        color: "var(--cyan-pale)",
      }}
    >
      {initials}
    </div>
  );

  if (pip === undefined) {
    return onClick ? <Pressable onClick={onClick}>{avatar}</Pressable> : avatar;
  }

  const withPip = (
    <div style={{ position: "relative" }}>
      {avatar}
      <div
        className="num"
        style={{
          position: "absolute",
          right: -7,
          top: -7,
          minWidth: 18,
          height: 18,
          padding: "0 4px",
          borderRadius: 9,
          background: "var(--gold)",
          color: "var(--gold-ink)",
          fontSize: 10,
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 0 8px rgba(255,230,0,0.7)",
        }}
      >
        <i className="ph-fill ph-trophy" style={{ fontSize: 9, marginRight: 1 }} />
        {pip}
      </div>
    </div>
  );

  return onClick ? <Pressable onClick={onClick}>{withPip}</Pressable> : withPip;
}

export function Pressable({
  children,
  onClick,
  style,
}: {
  children: ReactNode;
  onClick?: () => void;
  style?: CSSProperties;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: "none",
        border: "none",
        padding: 0,
        font: "inherit",
        color: "inherit",
        textAlign: "inherit",
        cursor: onClick ? "pointer" : "default",
        display: "block",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

/** Uppercase, letter-spaced, chunky arcade buttons with the pressed-in bottom
 *  edge. `►` blinks on the ones the design marks as the "press start" moment. */
export function Button({
  children,
  variant = "green",
  height = 54,
  fontSize = 15,
  caret,
  blink,
  icon,
  onClick,
  disabled,
  style,
}: {
  children: ReactNode;
  variant?: "green" | "magenta" | "gold" | "outline";
  height?: number;
  fontSize?: number;
  caret?: boolean;
  blink?: boolean;
  icon?: string;
  onClick?: () => void;
  disabled?: boolean;
  style?: CSSProperties;
}) {
  const skins: Record<string, CSSProperties> = {
    green: {
      background: "var(--grad-btn-green)",
      color: "var(--green-ink)",
      boxShadow: "0 0 24px rgba(57,255,20,0.5), inset 0 -4px 0 rgba(0,0,0,0.2)",
    },
    magenta: {
      background: "var(--grad-btn-magenta)",
      color: "#fff",
      boxShadow: "0 0 24px rgba(255,43,214,0.5), inset 0 -4px 0 rgba(0,0,0,0.25)",
    },
    gold: {
      background: "var(--grad-btn-gold)",
      color: "#2b1f00",
      boxShadow: "0 0 26px rgba(255,230,0,0.5), inset 0 -4px 0 rgba(0,0,0,0.2)",
    },
    outline: {
      color: "var(--cyan)",
      boxShadow: "inset 0 0 0 1.5px var(--cyan)",
    },
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        height,
        width: "100%",
        // A disabled action still reads as the same control, just muted.
        opacity: disabled ? 0.45 : 1,
        border: "none",
        borderRadius: "var(--r-tile)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        fontFamily: "inherit",
        fontSize,
        fontWeight: 700,
        letterSpacing: "0.06em",
        cursor: disabled ? "not-allowed" : onClick ? "pointer" : "default",
        ...skins[variant],
        ...style,
      }}
    >
      {caret && (
        <span
          className="pixel"
          style={{ fontSize: 10, animation: blink ? "blink 1.2s step-end infinite" : undefined }}
        >
          ►
        </span>
      )}
      {icon && <i className={icon} />}
      {children}
    </button>
  );
}

/** Surface card — the single cyan hairline ring on every card. */
export function Card({
  children,
  background = "var(--bg-card)",
  ring = "var(--ring)",
  radius = "var(--r-tile)",
  padding,
  style,
  onClick,
}: {
  children: ReactNode;
  background?: string;
  ring?: string;
  radius?: number | string;
  padding?: number | string;
  style?: CSSProperties;
  onClick?: () => void;
}) {
  const el = (
    <div
      style={{
        borderRadius: radius,
        background,
        boxShadow: ring,
        padding,
        ...style,
      }}
    >
      {children}
    </div>
  );
  return onClick ? (
    <Pressable onClick={onClick} style={{ width: "100%" }}>
      {el}
    </Pressable>
  ) : (
    el
  );
}

/** The segmented toggle used for MY CREW/LEAGUE, MONTH/QUARTER/YEAR,
 *  gainers/losers/most-traded, BUY/SELL and duel durations. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  activeSkin = "magenta",
  fontSize = 12.5,
  padY = 8,
  numeric,
  style,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange?: (id: T) => void;
  activeSkin?: "magenta" | "cyan" | "green" | "gold";
  fontSize?: number;
  padY?: number;
  numeric?: boolean;
  style?: CSSProperties;
}) {
  const skins: Record<string, CSSProperties> = {
    magenta: {
      background: "var(--grad-btn-magenta)",
      color: "#fff",
      boxShadow: "0 0 16px rgba(255,43,214,0.45)",
    },
    cyan: {
      background: "var(--grad-btn-cyan)",
      color: "#08021a",
      boxShadow: "0 0 14px rgba(34,247,255,0.45)",
    },
    green: {
      background: "var(--grad-btn-green)",
      color: "var(--green-ink)",
      boxShadow: "0 0 14px rgba(57,255,20,0.4)",
    },
    gold: {
      background: "rgba(34,247,255,0.15)",
      color: "var(--cyan)",
      boxShadow: "inset 0 0 0 1px rgba(34,247,255,0.5)",
    },
  };

  return (
    <div
      style={{ display: "flex", gap: 6, padding: 4, borderRadius: 12, background: "var(--bg-card)", ...style }}
    >
      {options.map((o) => {
        const on = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            className={numeric ? "num" : undefined}
            onClick={() => onChange?.(o.id)}
            style={{
              flex: 1,
              textAlign: "center",
              padding: `${padY}px 0`,
              borderRadius: 9,
              border: "none",
              fontFamily: "inherit",
              fontSize,
              fontWeight: on ? 700 : 600,
              cursor: onChange ? "pointer" : "default",
              ...(on ? skins[activeSkin] : { background: "transparent", color: "var(--text-2)" }),
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Section kicker — small, letter-spaced, ice-blue. */
export function Kicker({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: "0.12em",
        color: "var(--cyan-soft)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** Screen title — letter-spaced 700 caps, the one type-weight scale. */
export function Title({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: "0.04em", ...style }}>{children}</div>
  );
}

/** A square-ish ticker badge (NV, SP, AP…) tinted by role. */
export function Ticker({
  children,
  role,
  size = 42,
  radius = 12,
  fontSize = 13,
}: {
  children: ReactNode;
  role: Role | string;
  size?: number;
  radius?: number | string;
  fontSize?: number;
}) {
  const tint = (ROLE as Record<string, { base: string; rgb: string }>)[role];
  const base = tint ? tint.base : role;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: `${base}22`,
        boxShadow: `inset 0 0 0 1.5px ${base}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize,
        fontWeight: 700,
        color: base,
        flexShrink: 0,
      }}
    >
      {children}
    </div>
  );
}

/** A neon race/price line: thick stroke plus a tight + wide drop-shadow bloom. */
export function GlowLine({
  points,
  color,
  width = 3.5,
  tight = 3,
  bloom = 12,
}: {
  points: string;
  color: string;
  width?: number;
  tight?: number;
  bloom?: number;
}) {
  return (
    <polyline
      points={points}
      fill="none"
      stroke={color}
      strokeWidth={width}
      style={{ filter: `drop-shadow(0 0 ${tight}px ${color}) drop-shadow(0 0 ${bloom}px ${color})` }}
    />
  );
}

export function GlowDot({ cx, cy, r = 5, color }: { cx: number; cy: number; r?: number; color: string }) {
  return <circle cx={cx} cy={cy} r={r} fill={color} style={{ filter: `drop-shadow(0 0 8px ${color})` }} />;
}

/** The "Maya passed you at 10:04" style nudge bar. */
export function Nudge({
  children,
  icon = "ph-fill ph-lightning",
  role = "gold",
}: {
  children: ReactNode;
  icon?: string;
  role?: Role;
}) {
  const tint = ROLE[role];
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "12px 14px",
        borderRadius: "var(--r-tile)",
        background: `rgba(${tint.rgb},0.08)`,
        boxShadow: `0 0 0 1.5px rgba(${tint.rgb},0.5)`,
      }}
    >
      <i className={icon} style={{ color: tint.base, fontSize: 19 }} />
      <div style={{ fontSize: 14, fontWeight: 600, color: tint.base, flex: 1 }}>{children}</div>
    </div>
  );
}

/** Back chevron used on detail screens (which deliberately have no avatar). */
export function BackCaret({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Back"
      style={{
        background: "none",
        border: "none",
        padding: 0,
        cursor: onClick ? "pointer" : "default",
        display: "flex",
        alignItems: "center",
      }}
    >
      <i className="ph ph-caret-left" style={{ fontSize: 22, color: "var(--cyan-soft)" }} />
    </button>
  );
}

/** The drag handle on pull-up sheets. */
export function SheetHandle() {
  return (
    <div
      style={{
        width: 44,
        height: 5,
        borderRadius: 3,
        background: "#3a2f6e",
        margin: "0 auto",
      }}
    />
  );
}

/** Bottom sheet: order ticket and profile pull-up share this shell. */
export function Sheet({
  children,
  paddingBottom = 40,
}: {
  children: ReactNode;
  paddingBottom?: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 4,
        borderRadius: "28px 28px var(--r-frame) var(--r-frame)",
        background: "var(--grad-sheet)",
        boxShadow: "0 0 0 1.5px var(--cyan), 0 -12px 44px rgba(34,247,255,0.3)",
        padding: `12px 24px ${paddingBottom}px`,
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <SheetHandle />
      {children}
    </div>
  );
}
