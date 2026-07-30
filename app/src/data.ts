/* ---------------------------------------------------------------------------
   Mock data, lifted from the design file.

   Note on the numbers: the frames are deliberately different *moments in one
   timeline*, so figures don't reconcile across every screen (the stock-detail
   balance of $975,400 is after the $25K NVIDIA order; the empty state is day
   one at $1,000,000). Each screen keeps the value the design gave it, and the
   shared constants below are the HOME/FOLIO moment.
--------------------------------------------------------------------------- */

export const PLAYER = {
  name: "Jordan",
  initials: "JD",
  level: 7,
  levelTitle: "CONTENDER",
  xpPct: 73,
  rank: 412,
  streak: 9,
  liveDuels: 2,
  trophies: 11,
  trophiesTotal: 34,
  duelRecord: "7–2",
  crewCode: "RALLY-JD7",
  crewSize: 4,
};

/** HOME / FOLIO moment. invested + cash === totalStack. */
export const STACK = {
  total: "$1,140,230",
  allTime: "+$140,230 all-time (+14.0%)",
  today: "Today +$3,420",
  cash: "$527,830",
  invested: "$612,400",
  seasonReturn: "+14.4%",
};

export const SEASON = {
  month: "FEBRUARY",
  endsIn: "19 days",
  players: "18,402",
};

export type Holding = {
  ticker: string;
  name: string;
  role: string;
  shares: string;
  weight: string;
  value: string;
  change: string;
  up: boolean;
};

export const HOLDINGS: Holding[] = [
  { ticker: "NV", name: "NVIDIA", role: "cyan", shares: "145 shares", weight: "34%", value: "$208,200", change: "+2.4%", up: true },
  { ticker: "SP", name: "S&P 500 ETF", role: "green", shares: "310 shares", weight: "24%", value: "$146,900", change: "+0.6%", up: true },
  { ticker: "AP", name: "Apple", role: "gold", shares: "480 shares", weight: "17%", value: "$104,100", change: "+1.1%", up: true },
  { ticker: "RB", name: "Roblox", role: "magenta", shares: "920 shares", weight: "13%", value: "$79,600", change: "−0.9%", up: false },
  { ticker: "TS", name: "Tesla", role: "ice", shares: "40 shares", weight: "7%", value: "$44,700", change: "−1.8%", up: false },
  { ticker: "NK", name: "Nike", role: "#c8fbff", shares: "380 shares", weight: "5%", value: "$28,900", change: "+0.3%", up: true },
];

/** Allocation bar under the invested/cash summary. */
export const ALLOCATION = [
  { pct: 34, color: "#22f7ff" },
  { pct: 24, color: "#39ff14" },
  { pct: 17, color: "#ffe600" },
  { pct: 13, color: "#ff2bd6" },
  { pct: 12, color: "#087f92" },
];

export const RACE_STANDINGS = [
  { tag: "P1", role: "green", name: "Maya R.", stack: "$1.21M", pct: "+21.4%", you: false },
  { tag: "P2", role: "cyan", name: PLAYER.name, stack: "$1.14M", pct: "+14.4%", you: true },
  { tag: "P3", role: "magenta", name: "Dev N.", stack: "$1.09M", pct: "+8.8%", you: false },
];

/** Race chart — P1 green (Maya), P2 cyan (you), P3 magenta (Dev). */
export const RACE_LINES = {
  p1: "0,226 28,212 56,200 84,182 112,186 140,154 168,142 196,122 224,98 252,82 280,56 310,34",
  p2: "0,226 28,220 56,206 84,212 112,194 140,180 168,172 196,154 224,146 252,122 280,110 310,86",
  p3: "0,226 28,222 56,216 84,204 112,210 140,196 168,202 196,186 224,178 252,174 280,156 310,146",
};

export const NVDA = {
  symbol: "NVDA",
  name: "NVIDIA",
  price: "$172.40",
  change: "+2.4% today",
  asOf: "As of 9:26 AM · prices delayed 15 min",
  shares: "58 shares",
  gain: "+$840 (9.2%)",
  balance: "$975,400",
  orderAmount: "$25,000",
  orderShares: "145 shares",
  line: "0,110 28,104 56,108 84,92 112,96 140,78 168,84 196,64 224,70 252,50 280,42 310,30 340,22",
};

export const DUEL = {
  rival: "Dev N.",
  rivalShort: "DEV",
  rivalInitials: "DN",
  stake: "$25,000",
  pot: "$50,000",
  duration: "30-day duel",
  left: "6d left",
  you: "+3.4%",
  them: "+4.3%",
  youBar: 44,
  themBar: 56,
  youLine: "0,92 28,86 56,88 84,72 112,76 140,58 168,62 196,48 224,52 252,38 280,30 310,22 340,18",
  themLine: "0,92 28,90 56,80 84,84 112,66 140,60 168,50 196,54 224,40 252,34 280,26 310,18 340,10",
};
