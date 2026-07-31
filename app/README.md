# Rally — Stock Combat System

An implementation of `Rally 3a Hybrid.dc.html` from the Claude Design handoff in
`../project`. Twenty screens of a stock-picking competition game for 12–18 year
olds: neon-glass UI carrying the interface, 80s arcade carrying the soul.

## Run it

```bash
npm install

# terminal 1 — the API (needs Postgres; see Database below)
DATABASE_URL=... SESSION_SECRET=... npm run dev:api

# terminal 2 — the app
npm run dev            # http://localhost:5173
```

| Route          | What it is                                                             |
| -------------- | ---------------------------------------------------------------------- |
| `/`            | **The running app** — real login, portfolio, trading, race, leaderboard |
| `/design`      | The design canvas: all 20 frames with their original mock data          |
| `/app/:screen` | One design frame, navigable, still on mock data                         |

On a phone the app fills the screen; on a desktop it draws itself inside a 390×844
phone bezel so the design can be reviewed as designed.

## What's here

- **React 19 + TypeScript + Vite**, with the `api/` folder running as Vercel
  serverless functions. No CSS framework — the design is almost entirely bespoke
  surfaces, so a token layer plus inline styles tracks it more faithfully than
  utility classes would.
- **Postgres via Drizzle.** Money is `numeric`, never float; shares are fractional
  to six places, because the design promises a play "can be $5 or $500K".
- **Fonts and icons are bundled**, not fetched from a CDN: `@fontsource/chakra-petch`,
  `@fontsource/press-start-2p`, `@phosphor-icons/web`.

```
api/
  _lib/     db · schema · session · prices · valuation · money · seed · http
  *.ts      one serverless function per endpoint
src/
  styles/   tokens.css — palette, shape language, keyframes, the .frame texture
  components/  PhoneFrame · TabBar · PixelCoin · ui (chip, card, button…)
  screens/  one file per frame; each takes optional `live` data and otherwise
            falls back to the design's mock values
  LiveApp.tsx  the running app: fetches, routes between tabs, submits orders
  api.ts    typed client + `useApi` hook
  device.tsx   fullscreen-on-phone vs bezel-on-desktop
```

## The backend

**MVP slice, as scoped.** Accounts, home, portfolio, discover, buy/sell, race
and the month/quarter/year leaderboard all read and write real data. Trophies
are computed from real history. Duels aren't built — that tab says so rather
than showing the design's mocked-up match. Activity and notifications are still
the static design screens.

**No test accounts.** Everyone who plays signs up with their own email and gets
their own $1,000,000. Nothing in the database is invented: no seeded rivals, no
generated pre-history, no fabricated streaks.

| Endpoint           | Does                                                          |
| ------------------ | ------------------------------------------------------------- |
| `POST /api/signup` | Create an account; drops the opening $1,000,000               |
| `POST /api/login`  | Email + password → signed HttpOnly session cookie             |
| `POST /api/logout` | Clears the session cookie                                     |
| `GET /api/me`      | Current player, or `null` so the app can boot to login        |
| `GET /api/portfolio` | Stack, positions, vitals; records today's snapshot          |
| `GET /api/feed`    | The crew feed, built from other players' real orders          |
| `GET /api/market`  | Gainers / losers / most-traded, plus search                   |
| `GET /api/quote`   | One instrument, with your position and cash                   |
| `POST /api/trade`  | Buy or sell, atomically                                       |
| `GET /api/race`    | Everyone's % return and daily series for the period           |
| `GET /api/leaderboard` | Ranked standings for month, quarter or year               |
| `POST /api/setup`  | One-shot migrate + load the tradable universe, guarded by `SETUP_TOKEN` |
| `GET /api/health`  | Is this deployment wired up? Config, counts, price source      |

Things worth knowing:

- **The client never sends a price or a share count.** It sends a symbol, a side
  and a dollar amount; the server prices the fill from its own cache. A tampered
  request can't mint shares.
- **Trades are transactional**, with the player row locked, so two fast taps
  can't spend the same cash twice.
- **Quotes are cached in Postgres for 15 minutes**, which is exactly the delay
  the UI promises. Without `FINNHUB_API_KEY` a deterministic simulated feed runs
  instead, so the whole stack works before any third-party account exists —
  switching to real prices is an env var, not a code change.
- **Streak and level are earned, not decorative.** Streak counts consecutive days
  with a non-seeded snapshot (i.e. days you actually opened the app); level comes
  off lifetime profit. Duels report `0` rather than inventing a number.
- **Competition is on % gain**, so every period needs a baseline — that's what
  `portfolio_snapshots` is for. The stack itself never resets.

### Environment

| Variable          | Required | What for                                              |
| ----------------- | -------- | ----------------------------------------------------- |
| `DATABASE_URL`    | yes      | Postgres. On Neon use the **pooled** (`-pooler`) URL.  |
| `SESSION_SECRET`  | yes      | Signs session cookies. Any random string ≥16 chars.    |
| `FINNHUB_API_KEY` | no       | Real delayed quotes. Omit to run the simulated feed.   |
| `SETUP_TOKEN`     | no       | Enables `POST /api/setup`. Unset = endpoint disabled.  |

### Database

```bash
npm run db:generate   # regenerate migrations + bake them for /api/setup
npm run db:migrate    # apply to DATABASE_URL
npm run db:seed       # the tradable universe — instruments and a warm quote cache
```

The seed creates **no players**. Accounts come from the app's signup screen, so
every portfolio, snapshot and order in the database was earned by someone
playing. A brand-new account is honestly empty: $1,000,000 in cash, 0% return,
rank #1 of however many people have signed up.

### Accounts

Email and a password, hashed with scrypt and a per-account salt. The session is
a signed HttpOnly cookie, so page JavaScript can never read it. Nothing sends
mail — there's no verification step and no password reset yet, which is the
main thing to build next if this goes further than friends and family.

Anyone who signs up joins the same race and appears in everyone's standings and
crew feed. That's the game, but it means the deployment is only as private as
the people you give the URL to.

## Deploying

Vercel builds the Vite app and turns each `api/*.ts` file into a serverless
function; `vercel.json` rewrites everything else to `index.html`.

1. Push this repo to GitHub, then **Add New → Project** in Vercel and import it,
   with **Root Directory** set to `app`.
2. In the project's **Storage** tab, create a **Neon** Postgres database. Vercel
   injects `DATABASE_URL` automatically.
3. In **Settings → Environment Variables**, add `SESSION_SECRET` (any long random
   string) and `SETUP_TOKEN` (another one). Add `FINNHUB_API_KEY` when you have it.
4. Redeploy so the new variables are picked up, then check it's wired up:

   ```bash
   curl https://<your-app>.vercel.app/api/health
   ```

   Expect `"priceSource": "finnhub"` once the key is set, and a hint telling you
   what's still missing otherwise.
5. Create the tables and load the tradable universe — once:

   ```bash
   curl -X POST https://<your-app>.vercel.app/api/setup \
     -H 'content-type: application/json' \
     -d '{"token":"<SETUP_TOKEN>"}'
   ```

   It's idempotent, and it runs inside the deployment, so the database credential
   never has to leave Vercel. Re-run it after pulling schema changes — it applies
   any new migrations and leaves existing accounts alone.
6. **Delete `SETUP_TOKEN`** once you're set up. With it unset the endpoint refuses
   to run at all. `/api/health` should now report `"ok": true`.
7. Open the app and create your account. It's the first one in the database, so
   you're the whole race until someone else signs up.

### On your iPhone

Open the URL in Safari → Share → **Add to Home Screen**. It launches fullscreen
with no browser chrome, respects the notch and home indicator, and uses the gold
coin icon. Create an account with your email, and a million coins drops into
it.

## Design decisions carried over from the chat

These aren't incidental — they're the conclusions the design conversation
reached, and the code preserves them:

- **Nav is HOME · FOLIO · [TRADE] · RACE · DUELS**, with TRADE as a raised
  magenta arcade button. Trading is the action that moves every other number;
  the rest are places you check. Labels stay plain for clarity even though the
  copy elsewhere shouts.
- **Trophies get no tab.** They live behind the avatar, which appears on the tab
  roots with a gold trophy-count pip, and never on detail screens (those use
  back-chevrons and exist to finish a task).
- **One signal, one home.** Level, rank, streak and live duels live only in
  HOME's vitals strip. The stack card is pure money.
- **Competition is on % gain**, for the month, quarter or year. The $1M stack
  never resets — total dollars are a vanity metric rewarding early joiners.
- **Duels** are winner-take-all: both players commit the same amount, biggest %
  gain on the wager takes the pot, over 30/60/90 days independent of the season
  clock. Ignored challenges expire in 48h with no penalty.
- **15-minute delayed prices**, said out loud rather than implied — "As of 9:26
  AM · prices delayed 15 min", "fills at next price update".
- **Taunts are preset-only.** No free text, so no moderation burden and no
  bullying vector.
- **Losing well.** Defeat leads with a comeback quest and the season-reset
  countdown, never with a nudge to buy more while down.
- `prefers-reduced-motion` freezes the coin drop and every other animation.

## Two things I changed

- **The RALLY wordmark now pulses.** The prototype set
  `animation: logoglow 2.4s` but never defined those keyframes, so the logo sat
  static. Added them as the glow the design notes describe.
- **List screens scroll.** The prototype set `overflow:hidden` on every frame
  because the frames were static. HOME's feed, the trophy grid and the settings
  list run past 844px and are meant to scroll.

## Inconsistencies reproduced as-designed — worth a decision

The design assistant flagged these and the conversation ended before they were
resolved, so the code matches the file rather than guessing:

1. **RACE (05) missed the consolidation pass.** It still shows a standalone
   streak flame chip and a pip-less avatar, both removed everywhere else when
   each signal got exactly one home. Fixing it means dropping the flame chip and
   using `<Avatar pip={11} />` — a two-line change in `screens/Race.tsx`.
2. **The order ticket shows "Coins before $1,000,400"** while the stock screen
   behind it shows a $975,400 balance. Both can't be right for one order.
3. **Quiet hours read "9 PM – 7 AM · always on for school nights"** but the
   window shown is every night. Pick one.
4. **Figures deliberately differ between frames** because each is a different
   moment in one timeline (day-one $1,000,000 on the empty state; $975,400 after
   the NVIDIA order; $1,140,230 on HOME/FOLIO, where invested + cash reconciles).
   Fine for mocks, but a spec should mark each frame's moment so it doesn't get
   hard-coded as a contradiction.

## Not built

Everything in the design file is implemented. Screens the design conversation
identified as still missing — search results, duel history, bankruptcy reset,
send-money, parent view — were never mocked and aren't here.
