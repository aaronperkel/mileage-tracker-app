/*
 * Odometer readings, as integer tenths of a mile.
 *
 * This module has no imports and must keep it that way. The form validates and
 * previews the day's miles as you type with no round trip, and the API stores
 * the result of the same functions — a dependency here breaks the first half of
 * that. (lib/plate.ts in ../vermont-plate-log holds the same line.)
 *
 * Everything is tenths because the readings have exactly one decimal place and
 * floats cannot hold them. The submitted sheets prove it: SEP.xlsx stores
 * 99552.3 - 99544.7 as 7.6000000000058208 and its month total as
 * 85.800000000017462. Integers make those exact.
 */

/** Odometer readings run to six digits and a tenth; this one turns over soon. */
const MAX_TENTHS = 9_999_999; // 999,999.9 miles

/**
 * '99,544.7' -> 995447. Null for anything that is not a reading.
 *
 * Parsing is string arithmetic on the two halves, never `Number(x) * 10`, which
 * is the exact multiplication that produces 1998.9999999999998 for money.
 */
export function parseTenths(input: string): number | null {
  const cleaned = input.trim().replace(/,/g, '').replace(/\s/g, '');
  if (!cleaned) return null;

  const match = /^(\d{1,6})(?:\.(\d))?\d*$/.exec(cleaned);
  if (!match) return null;

  const [, whole, tenth] = match;
  const tenths = Number(whole) * 10 + Number(tenth ?? 0);
  return tenths > MAX_TENTHS ? null : tenths;
}

/** 995447 -> '99,544.7'. For display; never for the clipboard. */
export function formatOdometer(tenths: number): string {
  const whole = Math.trunc(tenths / 10);
  return `${whole.toLocaleString('en-US')}.${tenths % 10}`;
}

/** 995447 -> '99544.7'. Ungrouped, for pasting into Excel. */
export function formatPlain(tenths: number): string {
  return `${Math.trunc(tenths / 10)}.${tenths % 10}`;
}

/** A difference in tenths as miles: 76 -> '7.6'. Whole numbers keep the '.0'. */
export function formatMiles(tenths: number): string {
  const sign = tenths < 0 ? '-' : '';
  const abs = Math.abs(tenths);
  return `${sign}${Math.trunc(abs / 10).toLocaleString('en-US')}.${abs % 10}`;
}

/** Splits a reading for the odometer strip: ['0', '9', '9', '5', '4', '4'] + '7'. */
export function digitsOf(tenths: number, width = 6): { whole: string[]; tenth: string } {
  const whole = String(Math.trunc(tenths / 10)).padStart(width, '0');
  return { whole: whole.split(''), tenth: String(tenths % 10) };
}

/*
 * Sanity checks on a new reading.
 *
 * Deliberately two severities. An end below its own start is arithmetic that
 * cannot happen, so it is refused. Everything else is merely unusual: an
 * odometer really can be replaced, and a long day really can happen, so those
 * warn and still save. Blocking a true reading is worse than a caption.
 */

/** A day over this many miles is worth a second look, not a refusal. */
const IMPLAUSIBLE_DAY_TENTHS = 5_000; // 500.0 miles

export type Check =
  | { level: 'ok' }
  | { level: 'warn'; message: string }
  | { level: 'error'; message: string };

export function checkReading(
  tenths: number,
  context: { startTenths?: number | null; previousTenths?: number | null },
): Check {
  const { startTenths, previousTenths } = context;

  if (startTenths != null) {
    if (tenths < startTenths) {
      return {
        level: 'error',
        message: `That is below this morning's ${formatOdometer(startTenths)}.`,
      };
    }
    if (tenths - startTenths > IMPLAUSIBLE_DAY_TENTHS) {
      return {
        level: 'warn',
        message: `${formatMiles(tenths - startTenths)} miles in a day — check the digits.`,
      };
    }
    return { level: 'ok' };
  }

  if (previousTenths != null && tenths < previousTenths) {
    return {
      level: 'warn',
      message: `Below the last reading of ${formatOdometer(previousTenths)}.`,
    };
  }

  return { level: 'ok' };
}
