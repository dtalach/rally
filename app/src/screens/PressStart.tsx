import { PhoneFrame } from "../components/PhoneFrame";
import { Button, Chip } from "../components/ui";
import { PixelCoin, Sparkle } from "../components/PixelCoin";
import { COIN_BRIGHT, COIN_DULL, COIN_MID, type CoinSkin } from "../components/coinSkins";

/* 01 · PRESS START · COIN DROP
   Pixel RALLY logo over the synthwave horizon, the ticking $1,000,000 counter,
   coins spinning down from the sky, and one big static arcade hoard at the
   bottom. The pile is deliberately static — animating it was tried across
   several rounds and read as honey rather than gold. */

type Falling = {
  left: string;
  fall: number;
  delay: number;
  spin: number;
  outer: [number, number];
  inner: [number, number];
  hl: number;
  slotH: number;
};

const FALLING: Falling[] = [
  { left: "10%", fall: 2.6, delay: 0, spin: 0.9, outer: [26, 30], inner: [20, 24], hl: 3, slotH: 12 },
  { left: "26%", fall: 3.2, delay: 0.7, spin: 1.2, outer: [20, 23], inner: [14, 17], hl: 3, slotH: 9 },
  { left: "44%", fall: 2.9, delay: 1.4, spin: 0.8, outer: [30, 35], inner: [22, 27], hl: 4, slotH: 14 },
  { left: "60%", fall: 3.5, delay: 0.35, spin: 1.1, outer: [22, 26], inner: [16, 20], hl: 3, slotH: 10 },
  { left: "76%", fall: 2.7, delay: 2.1, spin: 1.0, outer: [26, 30], inner: [20, 24], hl: 3, slotH: 12 },
  { left: "88%", fall: 3.8, delay: 1.1, spin: 1.3, outer: [18, 21], inner: [12, 15], hl: 3, slotH: 8 },
  { left: "35%", fall: 3.3, delay: 2.6, spin: 0.9, outer: [22, 26], inner: [16, 20], hl: 3, slotH: 10 },
  { left: "68%", fall: 3.0, delay: 1.8, spin: 1.15, outer: [24, 28], inner: [18, 22], hl: 3, slotH: 11 },
];

type Piled = {
  left: number;
  bottom: number;
  rot: number;
  outer: number;
  inner: number;
  skin: CoinSkin;
  hl: number;
  slotH: number;
};

/* Five overlapping tiers tapering to a single crown coin — dull bronze
   half-buried at the back, mid-gold through the middle, bright gold on top,
   every coin at an irregular tilt so nothing looks grid-placed. */
const PILE: Piled[] = [
  // base tier — 8 coins, dull bronze
  ...([
    [2, -6, -9],
    [36, -4, 7],
    [70, -7, -4],
    [104, -5, 11],
    [138, -6, -8],
    [172, -4, 5],
    [206, -7, -11],
    [238, -5, 8],
  ] as const).map(([left, bottom, rot]) => ({
    left, bottom, rot, outer: 34, inner: 26, skin: COIN_DULL, hl: 4, slotH: 14,
  })),
  // second tier — 6 coins, mid gold
  ...([
    [26, 20, 6],
    [60, 22, -6],
    [94, 19, 10],
    [128, 21, -7],
    [162, 20, 9],
    [196, 18, -5],
  ] as const).map(([left, bottom, rot]) => ({
    left, bottom, rot, outer: 32, inner: 24, skin: COIN_MID, hl: 4, slotH: 13,
  })),
  // third tier — 4 coins
  ...([
    [62, 42, 4],
    [96, 44, -9],
    [130, 41, 7],
    [164, 43, -4],
  ] as const).map(([left, bottom, rot]) => ({
    left, bottom, rot, outer: 31, inner: 23, skin: COIN_MID, hl: 4, slotH: 12,
  })),
  // fourth tier — 3 coins, bright
  ...([
    [80, 62, 11],
    [112, 64, -8],
    [144, 61, 5],
  ] as const).map(([left, bottom, rot]) => ({
    left, bottom, rot, outer: 30, inner: 22, skin: COIN_BRIGHT, hl: 4, slotH: 12,
  })),
  // fifth tier — 2 coins
  ...([
    [98, 82, -11],
    [126, 84, 8],
  ] as const).map(([left, bottom, rot]) => ({
    left, bottom, rot, outer: 29, inner: 23, skin: COIN_BRIGHT, hl: 3, slotH: 12,
  })),
  // the crown
  { left: 112, bottom: 102, rot: 6, outer: 28, inner: 22, skin: COIN_BRIGHT, hl: 3, slotH: 11 },
];

export function PressStart({ onStart }: { onStart?: () => void }) {
  return (
    <PhoneFrame glow="rgba(255,230,0,0.16)">
      {/* synthwave horizon */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 300,
          overflow: "hidden",
          zIndex: 0,
          borderRadius: "0 0 var(--r-frame) var(--r-frame)",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "-50%",
            right: "-50%",
            top: 0,
            bottom: -110,
            background:
              "repeating-linear-gradient(90deg,rgba(255,43,214,0.7) 0 2px,transparent 2px 46px)," +
              "repeating-linear-gradient(0deg,rgba(255,43,214,0.7) 0 2px,transparent 2px 38px)",
            opacity: 0.25,
            transform: "perspective(240px) rotateX(62deg)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg,#0a0420 0%,transparent 55%)",
          }}
        />
      </div>

      {/* coins raining down */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: 620,
          overflow: "hidden",
          zIndex: 1,
          perspective: 600,
        }}
      >
        {FALLING.map((c, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: c.left,
              top: 0,
              animation: `coinfall ${c.fall}s linear infinite`,
              animationDelay: `${c.delay}s`,
            }}
          >
            <PixelCoin
              outerW={c.outer[0]}
              outerH={c.outer[1]}
              innerW={c.inner[0]}
              innerH={c.inner[1]}
              highlightW={c.hl}
              highlightH={c.hl * 2}
              highlightOffset={c.hl}
              slotW={c.hl}
              slotH={c.slotH}
              spin={c.spin}
            />
          </div>
        ))}
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "22px 30px 0",
          gap: 18,
          position: "relative",
          zIndex: 3,
          textAlign: "center",
        }}
      >
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
            fontSize: 42,
            lineHeight: 1,
            color: "var(--gold)",
            animation: "logoglow 2.4s ease-in-out infinite",
          }}
        >
          RALLY
        </div>
        <Chip role="gold">STACK LOADING…</Chip>

        <div
          style={{
            borderRadius: "var(--r-card)",
            padding: "16px 22px",
            background: "linear-gradient(165deg,rgba(58,43,0,0.85),rgba(14,5,38,0.85))",
            boxShadow: "0 0 0 1.5px var(--gold), 0 0 34px rgba(255,230,0,0.35)",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <div
            className="num"
            style={{
              fontSize: 44,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "var(--gold)",
              textShadow: "0 0 22px rgba(255,230,0,0.7)",
              animation: "tick 0.5s steps(2) infinite",
            }}
          >
            $1,000,000
          </div>
          <div style={{ fontSize: 13, color: "var(--gold-text)" }}>1,000,000 coins credited</div>
        </div>

        <div style={{ fontSize: 14, color: "var(--text-1)", maxWidth: 290 }}>
          Fake money. Real prices. Real bragging rights.
          <br />
          Every coin is a dollar of buying power.
        </div>
      </div>

      {/* the hoard */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 120,
          height: 300,
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-end",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: 10,
            transform: "translateX(-50%)",
            width: 420,
            height: 230,
            borderRadius: "50%",
            background: "radial-gradient(ellipse at center,rgba(255,230,0,0.45),transparent 65%)",
            opacity: 0.7,
          }}
        />
        <div
          style={{ position: "absolute", left: 0, right: 0, bottom: 0, width: 272, height: 250, margin: "0 auto" }}
        >
          <div
            style={{
              position: "absolute",
              left: "50%",
              marginLeft: -140,
              bottom: -4,
              width: 280,
              height: 24,
              borderRadius: 4,
              background: "rgba(0,0,0,0.5)",
            }}
          />
          {PILE.map((c, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: c.left,
                bottom: c.bottom,
                transform: `rotate(${c.rot}deg)`,
              }}
            >
              <PixelCoin
                outerW={c.outer}
                outerH={c.outer}
                innerW={c.inner}
                innerH={c.inner}
                skin={c.skin}
                highlightW={c.hl}
                highlightH={c.hl * 2}
                highlightOffset={c.hl}
                slotW={c.hl}
                slotH={c.slotH}
              />
            </div>
          ))}
          <Sparkle left={92} bottom={132} size={5} color="#fff8b0" />
          <Sparkle left={152} bottom={120} size={4} color="#fff" />
          <Sparkle left={68} bottom={102} size={4} color="#fff8b0" />
          <Sparkle left={172} bottom={94} size={4} color="#fff" />
        </div>
      </div>

      <div
        style={{
          padding: "0 28px 42px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          position: "relative",
          zIndex: 3,
        }}
      >
        <Button
          variant="gold"
          height={56}
          caret
          blink
          onClick={onStart}
          style={{ boxShadow: "0 0 26px rgba(255,230,0,0.5), inset 0 -4px 0 rgba(0,0,0,0.2)" }}
        >
          PRESS START · CLAIM MY STACK
        </Button>
        <div style={{ textAlign: "center", fontSize: 13, color: "var(--text-4)" }}>
          Next: pick 3 rivals to race · 13+ with a parent’s OK · fake money, not investing advice
        </div>
      </div>
    </PhoneFrame>
  );
}
