# Mileage

Odometer readings for the monthly UVM mileage log. One field on the home screen: tap it getting
out of the car at work, tap it again getting back in to leave. At month end, three buttons put the
Date, Starting Mileage and Ending Mileage columns on the clipboard for the workbook.

Next 16 App Router, Drizzle over Turso, Tailwind v4, deployed on Vercel.

## Commands

```bash
npm run dev
npm test             # vitest, once
npm run lint         # eslint, no prettier in this repo
npm run typecheck
npm run build        # applies pending migrations first, then builds
npm run db:generate  # write a migration after editing db/schema.ts
npm run db:migrate   # on its own; the build does this too, so Vercel deploys migrate
npm run icons        # regenerate home-screen PNGs from the drum colours
```

Locally `DATABASE_URL="file:./local.db"` needs no Turso account.

## The sheet this feeds

The template's log body is rows **7–31** of one sheet:

| A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|
| Date | Origin | Starting Mileage | Destination | Ending Mileage | Total Miles | Purpose | Amount |

Across three submitted months every row read `UVM` → `UVM` / `Network Services`, so **B, D and G
are constants** — they live in `lib/sheet.ts`, not in the database. **F and H are formulas** and
must never be pasted over. Only A, C and E are ever typed, and they are not adjacent, which is the
entire reason the export is three separate single columns rather than one wide block.

## Invariants

**Readings are integer tenths of a mile, never floats.** `995447` is 99,544.7. The workbooks show
why: `SEP.xlsx` stores `99552.3 - 99544.7` as `7.6000000000058208` and its month total as
`85.800000000017462`. `lib/odometer.ts` is the only place a string becomes tenths or the reverse,
and like `lib/plate.ts` in `../vermont-plate-log` **it has no imports and must keep it that way** —
the form validates and previews the day's miles as you type with no round trip, and the API stores
the result of the same functions.

**Nothing assumes a five-digit odometer.** It read 99,980.1 the week this was built and crossed
100,000 days later. Six whole digits and a tenth, everywhere.

**Every date resolves through `lib/date.ts`.** Vercel runs UTC; a reading entered at 7pm Eastern
would otherwise file itself under tomorrow, splitting a workday across two rows and putting days
in the wrong month at the boundary. `TIME_ZONE` is `America/New_York`.

**`/log` must stay `force-dynamic`.** It redirects to the current month. Prerendered, it would
freeze whichever month the build ran in and send every visit there until the next deploy.

**A day with no ending reading still emits a row in all three export columns**, with an empty
string for the end. Dropping it would leave the start column one row longer than the end column,
so every reading below the gap would pair with the wrong day — a submitted sheet that is wrong and
looks right. `lib/sheet.test.ts` holds this.

**Month totals round once, at the end.** Column H is unrounded per row and only H33 is displayed
rounded, so rounding each day to the cent first drifts: August came out a cent over the sheet's
$171.91 and June three cents over $125.64. But the sum still has to be per row at each row's own
rate, because a month spanning a rate change (1 July, most recently) has two rates in it.

## Conventions

Matches `../vermont-plate-log`, which matches `../funko`.

- npm. No `src/`. Top-level `app/ components/ lib/ db/ scripts/ assets/`, `proxy.ts` at the root
  (Next 16's renamed middleware).
- kebab-case filenames, PascalCase named exports. Only `page.tsx`/`layout.tsx` default-export.
- Tailwind v4, no config file: `:root` tokens in `app/globals.css`, then `@theme inline`.
- Single quotes in hand-written code; scaffolded configs stay double-quoted as generated.
- API routes, not server actions. Server components read `lib/queries/*` directly; mutations go
  client → `fetch` → `app/api/*/route.ts` through the helpers in `lib/api.ts`.
- Never read `process.env` or construct a DB client at module scope — `next build` imports every
  route, so an eager read turns a missing variable into a build failure on an unrelated page.
  Use `env` getters and `getDb()`.
- Fonts are committed in `assets/fonts/` and loaded with `next/font/local`, so builds never depend
  on reaching Google.

## Design

Light mode only. No dark theme and no toggle — do not add one.

The odometer strip is the only place colour is spent, and the only object in the app. The gradient
on each drum is the curve of a wheel catching light at the top and rolling into shadow; the tenths
drum is brick because that is what a mechanical trip meter does. Barlow Semi Condensed is
exclusive to those drums — odometer digits are tall and narrow because the wheel is narrow.
Everything else is a cool off-white ground, neutral greys, and hairline rules rather than cards.

Sentence case throughout. Every figure uses `.tnum`, because every figure in this app is a
quantity that gets compared down a column.
