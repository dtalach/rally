import { useState } from "react";
import { PhoneFrame, Screen } from "../components/PhoneFrame";
import { TabBar, type Tab } from "../components/TabBar";
import { Avatar, Button, Segmented } from "../components/ui";
import { PLAYER, SEASON } from "../data";

/* 06 · LEADERBOARDS — HIGH SCORES.
   Winning is highest % gain for the month, quarter or year; the stack itself
   never resets, so the board is pure return. Podium takes gold/silver/bronze
   from the palette (cyan for 2nd, magenta for 3rd) rather than metallic greys. */

const RANKS = [
  { rank: 4, name: "Jules P.", move: 3, up: true, pct: "+29%" },
  { rank: 5, name: "Dev N.", move: 1, up: false, pct: "+27%" },
  { rank: 6, name: "Theo B.", move: 6, up: true, pct: "+24%" },
];

export type Ranked = { id: number; name: string; initials: string; you: boolean; rank: number; returnLabel: string };

export type LeaderboardLive = {
  subtitle: string;
  /** Real earned count, so the pip here matches the one on every other tab. */
  trophies: number;
  podium: Ranked[];
  rest: Ranked[];
  you: (Ranked & { gapLabel: string }) | null;
  period: "month" | "quarter" | "year";
  onPeriod: (p: "month" | "quarter" | "year") => void;
  /** Back to the race chart — the other half of the same MY CREW / LEAGUE switch. */
  onScope?: (scope: "crew" | "league") => void;
};

/** 2nd, 1st, 3rd — the podium reads centre-tallest, so first place sits between. */
const PODIUM_ORDER = [1, 0, 2];
const PODIUM_SKIN = [
  { accent: "#ffe600", height: 66, gradient: "linear-gradient(180deg,#ffe600,#c98b00)", color: "#3a2b00", font: 11 },
  { accent: "#9df4ff", height: 44, gradient: "linear-gradient(180deg,#22f7ff,#00aec4)", color: "#fff", font: 10 },
  { accent: "#ff8ae0", height: 32, gradient: "linear-gradient(180deg,#ff2bd6,#9c0f84)", color: "#fff", font: 10 },
];

export function Leaderboards({
  onNavigate,
  onProfile,
  onTrade,
  live,
}: {
  onNavigate?: (t: Tab) => void;
  onProfile?: () => void;
  onTrade?: () => void;
  live?: LeaderboardLive;
}) {
  const [period, setPeriod] = useState<"month" | "quarter" | "year">(live?.period ?? "month");

  return (
    <PhoneFrame glow="rgba(255,230,0,0.12)">
      <Screen scroll padding="14px 20px 0">
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 6, position: "relative" }}>
          <div style={{ position: "absolute", right: 0, top: 0 }}>
            <Avatar pip={live ? live.trophies : PLAYER.trophies} onClick={onProfile} />
          </div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: "0.16em",
              color: "var(--gold)",
              textShadow: "0 0 18px rgba(255,230,0,0.6)",
            }}
          >
            HIGH SCORES
          </div>
          <div style={{ fontSize: 13, color: "var(--text-2)" }}>
            {live
              ? live.subtitle
              : `Highest % gain · ${SEASON.month[0]}${SEASON.month
                  .slice(1)
                  .toLowerCase()} ends in ${SEASON.endsIn} · ${SEASON.players} players`}
          </div>
        </div>

        {live?.onScope && (
          <Segmented
            options={[
              { id: "crew", label: "MY CREW" },
              { id: "league", label: "LEAGUE" },
            ]}
            value="league"
            onChange={live.onScope}
            activeSkin="magenta"
            style={{ flexShrink: 0 }}
          />
        )}

        <Segmented
          options={[
            { id: "month", label: "MONTH" },
            { id: "quarter", label: "QUARTER" },
            { id: "year", label: "YEAR" },
          ]}
          value={period}
          onChange={(p) => {
            setPeriod(p);
            live?.onPeriod(p);
          }}
          activeSkin="cyan"
          fontSize={13}
          style={{ flexShrink: 0 }}
        />

        {/* podium */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 10,
            padding: "16px 12px 0",
            borderRadius: "var(--r-card)",
            background: "var(--grad-violet-card-170)",
            boxShadow: "var(--ring)",
            flexShrink: 0,
          }}
        >
          {live
            ? PODIUM_ORDER.filter((i) => live.podium[i]).map((i) => {
                const p = live.podium[i];
                const skin = PODIUM_SKIN[i];
                return (
                  <PodiumSlot
                    key={p.id}
                    place={p.rank}
                    initials={p.initials}
                    name={p.name}
                    pct={p.returnLabel}
                    accent={skin.accent}
                    blockHeight={skin.height}
                    blockGradient={skin.gradient}
                    blockColor={skin.color}
                    blockFont={skin.font}
                    crown={i === 0}
                  />
                );
              })
            : (
              <>
                <PodiumSlot place={2} initials="KL" name="Kai L." pct="+38%" accent="#9df4ff" blockHeight={44} blockGradient="linear-gradient(180deg,#22f7ff,#00aec4)" blockColor="#fff" blockFont={10} />
                <PodiumSlot place={1} initials="AZ" name="Ava Z." pct="+52%" accent="#ffe600" blockHeight={66} blockGradient="linear-gradient(180deg,#ffe600,#c98b00)" blockColor="#3a2b00" blockFont={11} crown />
                <PodiumSlot place={3} initials="MR" name="Maya R." pct="+31%" accent="#ff8ae0" blockHeight={32} blockGradient="linear-gradient(180deg,#ff2bd6,#9c0f84)" blockColor="#fff" blockFont={10} />
              </>
            )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", flexShrink: 0 }}>
          {live
            ? live.rest.map((r, i) => (
                <div
                  key={r.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "11px 4px",
                    borderBottom: i < live.rest.length - 1 ? "1px solid rgba(34,247,255,0.15)" : undefined,
                  }}
                >
                  <div className="num" style={{ width: 30, fontSize: 14, fontWeight: 700, color: "var(--text-2)" }}>
                    {r.rank}
                  </div>
                  <div style={{ flex: 1, fontSize: 15, fontWeight: r.you ? 800 : 600 }}>
                    {r.name}
                    {r.you && <span style={{ fontSize: 11, color: "var(--cyan)" }}> ◄ YOU</span>}
                  </div>
                  <div
                    className="num"
                    style={{
                      fontSize: 15,
                      fontWeight: 800,
                      color: r.returnLabel.startsWith("−") ? "var(--magenta)" : "var(--green)",
                      minWidth: 56,
                      textAlign: "right",
                    }}
                  >
                    {r.returnLabel}
                  </div>
                </div>
              ))
            : RANKS.map((r, i) => (
                <div
                  key={r.rank}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "11px 4px",
                    borderBottom: i < RANKS.length - 1 ? "1px solid rgba(34,247,255,0.15)" : undefined,
                  }}
                >
                  <div className="num" style={{ width: 30, fontSize: 14, fontWeight: 700, color: "var(--text-2)" }}>
                    {r.rank}
                  </div>
                  <div style={{ flex: 1, fontSize: 15, fontWeight: 600 }}>{r.name}</div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: r.up ? "var(--green)" : "var(--magenta)",
                      display: "flex",
                      gap: 2,
                      alignItems: "center",
                    }}
                  >
                    <i className={`ph-fill ph-caret-${r.up ? "up" : "down"}`} />
                    {r.move}
                  </div>
                  <div
                    className="num"
                    style={{ fontSize: 15, fontWeight: 800, color: "var(--green)", minWidth: 56, textAlign: "right" }}
                  >
                    {r.pct}
                  </div>
                </div>
              ))}
        </div>

        {/* pinned "you" row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "13px 14px",
            borderRadius: "var(--r-tile)",
            background: "var(--grad-cyan-card)",
            boxShadow: "0 0 0 1.5px var(--cyan), 0 0 22px rgba(34,247,255,0.35)",
            flexShrink: 0,
          }}
        >
          <div className="num" style={{ fontSize: 14, fontWeight: 700, color: "var(--cyan)" }}>
            {live?.you?.rank ?? PLAYER.rank}
          </div>
          <Avatar size={32} ring={false} initials={live?.you?.initials ?? PLAYER.initials} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>
              YOU{" "}
              <span style={{ fontSize: 11, color: "var(--cyan)" }}>
                · {live?.you?.name ?? PLAYER.name}
              </span>
            </div>
            <div style={{ fontSize: 11, color: "var(--text-2)" }}>
              {live?.you?.gapLabel ?? "Top 3% · beat +24% to crack the board"}
            </div>
          </div>
          <div
            className="num"
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "var(--cyan)",
              textShadow: "0 0 12px rgba(34,247,255,0.5)",
            }}
          >
            {live?.you?.returnLabel ?? "+14.4%"}
          </div>
        </div>

        <Button
          variant="green"
          height={52}
          caret
          blink
          onClick={onTrade}
          style={{ flexShrink: 0, boxShadow: "0 0 22px rgba(57,255,20,0.45), inset 0 -4px 0 rgba(0,0,0,0.2)" }}
        >
          CONTINUE? TRADE NOW
        </Button>
      </Screen>
      <TabBar active="race" onNavigate={onNavigate} />
    </PhoneFrame>
  );
}

function PodiumSlot({
  place,
  initials,
  name,
  pct,
  accent,
  blockHeight,
  blockGradient,
  blockColor,
  blockFont,
  crown,
}: {
  place: number;
  initials: string;
  name: string;
  pct: string;
  accent: string;
  blockHeight: number;
  blockGradient: string;
  blockColor: string;
  blockFont: number;
  crown?: boolean;
}) {
  const size = crown ? 54 : 44;
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
      {crown && (
        <i
          className="ph-fill ph-crown"
          style={{ color: "var(--gold)", fontSize: 28, filter: "drop-shadow(0 0 12px rgba(255,230,0,0.8))" }}
        />
      )}
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: "var(--bg-card)",
          boxShadow: crown
            ? `0 0 0 2.5px ${accent}, 0 0 20px rgba(255,230,0,0.5)`
            : `0 0 0 2px ${accent}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: crown ? 16 : 14,
          fontWeight: crown ? 700 : 800,
          color: accent,
        }}
      >
        {initials}
      </div>
      <div style={{ fontSize: 12, fontWeight: crown ? 800 : 700, color: crown ? "#fff" : accent }}>{name}</div>
      <div
        className="num"
        style={{
          fontSize: crown ? 16 : 14,
          fontWeight: 700,
          color: "var(--green)",
          textShadow: crown ? "0 0 10px rgba(57,255,20,0.6)" : undefined,
        }}
      >
        {pct}
      </div>
      <div
        className="pixel"
        style={{
          width: "100%",
          height: blockHeight,
          borderRadius: "8px 8px 0 0",
          background: blockGradient,
          boxShadow: crown ? "0 0 22px rgba(255,230,0,0.4)" : undefined,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          paddingTop: 6,
          fontSize: blockFont,
          color: blockColor,
        }}
      >
        {place}
      </div>
    </div>
  );
}
