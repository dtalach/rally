import { desc, sql } from "drizzle-orm";
import { getTableConfig, type PgTable } from "drizzle-orm/pg-core";
import { db, schema } from "./_lib/db.js";
import { route } from "./_lib/http.js";
import { usingRealPrices } from "./_lib/prices.js";

/**
 * Is this deployment actually wired up?
 *
 * Answers the questions you have right after deploying: can it reach the
 * database, is the database the shape this build expects, has the tradable
 * universe been loaded, and is it serving real quotes or the simulated feed.
 * Deliberately reveals no data — counts, column names and a source name only.
 */

/** Every table and column the code expects, read off the schema module. */
function expected() {
  const tables = new Map<string, string[]>();
  for (const table of Object.values(schema)) {
    const config = getTableConfig(table as PgTable);
    tables.set(
      config.name,
      config.columns.map((c) => c.name)
    );
  }
  return tables;
}

/**
 * Columns the code will select or insert that the database hasn't got.
 *
 * Counting rows isn't enough of a check: a table left over from an older
 * migration answers `count(*)` perfectly happily and then fails the moment
 * something touches a column added since. That's a broken signup reported as a
 * healthy deployment.
 */
async function missingColumns() {
  const rows = await db().execute<{ table_name: string; column_name: string }>(
    sql`select table_name, column_name from information_schema.columns where table_schema = 'public'`
  );

  const present = new Map<string, Set<string>>();
  for (const row of rows) {
    const set = present.get(row.table_name) ?? new Set<string>();
    set.add(row.column_name);
    present.set(row.table_name, set);
  }

  const missing: string[] = [];
  for (const [table, columns] of expected()) {
    const have = present.get(table);
    if (!have) {
      missing.push(`${table} (whole table)`);
      continue;
    }
    for (const column of columns) {
      if (!have.has(column)) missing.push(`${table}.${column}`);
    }
  }
  return missing;
}

export default route("GET", async () => {
  const source = usingRealPrices() ? "finnhub" : "simulated";

  const config = {
    database: Boolean(process.env.DATABASE_URL),
    sessionSecret: Boolean(process.env.SESSION_SECRET),
    finnhubKey: usingRealPrices(),
    setupEnabled: Boolean(process.env.SETUP_TOKEN),
  };

  if (!config.database) {
    return { ok: false, priceSource: source, config, hint: "DATABASE_URL is not set." };
  }

  try {
    const d = db();
    const missing = await missingColumns();
    const [players] = await d.select({ n: sql<number>`count(*)::int` }).from(schema.players);
    const [instruments] = await d
      .select({ n: sql<number>`count(*)::int` })
      .from(schema.instruments);
    const [freshest] = await d
      .select({ at: schema.quotes.fetchedAt })
      .from(schema.quotes)
      .orderBy(desc(schema.quotes.fetchedAt))
      .limit(1);

    // Zero players is the normal state of a fresh deployment — accounts are
    // made from the signup screen, not by the setup step. Only a missing
    // universe means setup hasn't run.
    const loaded = instruments.n > 0;

    return {
      ok: missing.length === 0 && loaded && config.sessionSecret,
      priceSource: source,
      config,
      players: players.n,
      instruments: instruments.n,
      lastQuoteAt: freshest?.at ?? null,
      ...(missing.length ? { schemaOutOfDate: missing } : {}),
      hint: missing.length
        ? "The database is missing columns this build needs. Run POST /api/setup."
        : !config.sessionSecret
          ? "SESSION_SECRET is not set — nobody can sign in."
          : loaded
            ? undefined
            : "Database is reachable but empty. Run POST /api/setup.",
    };
  } catch {
    // The tables may not exist yet, which is a normal pre-setup state.
    return {
      ok: false,
      priceSource: source,
      config,
      hint: "Connected to the environment but couldn't read the tables. Run POST /api/setup.",
    };
  }
});
