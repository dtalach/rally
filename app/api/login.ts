import { eq } from "drizzle-orm";
import { db, schema } from "./_lib/db";
import { ApiError, route, str } from "./_lib/http";
import { issue, verifyPin } from "./_lib/session";

export default route("POST", async (req, res) => {
  const handle = str(req.body?.handle, "handle").toLowerCase();
  const pin = str(req.body?.pin, "pin");

  const [player] = await db()
    .select()
    .from(schema.players)
    .where(eq(schema.players.handle, handle));

  // Same message either way, so the response can't be used to enumerate players.
  if (!player || !verifyPin(pin, player.pinHash)) {
    throw new ApiError(401, "That PIN doesn't match.");
  }

  issue(res, player.id);
  return {
    player: {
      id: player.id,
      handle: player.handle,
      name: player.name,
      initials: player.initials,
    },
  };
});
