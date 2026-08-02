import { and, eq, gte } from "drizzle-orm";
import { db, schema } from "./_lib/db.js";
import { ApiError, oneOf, route, str } from "./_lib/http.js";
import { pct, signedUsd, toNum, usd } from "./_lib/money.js";
import { dayChange, getQuotes } from "./_lib/prices.js";
import { playerIdFrom } from "./_lib/session.js";

const RANGES = ["1D", "1W", "1M", "1Y"] as const;

const RANGE_MS: Record<(typeof RANGES)[number], number> = {
  "1D": 24 * 60 * 60 * 1000,
  "1W": 7 * 24 * 60 * 60 * 1000,
  "1M": 30 * 24 * 60 * 60 * 1000,
  "1Y": 365 * 24 * 60 * 60 * 1000,
};

const RANGE_LABEL: Record<(typeof RANGES)[number], string> = {
  "1D": "24-hour",
  "1W": "week's",
  "1M": "month's",
  "1Y": "year's",
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

  const change = dayChange(q);
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

  // The chart is the price series this app actually recorded — not other
  // players' fills, which is what it used to draw and which said nothing about
  // the market.
  const range = oneOf(req.query.range, RANGES, "1D");
  const since = new Date(Date.now() - RANGE_MS[range]);
  const samples = await d
    .select({ price: schema.priceHistory.price, at: schema.priceHistory.at })
    .from(schema.priceHistory)
    .where(and(eq(schema.priceHistory.symbol, symbol), gte(schema.priceHistory.at, since)))
    .orderBy(schema.priceHistory.at)
    .limit(400);

  return {
    symbol,
    name: instrument.name,
    price: q.price,
    priceLabel: `$${q.price.toFixed(2)}`,
    changeLabel: `${pct(change)} today`,
    up: change >= 0,
    asOfLabel: `As of ${asOf} · prices delayed 15 min`,
    balance,
    balanceLabel: usd(balance),
    position,
    range,
    history: samples.map((r) => toNum(r.price)),
    /* Said plainly rather than drawn as a flat line: a chart needs two points,
       and a young deployment hasn't got them for every window yet. */
    historyNote:
      samples.length >= 2
        ? undefined
        : `No ${RANGE_LABEL[range]} price history yet — the chart fills in as prices update.`,
  };
});
