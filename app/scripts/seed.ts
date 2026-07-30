/**
 * CLI wrapper for the seed. The logic lives in api/_lib/seed.ts so the
 * deployment's /api/setup endpoint and this command share exactly one
 * implementation.
 *
 *   DATABASE_URL=... npm run db:seed
 */
import { seed } from "../api/_lib/seed.js";

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
