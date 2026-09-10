/*
 * Dates, always in one zone.
 *
 * Vercel runs UTC. Without pinning, an odometer entered at 7pm Eastern files
 * itself under tomorrow, which silently splits one workday across two rows and
 * puts a day in the wrong month at the boundary. Every "what day is it" in the
 * app resolves through here instead of `new Date().toISOString().slice(0, 10)`.
 *
 * No imports, for the same reason as lib/odometer.ts: the form needs today's
 * date before it can talk to the server.
 */

export const TIME_ZONE = 'America/New_York';

/** ISO 'YYYY-MM-DD'. 'en-CA' formats exactly that way, which is why it is here. */
export function todayInZone(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/** The 'YYYY-MM' this app calls a month. */
export function monthOf(isoDate: string): string {
  return isoDate.slice(0, 7);
}

export function currentMonth(now: Date = new Date()): string {
  return monthOf(todayInZone(now));
}

/*
 * Parsed as UTC noon, never local midnight.
 *
 * `new Date('2026-09-01')` is UTC midnight, which is August 31st in any western
 * zone — so formatting it back with a weekday shifts the day by one. Noon has
 * no such edge anywhere on Earth.
 */
function atNoon(isoDate: string): Date {
  return new Date(`${isoDate}T12:00:00Z`);
}

function parts(isoDate: string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', ...options }).format(atNoon(isoDate));
}

/** 'Tue Sep 1' — the log table's row label. */
export function formatDayLabel(isoDate: string): string {
  return parts(isoDate, { weekday: 'short', month: 'short', day: 'numeric' });
}

/** 'Tuesday, September 1' — the home screen's one date line. */
export function formatLongDate(isoDate: string): string {
  return parts(isoDate, { weekday: 'long', month: 'long', day: 'numeric' });
}

/** 'September 2026' — the month screen's heading. */
export function formatMonthLabel(month: string): string {
  return parts(`${month}-01`, { month: 'long', year: 'numeric' });
}

/**
 * '9/1/2026' — the Date column for the clipboard.
 *
 * US Excel parses this into a real date with no format prompt, which an ISO
 * string does not reliably do in a cell already styled as a date.
 */
export function formatExcelDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return `${Number(month)}/${Number(day)}/${year}`;
}

/** Month arithmetic on the string, so no Date object can drift across a DST edge. */
export function shiftMonth(month: string, delta: number): string {
  const [year, index] = month.split('-').map(Number);
  const zeroBased = year * 12 + (index - 1) + delta;
  return `${Math.floor(zeroBased / 12)}-${String((zeroBased % 12) + 1).padStart(2, '0')}`;
}

export function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(atNoon(value).getTime());
}

export function isMonth(value: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}
