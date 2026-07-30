# Rally — Stock Combat System

An implementation of `Rally 3a Hybrid.dc.html` from the Claude Design handoff in
`../project`. Twenty screens of a stock-picking competition game for 12–18 year
olds: neon-glass UI carrying the interface, 80s arcade carrying the soul.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + production build
npm run preview
```

Two routes:

| Route          | What it is                                                          |
| -------------- | ------------------------------------------------------------------- |
| `/`            | The design canvas — all 20 frames side by side, for review          |
| `/app/:screen` | One phone frame you can navigate via the tab bar and in-screen CTAs |

Clicking a frame's label chip in the gallery opens that screen in the app.

## What's here

- **React 19 + TypeScript + Vite.** No CSS framework — the design is almost
  entirely bespoke surfaces, so a token layer plus inline styles tracks it more
  faithfully (and more readably) than utility classes would.
- **Fonts and icons are bundled**, not fetched from a CDN: `@fontsource/chakra-petch`,
  `@fontsource/press-start-2p`, `@phosphor-icons/web`. The prototype linked
  unpkg and Google Fonts; fine for a mock, not for an app.
- **No backend, no market data.** Every figure is the mock data the design
  specified, in `src/data.ts`.

```
src/
  styles/tokens.css     palette, shape language, keyframes, the .frame texture
  components/           PhoneFrame · TabBar · PixelCoin · ui (chip, card, button…)
  screens/              one file per frame; index.tsx is the registry + routing map
  data.ts               mock data lifted from the design
```

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
