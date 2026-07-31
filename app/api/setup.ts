import { sql } from "drizzle-orm";
import { db } from "./_lib/db.js";
import { ApiError, route, str } from "./_lib/http.js";
import { MIGRATIONS } from "./_lib/migrations.js";
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

/** Postgres codes for "this object already exists" — re-running is fine. */
const ALREADY_EXISTS = new Set(["42P07", "42710", "42P16", "23505"]);

/** Drizzle wraps driver errors, so the SQLSTATE code lives on `cause`. */
function sqlState(err: unknown): string {
  const e = err as { code?: string; cause?: { code?: string } };
  return e?.code ?? e?.cause?.code ?? "";
}

/** First line, capped — drizzle appends the whole query and every parameter. */
function message(err: unknown) {
  const raw = err instanceof Error ? err.message : String(err);
  const first = raw.split("\n")[0].trim();
  return first.length > 300 ? `${first.slice(0, 300)}…` : first;
}

/** Enough of the statement to recognise it, on one line. */
const summarise = (statement: string) => statement.replace(/\s+/g, " ").slice(0, 120);

export default route("POST", async (req) => {
  const expected = process.env.SETUP_TOKEN;
  if (!expected) {
    throw new ApiError(403, "Setup is disabled. Set SETUP_TOKEN to enable it.");
  }

  const token = str(req.body?.token, "token");
  if (token !== expected) throw new ApiError(403, "Bad setup token.");

  const d = db();
  const log: string[] = [];
  let created = 0;
  let skipped = 0;

  for (const [i, statement] of MIGRATIONS.entries()) {
    try {
      await d.execute(sql.raw(statement));
      created++;
    } catch (err) {
      if (ALREADY_EXISTS.has(sqlState(err))) {
        skipped++;
        continue;
      }
      // The caller proved they hold SETUP_TOKEN, so they get the real reason
      // rather than a generic 500. Without this, a migration that fails on one
      // deployment's data is undebuggable from the outside.
      throw new ApiError(
        500,
        `Migration statement ${i + 1} of ${MIGRATIONS.length} failed` +
          `${sqlState(err) ? ` (${sqlState(err)})` : ""}: ${message(err)} — ${summarise(statement)}`
      );
    }
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
