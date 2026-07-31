import { db, schema } from "./_lib/db.js";
import { ApiError, route } from "./_lib/http.js";
import { cleanEmail, cleanName, cleanPassword, initialsFor } from "./_lib/accounts.js";
import { STARTING_STACK } from "./_lib/game.js";
import { hashSecret, issue } from "./_lib/session.js";
import { recordSnapshot } from "./_lib/valuation.js";

/**
 * Create an account.
 *
 * The coin drop the design opens on: every new player starts with the same
 * million, and the race is on what they do with it. A snapshot is written at
 * the moment of signup so the period baseline is a real row rather than an
 * assumption — until the first trade, this month's return is a true 0%.
 */
export default route("POST", async (req, res) => {
  const email = cleanEmail(req.body?.email);
  const password = cleanPassword(req.body?.password);
  const name = cleanName(req.body?.name);

  let player;
  try {
    [player] = await db()
      .insert(schema.players)
      .values({
        email,
        name,
        initials: initialsFor(name),
        passwordHash: hashSecret(password),
        cash: String(STARTING_STACK),
      })
      .returning();
  } catch (err) {
    // 23505: unique violation on the email. Saying so is unavoidable — you
    // can't be told an account exists any other way when you're making one.
    const code = (err as { code?: string; cause?: { code?: string } })?.code ??
      (err as { cause?: { code?: string } })?.cause?.code;
    if (code === "23505") {
      throw new ApiError(409, "That email already has an account. Try signing in.");
    }
    throw err;
  }

  await recordSnapshot(player.id, STARTING_STACK);

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
