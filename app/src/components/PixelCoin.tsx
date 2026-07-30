import type { CSSProperties } from "react";
import { COIN_BRIGHT, type CoinSkin } from "./coinSkins";

/**
 * A chunky octagonal arcade coin — dark rim, flat gold fill, a pale left-edge
 * highlight and the classic centre slot. Deliberately not a glossy circle:
 * the design went through several rounds landing on "pixelated like a 2D retro
 * video game gold coin, like a Super Mario coin".
 */
const OCTAGON =
  "polygon(25% 0,75% 0,75% 12%,88% 12%,88% 25%,100% 25%,100% 75%,88% 75%,88% 88%,75% 88%,75% 100%,25% 100%,25% 88%,12% 88%,12% 75%,0 75%,0 25%,12% 25%,12% 12%,25% 12%)";

export function PixelCoin({
  outerW,
  outerH,
  innerW,
  innerH,
  skin = COIN_BRIGHT,
  highlightW = 3,
  highlightH = 6,
  highlightOffset = 3,
  slotW = 3,
  slotH = 12,
  spin,
  style,
}: {
  outerW: number;
  outerH: number;
  innerW: number;
  innerH: number;
  skin?: CoinSkin;
  highlightW?: number;
  highlightH?: number;
  highlightOffset?: number;
  slotW?: number;
  slotH?: number;
  /** seconds per rotation — the coin flips edge-on as it falls */
  spin?: number;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        width: outerW,
        height: outerH,
        clipPath: OCTAGON,
        background: skin.rim,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        animation: spin ? `spinY ${spin}s steps(6) infinite` : undefined,
        ...style,
      }}
    >
      <div
        style={{
          width: innerW,
          height: innerH,
          clipPath: OCTAGON,
          background: skin.fill,
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: highlightOffset,
            top: highlightOffset,
            width: highlightW,
            height: highlightH,
            background: skin.highlight,
          }}
        />
        <div style={{ width: slotW, height: slotH, background: skin.slot }} />
      </div>
    </div>
  );
}

/** A plus-shaped pixel glint, for the arcade twinkle above the hoard. */
export function Sparkle({
  left,
  bottom,
  size = 4,
  color = "#fff",
}: {
  left: number;
  bottom: number;
  size?: number;
  color?: string;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left,
        bottom,
        width: size,
        height: size,
        background: color,
        boxShadow: `${size}px 0 ${color}, -${size}px 0 ${color}, 0 ${size}px ${color}, 0 -${size}px ${color}`,
      }}
    />
  );
}
