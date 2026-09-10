/*
 * The per-mile reimbursement rate.
 *
 * Mirrors the nested IF in column H of the workbook, boundary for boundary. It
 * is display only — the sheet recalculates H itself the moment the mileage
 * columns are pasted in, and that figure, not this one, is what gets submitted.
 * This exists so the month screen can tell you roughly what the month is worth
 * before you open Excel at all.
 */

/** Descending by date; the first threshold a day reaches wins. */
const RATES: ReadonlyArray<{ from: string; rate: number }> = [
  { from: '2026-07-01', rate: 0.76 },
  { from: '2026-01-01', rate: 0.725 },
  { from: '2025-01-01', rate: 0.7 },
  { from: '2024-01-01', rate: 0.67 },
  { from: '2023-01-01', rate: 0.655 },
  { from: '2022-07-01', rate: 0.625 },
  { from: '2022-01-01', rate: 0.585 },
];

/** The sheet's own fallback for a row predating the table, or a blank date. */
const FALLBACK_RATE = 0.67;

/** ISO dates compare correctly as strings, so no Date object is needed. */
export function rateFor(isoDate: string): number {
  return RATES.find((entry) => isoDate >= entry.from)?.rate ?? FALLBACK_RATE;
}

/** Dollars for one day, rounded to the cent the way the sheet displays it. */
export function amountFor(isoDate: string, miles: number): number {
  return Math.round(miles * rateFor(isoDate) * 100) / 100;
}

export function formatDollars(amount: number): string {
  return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}
