# AGENTS.md

## Cursor Cloud specific instructions

The runnable product is **Rally**, a React 19 + Vite frontend with Vercel-style
serverless API handlers, backed by PostgreSQL (via Drizzle ORM). Everything
lives under `app/`. General setup/run/route docs are in `app/README.md`; only
the non-obvious, cloud-specific caveats are captured here.

### Services and how to run them (all from `app/`)
- API server: `npm run dev:api` — mounts the `api/*` handlers on Node HTTP at
  `http://localhost:3001`.
- Web app: `npm run dev` — Vite dev server at `http://localhost:5173`, proxies
  `/api` → `:3001`. Open this in the browser.
- Lint: `npm run lint` (oxlint). Build check: `npm run build` (tsc + vite).
- The price feed runs in deterministic **simulated** mode unless
  `FINNHUB_API_KEY` is set; no external account is needed for full end-to-end
  use (signup, trading, race, leaderboard).

### PostgreSQL
- PostgreSQL 16 is installed via apt but is **not auto-started** on a fresh VM.
  Start it before running anything DB-related: `sudo pg_ctlcluster 16 main start`
  (check with `pg_lsclusters`).
- A dev database and role are provisioned in the snapshot: database `rally`,
  role `rally` / password `rally`. `app/.env.local` points `DATABASE_URL` at it
  and sets `SESSION_SECRET` and `SETUP_TOKEN=local-setup`. `.env.local` is
  gitignored; if it is missing, recreate it from `app/.env.example` with
  `DATABASE_URL=postgres://rally:rally@localhost:5432/rally`.

### Schema setup gotcha (important)
- `npm run db:migrate` alone leaves the schema **out of date**: the hand-written
  migration `drizzle/0001_email_accounts.sql` (which swaps the players table from
  `handle`/`pin_hash` to `email`/`password_hash`) is NOT registered in
  `drizzle/meta/_journal.json`, so drizzle-kit skips it. Signup will then fail.
- The working path is the setup endpoint, which applies the **baked** migrations
  (`api/_lib/migrations.ts`, both 0000 and 0001) idempotently and seeds the
  tradable universe. With the API server running:
  `curl -X POST http://localhost:3001/api/setup -H 'content-type: application/json' -d '{"token":"local-setup"}'`
- Verify with `curl http://localhost:3001/api/health` — expect `"ok": true`.
  If it reports `schemaOutOfDate`, run `/api/setup` again.
