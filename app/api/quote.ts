import { and, eq } from "drizzle-orm";
import { db, schema } from "./_lib/db.js";
import { ApiError, oneOf, route, str } from "./_lib/http.js";
import { pct, signedUsd, toNum, usd } from "./_lib/money.js";
import {
  dayChange,
  getChartHistory,
  getQuotes,
  type ChartRange,
} from "./_lib/prices.js";
import { playerIdFrom } from "./_lib/session.js";

const RANGES = ["1D", "1W", "1M", "1Y"] as const satisfies readonly ChartRange[];

const RANGE_CHANGE_LABEL: Record<ChartRange, string> = {
  "1D": "today",
  "1W": "this week",
  "1M": "this month",
  "1Y": "this year",
};

/** The stock detail screen: price, delay stamp, and the player's own position. */
export default route("GET", async (req) => {
  const symbol = str(req.query.symbol, "symbol").toUpperCase();

  const d = db();
  const [instrument] = await d
    .select()
    .from(schema.instruments)
    .where(eq(schema.instruments.symbol, symbol));
  if (!instrument) throw new ApiError(404, `We don't carry ${symbol} yet.`);

  const q = (await getQuotes([symbol])).get(symbol);
  if (!q) throw new ApiError(503, "No price available right now. Try again in a minute.");

  const day = dayChange(q);
  const asOf = q.fetchedAt.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  });

  const playerId = playerIdFrom(req);
  let position = null;
  let balance = 0;

  if (playerId) {
    const [player] = await d
      .select({ cash: schema.players.cash })
      .from(schema.players)
      .where(eq(schema.players.id, playerId));
    balance = toNum(player?.cash);

    const [h] = await d
      .select()
      .from(schema.holdings)
      .where(and(eq(schema.holdings.playerId, playerId), eq(schema.holdings.symbol, symbol)));

    if (h) {
      const shares = toNum(h.shares);
      const value = shares * q.price;
      const cost = toNum(h.costBasis);
      const gain = value - cost;
      position = {
        shares,
        sharesLabel: `${shares.toLocaleString("en-US", { maximumFractionDigits: 2 })} shares`,
        valueLabel: usd(value),
        gainLabel: `${signedUsd(gain)} (${cost > 0 ? pct(gain / cost) : "+0.0%"})`,
        up: gain >= 0,
      };
    }
  }

  // Real market candles for the selected window (Yahoo), not the sparse
  // samples this app happens to have recorded on its own.
  const range = oneOf(req.query.range, RANGES, "1D");
  const { prices: history, fromMarket } = await getChartHistory(symbol, range, q);

  const start = history[0];
  const end = history[history.length - 1];
  const periodChange =
    history.length >= 2 && start! > 0 ? (end! - start!) / start! : day;
  const up = periodChange >= 0;

  return {
    symbol,
    name: instrument.name,
    price: q.price,
    priceLabel: `$${q.price.toFixed(2)}`,
    changeLabel: `${pct(periodChange)} ${RANGE_CHANGE_LABEL[range]}`,
    up,
    asOfLabel: `As of ${asOf} · prices delayed 15 min`,
    balance,
    balanceLabel: usd(balance),
    position,
    range,
    history,
    historyNote:
      history.length >= 2
        ? undefined
        : fromMarket
          ? undefined
          : `Couldn't load ${RANGE_CHANGE_LABEL[range]} chart yet — try again in a moment.`,
  };
});
