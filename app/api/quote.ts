import { and, eq } from "drizzle-orm";
import { db, schema } from "./_lib/db.js";
import { ApiError, route, str } from "./_lib/http.js";
import { pct, signedUsd, toNum, usd } from "./_lib/money.js";
import { dayChange, getQuotes, priceHistory } from "./_lib/prices.js";
import { playerIdFrom } from "./_lib/session.js";

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
    // The intraday series; the /history endpoint serves the other ranges.
    history: await priceHistory(symbol, "1D", q),
  };
});
