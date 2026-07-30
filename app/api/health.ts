import { desc, sql } from "drizzle-orm";
import { db, schema } from "./_lib/db.js";
import { route } from "./_lib/http.js";
import { usingRealPrices } from "./_lib/prices.js";

/**
 * Is this deployment actually wired up?
 *
 * Answers the three questions you have right after deploying: can it reach the
 * database, has it been seeded, and is it serving real quotes or the simulated
 * feed. Deliberately reveals no data — counts and a source name only.
 */
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
    const [players] = await d.select({ n: sql<number>`count(*)::int` }).from(schema.players);
    const [instruments] = await d
      .select({ n: sql<number>`count(*)::int` })
      .from(schema.instruments);
    const [freshest] = await d
      .select({ at: schema.quotes.fetchedAt })
      .from(schema.quotes)
      .orderBy(desc(schema.quotes.fetchedAt))
      .limit(1);

    const seeded = players.n > 0 && instruments.n > 0;

    return {
      ok: seeded && config.sessionSecret,
      priceSource: source,
      config,
      players: players.n,
      instruments: instruments.n,
      lastQuoteAt: freshest?.at ?? null,
      hint: !config.sessionSecret
        ? "SESSION_SECRET is not set — nobody can sign in."
        : seeded
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
