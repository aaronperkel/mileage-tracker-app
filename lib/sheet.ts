import { formatExcelDate } from '@/lib/date';
import { formatPlain } from '@/lib/odometer';
import { rateFor } from '@/lib/rate';
import type { Trip } from '@/db/schema';

/*
 * Turning a month into the three columns the workbook actually wants.
 *
 * The template's log body is rows 7-31 of one sheet:
 *
 *   A Date   B Origin   C Starting   D Destination   E Ending   F Total   G Purpose   H Amount
 *
 * B, D and G are the same three strings on every row ever submitted, and F and
 * H are formulas. So only A, C and E are ever typed, and they are not adjacent
 * — which is the whole reason this exports three single columns rather than one
 * wide block. A five-column paste at A7 would overwrite Origin with a reading
 * and blank out the Total Miles formula.
 */

/** Columns B, D and G. Constants, not data — see the note in db/schema.ts. */
export const ORIGIN = 'UVM';
export const DESTINATION = 'UVM';
export const PURPOSE = 'Network Services';

/** Where each exported column is pasted. */
export const PASTE_TARGETS = { date: 'A7', start: 'C7', end: 'E7' } as const;

/** The template's log body. Beyond this the month does not fit the sheet. */
export const SHEET_ROW_CAPACITY = 25; // rows 7 through 31

export type MonthRow = {
  date: string;
  startTenths: number;
  endTenths: number | null;
  /** Null while the day is still open. */
  milesTenths: number | null;
};

export type MonthSummary = {
  month: string;
  rows: MonthRow[];
  /** Days with both readings. The only ones that contribute miles. */
  completeCount: number;
  /** Days still missing an ending reading. */
  openCount: number;
  totalMilesTenths: number;
  /** Estimated dollars, summed per day so each uses its own date's rate. */
  totalAmount: number;
  /** True when the month has more days than rows 7-31 can hold. */
  overflows: boolean;
};

export function summarise(month: string, trips: Trip[]): MonthSummary {
  const rows: MonthRow[] = trips.map((trip) => ({
    date: trip.date,
    startTenths: trip.startTenths,
    endTenths: trip.endTenths,
    milesTenths: trip.endTenths == null ? null : trip.endTenths - trip.startTenths,
  }));

  let totalMilesTenths = 0;
  let totalAmount = 0;
  let completeCount = 0;

  for (const row of rows) {
    if (row.milesTenths == null) continue;
    completeCount += 1;
    totalMilesTenths += row.milesTenths;
    /*
     * Per day, at that day's rate, and deliberately not rounded here.
     *
     * Two things have to hold at once. Each row uses its own rate, because a
     * month spanning a rate change (1 July, most recently) has two in it and
     * column H applies each row's own — so this cannot be rate * total. But the
     * sheet also rounds only when it displays H33, never per row, and rounding
     * each day first drifts: August came out a cent over the sheet's $171.91
     * and June three cents over $125.64. Round once, at the end.
     */
    totalAmount += (row.milesTenths / 10) * rateFor(row.date);
  }

  return {
    month,
    rows,
    completeCount,
    openCount: rows.length - completeCount,
    totalMilesTenths,
    totalAmount: Math.round(totalAmount * 100) / 100,
    overflows: rows.length > SHEET_ROW_CAPACITY,
  };
}

/*
 * One string per column, newline-separated, in date order.
 *
 * A day missing its ending reading still emits a row in all three columns, with
 * an empty string for the end. Dropping it would leave the start column one row
 * longer than the end column, so every reading below the gap would pair with
 * the wrong day — a submitted sheet that is wrong and looks right. An empty
 * cell in E is instead visibly blank, and column F shows the mismatch.
 */
export function toColumns(rows: MonthRow[]): { date: string; start: string; end: string } {
  return {
    date: rows.map((row) => formatExcelDate(row.date)).join('\n'),
    start: rows.map((row) => formatPlain(row.startTenths)).join('\n'),
    end: rows.map((row) => (row.endTenths == null ? '' : formatPlain(row.endTenths))).join('\n'),
  };
}
