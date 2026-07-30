import type { ReactNode } from "react";
import type { Tab } from "../components/TabBar";

import { PressStart } from "./PressStart";
import { Home } from "./Home";
import { Portfolio } from "./Portfolio";
import { Discover } from "./Discover";
import { Race } from "./Race";
import { Leaderboards } from "./Leaderboards";
import { VsDuel } from "./VsDuel";
import { TrophyRoom } from "./TrophyRoom";
import { BuySell } from "./BuySell";
import { OrderTicket } from "./OrderTicket";
import { PickRivals } from "./PickRivals";
import { CreateDuel } from "./CreateDuel";
import { Defeat, Victory } from "./Results";
import { MarketClosed } from "./MarketClosed";
import { Activity } from "./Activity";
import { ProfilePullUp } from "./ProfilePullUp";
import { EmptyPortfolio } from "./EmptyPortfolio";
import { NotificationSettings, PushNotifications } from "./Notifications";

export type ScreenId =
  | "press-start"
  | "home"
  | "portfolio"
  | "discover"
  | "race"
  | "leaderboards"
  | "duel"
  | "trophy-room"
  | "buy-sell"
  | "order-ticket"
  | "pick-rivals"
  | "create-duel"
  | "victory"
  | "defeat"
  | "market-closed"
  | "activity"
  | "profile"
  | "empty-portfolio"
  | "push"
  | "notification-settings";

/** Everything a screen may need to move the user somewhere else. */
export type Nav = {
  go: (id: ScreenId) => void;
  tab: (t: Tab) => void;
};

export type ScreenDef = {
  id: ScreenId;
  /** "01", "02"… — the design's own frame numbering. */
  no: string;
  title: string;
  render: (nav: Nav) => ReactNode;
};

export const SCREENS: ScreenDef[] = [
  {
    id: "press-start",
    no: "01",
    title: "PRESS START · COIN DROP",
    render: (nav) => <PressStart onStart={() => nav.go("pick-rivals")} />,
  },
  {
    id: "home",
    no: "02",
    title: "HOME",
    render: (nav) => <Home onNavigate={nav.tab} onProfile={() => nav.go("profile")} />,
  },
  {
    id: "portfolio",
    no: "03",
    title: "PORTFOLIO",
    render: (nav) => (
      <Portfolio
        onNavigate={nav.tab}
        onProfile={() => nav.go("profile")}
        onOpenHolding={() => nav.go("buy-sell")}
      />
    ),
  },
  {
    id: "discover",
    no: "04",
    title: "TRADE · DISCOVER",
    render: (nav) => (
      <Discover
        onNavigate={nav.tab}
        onProfile={() => nav.go("profile")}
        onOpenStock={() => nav.go("buy-sell")}
      />
    ),
  },
  { id: "race", no: "05", title: "RACE", render: (nav) => <Race onNavigate={nav.tab} /> },
  {
    id: "leaderboards",
    no: "06",
    title: "LEADERBOARDS",
    render: (nav) => (
      <Leaderboards onNavigate={nav.tab} onProfile={() => nav.go("profile")} onTrade={() => nav.go("discover")} />
    ),
  },
  {
    id: "duel",
    no: "07",
    title: "VS DUEL",
    render: (nav) => <VsDuel onNavigate={nav.tab} onTrade={() => nav.go("discover")} />,
  },
  {
    id: "trophy-room",
    no: "08",
    title: "TROPHY ROOM",
    render: (nav) => <TrophyRoom onNavigate={nav.tab} onBack={() => nav.go("home")} />,
  },
  {
    id: "buy-sell",
    no: "09",
    title: "TRADE · BUY/SELL",
    render: (nav) => (
      <BuySell onNavigate={nav.tab} onBack={() => nav.go("discover")} onReview={() => nav.go("order-ticket")} />
    ),
  },
  {
    id: "order-ticket",
    no: "10",
    title: "ORDER TICKET",
    render: (nav) => (
      <OrderTicket onConfirm={() => nav.go("portfolio")} onDismiss={() => nav.go("buy-sell")} />
    ),
  },
  {
    id: "pick-rivals",
    no: "11",
    title: "PICK YOUR RIVALS",
    render: (nav) => <PickRivals onStart={() => nav.go("home")} />,
  },
  {
    id: "create-duel",
    no: "12",
    title: "CREATE A DUEL",
    render: (nav) => <CreateDuel onNavigate={nav.tab} onSend={() => nav.go("duel")} />,
  },
  {
    id: "victory",
    no: "13",
    title: "DUEL VICTORY",
    render: (nav) => <Victory onRematch={() => nav.go("create-duel")} onBack={() => nav.go("duel")} />,
  },
  {
    id: "defeat",
    no: "14",
    title: "DEFEAT · COMEBACK",
    render: (nav) => (
      <Defeat onRematch={() => nav.go("create-duel")} onSeeTrades={() => nav.go("activity")} />
    ),
  },
  {
    id: "market-closed",
    no: "15",
    title: "MARKET CLOSED",
    render: (nav) => <MarketClosed onNavigate={nav.tab} />,
  },
  {
    id: "activity",
    no: "16",
    title: "ACTIVITY",
    render: (nav) => <Activity onNavigate={nav.tab} onBack={() => nav.go("home")} />,
  },
  {
    id: "profile",
    no: "17",
    title: "PROFILE PULL-UP",
    render: (nav) => <ProfilePullUp onTrophyRoom={() => nav.go("trophy-room")} />,
  },
  {
    id: "empty-portfolio",
    no: "18",
    title: "EMPTY PORTFOLIO",
    render: (nav) => <EmptyPortfolio onNavigate={nav.tab} onDiscover={() => nav.go("discover")} />,
  },
  { id: "push", no: "19", title: "PUSH NOTIFICATIONS", render: () => <PushNotifications /> },
  {
    id: "notification-settings",
    no: "20",
    title: "NOTIFICATION SETTINGS",
    render: (nav) => <NotificationSettings onBack={() => nav.go("profile")} />,
  },
];

/** Where each tab-bar slot lands. */
export const TAB_ROOT: Record<Tab, ScreenId> = {
  home: "home",
  folio: "portfolio",
  trade: "discover",
  race: "race",
  duels: "duel",
};

export const SCREEN_BY_ID = Object.fromEntries(SCREENS.map((s) => [s.id, s])) as Record<
  ScreenId,
  ScreenDef
>;
