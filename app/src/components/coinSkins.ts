export type CoinSkin = {
  rim: string;
  fill: string;
  highlight: string;
  slot: string;
};

/** Bright crown gold, mid gold, and the dull bronze half-buried at the base. */
export const COIN_BRIGHT: CoinSkin = {
  rim: "#7a5200",
  fill: "#ffe600",
  highlight: "#fff8b0",
  slot: "#c98b00",
};

export const COIN_MID: CoinSkin = {
  rim: "#6b4700",
  fill: "#e6cf00",
  highlight: "#fff0a0",
  slot: "#a87400",
};

export const COIN_DULL: CoinSkin = {
  rim: "#5c3d00",
  fill: "#cfa900",
  highlight: "#ffe27a",
  slot: "#8a5f00",
};
