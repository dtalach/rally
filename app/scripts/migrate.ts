/**
 * Applies the schema to DATABASE_URL, using the same statements `/api/setup`
 * runs against a deployment.
 *
 *   npm run db:migrate
 */
import { applyMigrations } from "../api/_lib/migrate.js";

applyMigrations()
  .then(({ created, skipped }) => {
    console.log(`schema: ${created} applied, ${skipped} already present`);
    process.exit(0);
  })
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
