import { db, schema } from "./_lib/db.js";
import { oneOf, route } from "./_lib/http.js";
import { pct } from "./_lib/money.js";
import { dayChange, getQuotes } from "./_lib/prices.js";

/**
 * The discover surface: every tradable instrument ranked by the chosen board.
 * `most traded` counts real orders, so it reflects what players actually do.
 */
export default route("GET", async (req) => {
  const board = oneOf(req.query.board, ["gainers", "losers", "traded"] as const, "gainers");
  const search = typeof req.query.q === "string" ? req.query.q.trim().toLowerCase() : "";

  const d = db();
  const instruments = await d.select().from(schema.instruments);
  const quotes = await getQuotes(instruments.map((i) => i.symbol));

  const counts = new Map<string, number>();
  if (board === "traded") {
    const rows = await d
      .select({ symbol: schema.orders.symbol, n: schema.orders.id })
      .from(schema.orders);
    for (const r of rows) counts.set(r.symbol, (counts.get(r.symbol) ?? 0) + 1);
  }

  let rows = instruments
    .map((i) => {
      const q = quotes.get(i.symbol);
      const change = q ? dayChange(q) : 0;
      return {
        symbol: i.symbol,
        name: i.name,
        badge: i.badge,
        role: i.role,
        note: i.blurb,
        sector: i.sector,
        kind: i.kind,
        price: q?.price ?? 0,
        priceLabel: q ? `$${q.price.toFixed(2)}` : "—",
        change,
        changeLabel: pct(change),
        up: change >= 0,
        trades: counts.get(i.symbol) ?? 0,
      };
    })
    .filter((r) => r.price > 0);

  if (search) {
    rows = rows.filter(
      (r) => r.symbol.toLowerCase().includes(search) || r.name.toLowerCase().includes(search)
    );
  }

  if (board === "gainers") rows.sort((a, b) => b.change - a.change);
  else if (board === "losers") rows.sort((a, b) => a.change - b.change);
  else rows.sort((a, b) => b.trades - a.trades || b.change - a.change);

  return { board, rows: rows.slice(0, search ? 20 : 3), all: rows.length };
});
