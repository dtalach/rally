import { desc, eq, ne, sql } from "drizzle-orm";
import { db, schema } from "./_lib/db.js";
import { requirePlayer, route } from "./_lib/http.js";
import { toNum, usd } from "./_lib/money.js";

/**
 * The crew feed on HOME — what everyone else just did, built from real orders.
 * This is what makes the app worth opening: you see that Maya bought, and you
 * want to answer it. Your own trades are excluded; the Activity screen is the
 * one that's about you.
 */
const ago = (d: Date) => {
  const mins = Math.max(0, Math.round((Date.now() - d.getTime()) / 60000));
  if (mins < 60) return `${mins}m`;
  if (mins < 60 * 24) return `${Math.round(mins / 60)}h`;
  return `${Math.round(mins / 1440)}d`;
};

export default route("GET", async (req) => {
  const playerId = requirePlayer(req);

  const rows = await db()
    .select({
      id: schema.orders.id,
      side: schema.orders.side,
      amount: schema.orders.amount,
      filledAt: schema.orders.filledAt,
      name: schema.players.name,
      initials: schema.players.initials,
      instrument: schema.instruments.name,
      role: schema.instruments.role,
    })
    .from(schema.orders)
    .innerJoin(schema.players, eq(schema.players.id, schema.orders.playerId))
    .innerJoin(schema.instruments, eq(schema.instruments.symbol, schema.orders.symbol))
    .where(ne(schema.orders.playerId, playerId))
    .orderBy(desc(schema.orders.filledAt))
    .limit(12);

  const [{ n } = { n: 0 }] = await db()
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.orders)
    .where(
      sql`${schema.orders.playerId} <> ${playerId} and ${schema.orders.filledAt} > now() - interval '24 hours'`
    );

  return {
    newPlays: n,
    posts: rows.map((r) => ({
      id: r.id,
      name: r.name,
      initials: r.initials,
      role: r.role,
      time: ago(r.filledAt),
      verb: r.side === "buy" ? "Bought" : "Sold",
      amountLabel: `${usd(toNum(r.amount))} ${r.instrument}`,
      side: r.side,
    })),
  };
});
