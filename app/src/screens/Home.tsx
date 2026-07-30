import { PhoneFrame, Screen } from "../components/PhoneFrame";
import { TabBar, type Tab } from "../components/TabBar";
import { Avatar, Card, ROLE, type Role } from "../components/ui";
import { PLAYER, STACK } from "../data";

/* 02 · HOME — social-first.
   Total stack on top, then one thin vitals strip (the identity signals live
   here and nowhere else), then the crew feed, which is the scroll surface. */

type Post = {
  initials: string;
  role: Role;
  name: string;
  time: string;
  body: React.ReactNode;
  actions: { label: string; role: Role }[];
};

const FEED: Post[] = [
  {
    initials: "MR",
    role: "magenta",
    name: "Maya R.",
    time: "12m",
    body: (
      <>
        Bought <Strong>$18,000 NVIDIA</Strong> — her 3rd buy this week. She’s now{" "}
        <Strong color="var(--green)">+21.4%</Strong> and leading your race.
      </>
    ),
    actions: [
      { label: "COPY PLAY", role: "cyan" },
      { label: "DUEL HER", role: "magenta" },
    ],
  },
  {
    initials: "MD",
    role: "green",
    name: "Mom",
    time: "45m",
    body: (
      <>
        Joined Rally with your crew code and made her first play:{" "}
        <Strong>$50,000 S&amp;P 500 ETF</Strong>.
      </>
    ),
    actions: [
      { label: "SEND HER $1K", role: "green" },
      { label: "DUEL", role: "magenta" },
    ],
  },
  {
    initials: "DN",
    role: "cyan",
    name: "Dev N.",
    time: "1h",
    body: (
      <>
        Sold all his <Strong>Tesla</Strong> at <Strong color="var(--magenta)">−4.2%</Strong>. First
        loss he’s locked in this season.
      </>
    ),
    actions: [{ label: "SEE HIS FOLIO", role: "cyan" }],
  },
];

function Strong({ children, color = "#fff" }: { children: React.ReactNode; color?: string }) {
  return (
    <span className="num" style={{ color, fontWeight: 700 }}>
      {children}
    </span>
  );
}

/** Real data from the API, when the app is running live. */
export type HomeLive = {
  player: { name: string; initials: string };
  vitals: { level: number; rank: number; streak: number; duels: number; trophies: number };
  stack: { totalLabel: string; allTimeLabel: string; todayLabel: string; cashLabel: string };
  newPlays: number;
  posts: {
    id: number;
    name: string;
    initials: string;
    role: string;
    time: string;
    verb: string;
    amountLabel: string;
    side: string;
  }[];
};

export function Home({
  onNavigate,
  onProfile,
  live,
  onTrade,
}: {
  onNavigate?: (t: Tab) => void;
  onProfile?: () => void;
  live?: HomeLive;
  onTrade?: () => void;
}) {
  const vitals = live?.vitals ?? {
    level: PLAYER.level,
    rank: PLAYER.rank,
    streak: PLAYER.streak,
    duels: PLAYER.liveDuels,
  };

  return (
    <PhoneFrame>
      <Screen scroll>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div
            className="pixel"
            style={{ fontSize: 15, color: "var(--gold)", textShadow: "0 0 14px rgba(255,230,0,0.7)" }}
          >
            RALLY
          </div>
          <Avatar pip={live ? live.vitals.trophies : PLAYER.trophies} onClick={onProfile} />
        </div>

        {/* Stack card — pure money, no gamification chips. Tapping it opens
            FOLIO: the total is the sum of what's in there, so the card is the
            natural way in. */}
        <button
          type="button"
          className="press"
          onClick={() => onNavigate?.("folio")}
          aria-label="View my holdings"
          style={{
            borderRadius: "var(--r-card)",
            padding: 20,
            background: "var(--grad-violet-card)",
            boxShadow: "0 0 0 1.5px var(--cyan), 0 0 30px rgba(34,247,255,0.3)",
            display: "flex",
            flexDirection: "column",
            gap: 8,
            flexShrink: 0,
            border: "none",
            font: "inherit",
            color: "inherit",
            textAlign: "left",
            alignItems: "stretch",
            cursor: "pointer",
            width: "100%",
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.14em", color: "var(--cyan-soft)" }}>
            TOTAL STACK
          </div>
          <div className="num" style={{ fontSize: 44, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1 }}>
            {live ? live.stack.totalLabel : STACK.total}
          </div>
          <div style={{ display: "flex", gap: 14, alignItems: "baseline" }}>
            <div
              className="num"
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "var(--green)",
                textShadow: "0 0 12px rgba(57,255,20,0.5)",
              }}
            >
              ▲ {live ? live.stack.allTimeLabel : STACK.allTime}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Pill role="green">{live ? live.stack.todayLabel : STACK.today}</Pill>
            <Pill role="gold">Cash {live ? live.stack.cashLabel : STACK.cash}</Pill>
          </div>
        </button>

        {/* Vitals strip — the single gamification row. */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "9px 14px",
            borderRadius: 14,
            background: "var(--bg-card)",
            boxShadow: "var(--ring)",
            flexShrink: 0,
          }}
        >
          <Vital value={vitals.level} label="LVL" color="var(--green)" />
          <Divider />
          <Vital value={`#${vitals.rank}`} label="RANK" color="var(--cyan)" />
          <Divider />
          <Vital value={vitals.streak} label="STREAK" color="var(--gold)" icon="ph-fill ph-flame" />
          <Divider />
          <Vital value={vitals.duels} label="DUELS" color="var(--magenta)" icon="ph-fill ph-sword" />
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.1em", color: "var(--cyan-soft)" }}>
            YOUR CREW
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontSize: 12,
              fontWeight: 700,
              color: "var(--magenta)",
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "var(--magenta)",
                boxShadow: "0 0 8px var(--magenta)",
              }}
            />
            {live ? live.newPlays : 3} NEW PLAYS
          </div>
        </div>

        {live &&
          (live.posts.length === 0 ? (
            <Card style={{ padding: "16px 14px", flexShrink: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Nobody's played yet</div>
              <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.4 }}>
                When someone in your crew buys or sells, it lands here. Make the first move.
              </div>
            </Card>
          ) : (
            live.posts.map((post) => {
              const tint = ROLE[(post.role as Role) in ROLE ? (post.role as Role) : "cyan"];
              const sold = post.side === "sell";
              return (
                <Card key={post.id} style={{ display: "flex", gap: 12, padding: "13px 14px", flexShrink: 0 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: `${tint.base}22`,
                      boxShadow: `inset 0 0 0 1.5px ${tint.base}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      fontWeight: 700,
                      color: tint.base,
                      flexShrink: 0,
                    }}
                  >
                    {post.initials}
                  </div>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 700 }}>{post.name}</span>
                      <span className="num" style={{ fontSize: 11, color: "var(--text-3)" }}>
                        {post.time}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-1)", lineHeight: 1.4 }}>
                      {post.verb} <Strong color={sold ? "var(--magenta)" : "#fff"}>{post.amountLabel}</Strong>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        type="button"
                        onClick={onTrade}
                        style={{
                          padding: "6px 12px",
                          borderRadius: 9,
                          border: "none",
                          background: "transparent",
                          fontFamily: "inherit",
                          fontSize: 12,
                          fontWeight: 700,
                          color: "var(--cyan)",
                          boxShadow: "inset 0 0 0 1.5px rgba(34,247,255,0.5)",
                          cursor: "pointer",
                        }}
                      >
                        COPY PLAY
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })
          ))}

        {!live &&
          FEED.map((post) => (
          <Card
            key={post.name}
            style={{ display: "flex", gap: 12, padding: "13px 14px", flexShrink: 0 }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: `${ROLE[post.role].base}22`,
                boxShadow: `inset 0 0 0 1.5px ${ROLE[post.role].base}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 700,
                color: ROLE[post.role].base,
                flexShrink: 0,
              }}
            >
              {post.initials}
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>{post.name}</span>
                <span className="num" style={{ fontSize: 11, color: "var(--text-3)" }}>
                  {post.time}
                </span>
              </div>
              <div style={{ fontSize: 13, color: "var(--text-1)", lineHeight: 1.4 }}>{post.body}</div>
              <div style={{ display: "flex", gap: 8 }}>
                {post.actions.map((a) => (
                  <button
                    key={a.label}
                    type="button"
                    style={{
                      padding: "6px 12px",
                      borderRadius: 9,
                      border: "none",
                      background: "transparent",
                      fontFamily: "inherit",
                      fontSize: 12,
                      fontWeight: 700,
                      color: ROLE[a.role].base,
                      boxShadow: `inset 0 0 0 1.5px rgba(${ROLE[a.role].rgb},0.5)`,
                      cursor: "pointer",
                    }}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </Screen>
      <TabBar active="home" onNavigate={onNavigate} />
    </PhoneFrame>
  );
}

function Pill({ children, role }: { children: React.ReactNode; role: Role }) {
  const t = ROLE[role];
  return (
    <div
      className="num"
      style={{
        padding: "5px 10px",
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 700,
        background: `rgba(${t.rgb},0.12)`,
        color: t.base,
        boxShadow: `inset 0 0 0 1px rgba(${t.rgb},0.4)`,
      }}
    >
      {children}
    </div>
  );
}

function Vital({
  value,
  label,
  color,
  icon,
}: {
  value: React.ReactNode;
  label: string;
  color: string;
  icon?: string;
}) {
  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
      {icon && <i className={icon} style={{ fontSize: 15, color }} />}
      <span className="num" style={{ fontSize: 14, fontWeight: 700, color }}>
        {value}
      </span>
      <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-2)" }}>{label}</span>
    </div>
  );
}

function Divider() {
  return <div style={{ width: 1, height: 18, background: "var(--bg-hairline)" }} />;
}
