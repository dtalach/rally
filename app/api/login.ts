import { eq } from "drizzle-orm";
import { db, schema } from "./_lib/db.js";
import { ApiError, route, str } from "./_lib/http.js";
import { issue, verifySecret } from "./_lib/session.js";

export default route("POST", async (req, res) => {
  // Not the strict validators signup uses: a wrong address should fail the
  // same way a wrong password does, not be rejected on shape.
  const email = str(req.body?.email, "email").trim().toLowerCase();
  const password = str(req.body?.password, "password");

  const [player] = await db().select().from(schema.players).where(eq(schema.players.email, email));

  // One message for both cases, so this can't be used to find out who has an
  // account here.
  if (!player || !verifySecret(password, player.passwordHash)) {
    throw new ApiError(401, "That email and password don't match.");
  }

  issue(res, player.id);
  return {
    player: {
      id: player.id,
      email: player.email,
      name: player.name,
      initials: player.initials,
    },
  };
});
