import { sql } from "drizzle-orm";
import { db } from "./db.js";
import { MIGRATIONS } from "./migrations.js";

/**
 * Applies the baked migration list.
 *
 * Shared by `/api/setup` and `npm run db:migrate` so a local database and a
 * deployment are brought to the same shape by the same statements. Running
 * these through drizzle-kit instead would quietly skip any hand-written
 * migration missing from its journal — which is a local database that looks
 * migrated and isn't.
 */

/** Postgres codes for "this object already exists" — re-running is fine. */
const ALREADY_EXISTS = new Set(["42P07", "42710", "42P16", "23505"]);

/** Drizzle wraps driver errors, so the SQLSTATE code lives on `cause`. */
export function sqlState(err: unknown): string {
  const e = err as { code?: string; cause?: { code?: string } };
  return e?.code ?? e?.cause?.code ?? "";
}

export const message = (err: unknown) => {
  const raw = err instanceof Error ? err.message : String(err);
  const first = raw.split("\n")[0].trim();
  return first.length > 300 ? `${first.slice(0, 300)}…` : first;
};

/** Enough of the statement to recognise it, on one line. */
export const summarise = (statement: string) => statement.replace(/\s+/g, " ").slice(0, 120);

export class MigrationError extends Error {
  constructor(
    readonly index: number,
    readonly total: number,
    readonly code: string,
    readonly detail: string,
    readonly statement: string
  ) {
    super(
      `Migration statement ${index + 1} of ${total} failed${code ? ` (${code})` : ""}: ` +
        `${detail} — ${summarise(statement)}`
    );
  }
}

export async function applyMigrations() {
  const d = db();
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
      throw new MigrationError(i, MIGRATIONS.length, sqlState(err), message(err), statement);
    }
  }
  return { created, skipped };
}
