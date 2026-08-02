import { eq } from "drizzle-orm";
import { db, schema } from "./_lib/db.js";
import { ApiError, oneOf, route, str } from "./_lib/http.js";
import { getQuotes, HISTORY_RANGES, priceHistory } from "./_lib/prices.js";

/** Price series for the detail chart — one call per 1D/1W/1M/1Y tab. */
export default route("GET", async (req) => {
  const symbol = str(req.query.symbol, "symbol").toUpperCase();
  const range = oneOf(req.query.range, HISTORY_RANGES, "1D");

  const d = db();
  const [instrument] = await d
    .select({ symbol: schema.instruments.symbol })
    .from(schema.instruments)
    .where(eq(schema.instruments.symbol, symbol));
  if (!instrument) throw new ApiError(404, `We don't carry ${symbol} yet.`);

  const q = (await getQuotes([symbol])).get(symbol);
  return { symbol, range, points: await priceHistory(symbol, range, q) };
});
