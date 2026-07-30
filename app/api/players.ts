import { db, schema } from "./_lib/db";
import { route } from "./_lib/http";

/** The login picker. Names and initials only — no PIN material leaves the server. */
export default route("GET", async () => {
  const rows = await db()
    .select({
      id: schema.players.id,
      handle: schema.players.handle,
      name: schema.players.name,
      initials: schema.players.initials,
    })
    .from(schema.players)
    .orderBy(schema.players.id);

  return { players: rows };
});
