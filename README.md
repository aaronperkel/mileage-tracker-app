# Mileage

Odometer readings for the monthly UVM mileage log.

The whole app is one number field. Tap it getting out of the car at work, tap it again getting
back in to leave; it records the date itself. At the end of the month, three buttons put the
**Date**, **Starting Mileage** and **Ending Mileage** columns on the clipboard, ready to paste into
the workbook at **A7**, **C7** and **E7**.

It does not generate the spreadsheet. The same template gets submitted the same way — this only
removes the remembering.

## The columns it fills

The template's log body is rows 7–31:

| A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|
| Date | Origin | **Starting Mileage** | Destination | **Ending Mileage** | Total Miles | Purpose | Amount |

Origin, Destination and Purpose are the same on every row and are filled in already. Total Miles
and Amount are formulas — pasting over them is the one thing to avoid, which is why the three
columns copy separately rather than as one block.

A day still missing its ending reading is flagged on the month screen, and still takes a row in
every column so the three pastes stay lined up.

## Running it

```bash
cp .env.example .env.local   # DATABASE_URL="file:./local.db" needs no Turso account
npm install
npm run db:migrate
npm run dev
```

`npm test` runs the unit tests. `npm run build` applies pending migrations first, so a Vercel
deploy migrates itself.

## Deploying

Import the repo on Vercel, then install the **Turso** integration from the Marketplace — it
injects `DATABASE_TURSO_DATABASE_URL` and `DATABASE_TURSO_AUTH_TOKEN`, which `db/connection.ts`
already reads. Two variables are set by hand:

| Variable | |
|---|---|
| `APP_PASSWORD` | the one password; there is no user table |
| `AUTH_SECRET` | `openssl rand -base64 32` |

Add it to the phone's home screen and it opens straight onto the field.
