import { createId } from '@paralleldrive/cuid2';
import { type InferInsertModel, type InferSelectModel } from 'drizzle-orm';
import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

/*
 * One table. One person logging one odometer; there is nothing else to model.
 *
 * Origin, destination and purpose are deliberately not columns. Every row in
 * three months of submitted sheets reads UVM -> UVM / Network Services, so they
 * are constants — they live in lib/sheet.ts. A column that has held one value
 * for sixty rows is a constant wearing a schema.
 */

const now = () => new Date().toISOString();

export const trips = sqliteTable(
  'trips',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),

    /** ISO 'YYYY-MM-DD', always the local date in lib/date.ts's TIME_ZONE. */
    date: text('date').notNull(),

    /*
     * Integer tenths of a mile: 995447 is 99,544.7. Never a float.
     *
     * The sheets themselves show why — 99552.3 - 99544.7 stores as
     * 7.6000000000058208 in SEP.xlsx, and the month total as 85.800000000017462.
     * lib/odometer.ts is the only place tenths become a string or the reverse.
     */
    startTenths: integer('start_tenths').notNull(),

    /** Null between arriving at work and getting back in the car to leave. */
    endTenths: integer('end_tenths'),

    createdAt: text('created_at').notNull().$defaultFn(now),
    updatedAt: text('updated_at').notNull().$defaultFn(now),
  },
  (t) => [
    /*
     * One row per day, matching the sheet: every date across JUN, AUG and SEP
     * appears exactly once. Arriving twice in a day edits the existing row
     * rather than creating a second — see app/api/trips/route.ts.
     */
    uniqueIndex('trips_date_idx').on(t.date),
  ],
);

export type Trip = InferSelectModel<typeof trips>;
export type NewTrip = InferInsertModel<typeof trips>;
