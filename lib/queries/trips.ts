import { and, asc, desc, eq, gte, lte } from 'drizzle-orm';
import { getDb, trips, type Trip } from '@/db';
import { summarise, type MonthSummary } from '@/lib/sheet';

/*
 * Every read the server components do. Mutations go client -> fetch ->
 * app/api/trips/*, matching ../vermont-plate-log.
 */

export async function getTripByDate(date: string): Promise<Trip | null> {
  const [row] = await getDb().select().from(trips).where(eq(trips.date, date)).limit(1);
  return row ?? null;
}

/**
 * The most recent reading on or before a date, for the "last reading" hint.
 *
 * Prefers the day's ending reading and falls back to its start, so the hint is
 * the last number actually seen on the dial rather than the last row opened.
 */
export async function getPreviousReading(before: string): Promise<{ date: string; tenths: number } | null> {
  const [row] = await getDb()
    .select()
    .from(trips)
    .where(lte(trips.date, before))
    .orderBy(desc(trips.date))
    .limit(1);

  if (!row) return null;
  return { date: row.date, tenths: row.endTenths ?? row.startTenths };
}

export async function getMonth(month: string): Promise<MonthSummary> {
  const rows = await getDb()
    .select()
    .from(trips)
    .where(and(gte(trips.date, `${month}-01`), lte(trips.date, `${month}-31`)))
    .orderBy(asc(trips.date));

  return summarise(month, rows);
}

/** Months that have at least one row, newest first — the month picker's range. */
export async function getLoggedMonths(): Promise<string[]> {
  const rows = await getDb().select({ date: trips.date }).from(trips).orderBy(desc(trips.date));
  return [...new Set(rows.map((row) => row.date.slice(0, 7)))];
}
