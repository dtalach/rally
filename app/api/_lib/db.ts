import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

/**
 * postgres.js rather than the Neon serverless driver, so the exact same code
 * runs against local Postgres and against Neon in production. On Vercel, point
 * DATABASE_URL at Neon's *pooled* endpoint (`-pooler` in the host) — serverless
 * functions open a connection per invocation and will exhaust a direct one.
 */
let client: ReturnType<typeof postgres> | undefined;

export function db() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Provision Postgres and add it to the environment — see README."
    );
  }
  client ??= postgres(url, {
    max: 1, // one socket per serverless invocation; the pooler does the pooling
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false, // required when talking to a transaction-mode pooler
  });
  return drizzle(client, { schema });
}

export { schema };
