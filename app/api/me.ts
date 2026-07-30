import { eq } from "drizzle-orm";
import { db, schema } from "./_lib/db";
import { route } from "./_lib/http";
import { playerIdFrom } from "./_lib/session";
import { usingRealPrices } from "./_lib/prices";

/** Who am I? Returns `player: null` rather than 401 so the app can boot to login. */
export default route("GET", async (req) => {
  const id = playerIdFrom(req);
  if (!id) return { player: null, delayedPrices: usingRealPrices() };

  const [player] = await db()
    .select({
      id: schema.players.id,
      handle: schema.players.handle,
      name: schema.players.name,
      initials: schema.players.initials,
    })
    .from(schema.players)
    .where(eq(schema.players.id, id));

  return { player: player ?? null, delayedPrices: usingRealPrices() };
});
