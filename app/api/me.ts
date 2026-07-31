import { eq } from "drizzle-orm";
import { db, schema } from "./_lib/db.js";
import { route } from "./_lib/http.js";
import { playerIdFrom } from "./_lib/session.js";
import { usingRealPrices } from "./_lib/prices.js";

/** Who am I? Returns `player: null` rather than 401 so the app can boot to login. */
export default route("GET", async (req) => {
  const id = playerIdFrom(req);
  if (!id) return { player: null, realPrices: usingRealPrices() };

  const [player] = await db()
    .select({
      id: schema.players.id,
      email: schema.players.email,
      name: schema.players.name,
      initials: schema.players.initials,
    })
    .from(schema.players)
    .where(eq(schema.players.id, id));

  return { player: player ?? null, realPrices: usingRealPrices() };
});
