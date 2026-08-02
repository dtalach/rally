import { ApiError, route, str } from "./_lib/http.js";
import { MigrationError, applyMigrations, message, sqlState } from "./_lib/migrate.js";
import { seed } from "./_lib/seed.js";

/**
 * One-shot database setup for a fresh deployment: create the tables, then load
 * the tradable universe. It creates no players — accounts are made from the
 * app's signup screen.
 *
 * It runs *inside* the deployment, which already holds DATABASE_URL, so nobody
 * has to hand a database credential around to get started. Guarded by
 * SETUP_TOKEN — if that variable isn't set, the endpoint refuses to run at all,
 * so a deployment can't be seeded by a stranger who guesses the URL.
 *
 *   curl -X POST https://<your-app>/api/setup -H 'content-type: application/json' \
 *        -d '{"token":"<SETUP_TOKEN>"}'
 */

export default route("POST", async (req) => {
  const expected = process.env.SETUP_TOKEN;
  if (!expected) {
    throw new ApiError(403, "Setup is disabled. Set SETUP_TOKEN to enable it.");
  }

  const token = str(req.body?.token, "token");
  if (token !== expected) throw new ApiError(403, "Bad setup token.");

  const log: string[] = [];

  let created: number;
  let skipped: number;
  try {
    // The caller proved they hold SETUP_TOKEN, so they get the real reason a
    // statement failed rather than a generic 500.
    ({ created, skipped } = await applyMigrations());
  } catch (err) {
    if (err instanceof MigrationError) throw new ApiError(500, err.message);
    throw err;
  }
  log.push(`schema: ${created} applied, ${skipped} already present`);

  // Loading instruments needs the price feed, which is a network call to
  // someone else's service. If that's what broke, the schema is still done —
  // say so, so the fix is "try again" rather than "start over".
  let loaded;
  try {
    loaded = await seed((m) => log.push(m));
  } catch (err) {
    const code = sqlState(err);
    throw new ApiError(
      502,
      code
        ? `Schema reported ${created} applied / ${skipped} present, but writing the instruments ` +
            `failed (${code}): ${message(err)}. The tables aren't the shape this build expects.`
        : `Schema is up to date, but loading the instruments failed: ${message(err)}. ` +
            `Check FINNHUB_API_KEY, or unset it to run on the simulated feed, then run setup again.`
    );
  }

  return {
    ok: true,
    log,
    ...loaded,
    next: "Open the app and create your account.",
  };
});
