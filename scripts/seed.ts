import './load-env';
import { sql } from 'drizzle-orm';
import { getDb, trips } from '../db';
import { formatMiles } from '../lib/odometer';
import { SEED_TRIPS } from './seed-data';

/*
 * Idempotent, keyed on date: re-running updates the readings for a day rather
 * than inserting a second row, which the unique index would reject anyway.
 *
 * Safe to run against Turso after the first deploy.
 */

async function main() {
  const db = getDb();

  for (const trip of SEED_TRIPS) {
    await db
      .insert(trips)
      .values(trip)
      .onConflictDoUpdate({
        target: trips.date,
        set: {
          startTenths: trip.startTenths,
          endTenths: trip.endTenths,
          updatedAt: new Date().toISOString(),
        },
      });
  }

  /* Report by month, so the totals can be eyeballed against the workbooks. */
  const byMonth = new Map<string, number>();
  for (const trip of SEED_TRIPS) {
    if (trip.endTenths == null) continue;
    const month = trip.date.slice(0, 7);
    byMonth.set(month, (byMonth.get(month) ?? 0) + (trip.endTenths - trip.startTenths));
  }

  const [{ total }] = await db.select({ total: sql<number>`count(*)` }).from(trips);

  console.log(`Seeded ${SEED_TRIPS.length} days; ${total} rows in the log.`);
  for (const [month, tenths] of [...byMonth].sort()) {
    console.log(`  ${month}  ${formatMiles(tenths)} mi`);
  }
}

main().catch((error: unknown) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
