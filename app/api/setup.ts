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

  for (const statement of MIGRATIONS) {
    try {
      await d.execute(sql.raw(statement));
      created++;
    } catch (err) {
      if (!ALREADY_EXISTS.has(sqlState(err))) throw err;
      skipped++;
    }
  }
  log.push(`schema: ${created} applied, ${skipped} already present`);

  const loaded = await seed((m) => log.push(m));

  return {
    ok: true,
    log,
    ...loaded,
    next: "Open the app and create your account.",
  };
});
