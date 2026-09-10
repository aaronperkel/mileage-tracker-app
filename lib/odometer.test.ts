import { describe, expect, it } from 'vitest';
import {
  checkReading,
  digitsOf,
  formatMiles,
  formatOdometer,
  formatPlain,
  parseTenths,
} from '@/lib/odometer';

describe('parseTenths', () => {
  it('reads a plain reading', () => {
    expect(parseTenths('99544.7')).toBe(995447);
  });

  it('accepts a whole number as .0', () => {
    expect(parseTenths('99951')).toBe(999510);
  });

  it('tolerates grouping, spaces and surrounding whitespace', () => {
    expect(parseTenths(' 99,544.7 ')).toBe(995447);
    expect(parseTenths('99 544.7')).toBe(995447);
  });

  it('truncates past the tenth rather than rounding into it', () => {
    /* The dial only shows one decimal; a second digit is a fat finger, and
     * rounding 99544.78 up to 99544.8 invents a tenth of a mile. */
    expect(parseTenths('99544.78')).toBe(995447);
  });

  it('handles the rollover past 100,000 without a special case', () => {
    expect(parseTenths('100012.4')).toBe(1000124);
    expect(formatOdometer(1000124)).toBe('100,012.4');
  });

  it('rejects anything that is not a reading', () => {
    for (const input of ['', '   ', 'abc', '-12.3', '12.3.4', '1234567.8', '.5']) {
      expect(parseTenths(input), input).toBeNull();
    }
  });
});

describe('formatting', () => {
  it('groups for display and does not for the clipboard', () => {
    expect(formatOdometer(995447)).toBe('99,544.7');
    expect(formatPlain(995447)).toBe('99544.7');
  });

  it('keeps the tenth on a whole number of miles', () => {
    expect(formatMiles(130)).toBe('13.0');
    expect(formatPlain(999510)).toBe('99951.0');
  });

  it('formats a difference', () => {
    expect(formatMiles(76)).toBe('7.6');
    expect(formatMiles(2262)).toBe('226.2');
  });

  it('splits a reading for the odometer strip', () => {
    expect(digitsOf(995447)).toEqual({ whole: ['0', '9', '9', '5', '4', '4'], tenth: '7' });
    expect(digitsOf(1000124)).toEqual({ whole: ['1', '0', '0', '0', '1', '2'], tenth: '4' });
  });
});

describe('integer tenths remove the drift the sheets have', () => {
  it('subtracts exactly where the workbook does not', () => {
    /* SEP.xlsx stores this difference as 7.6000000000058208. */
    expect(99552.3 - 99544.7).not.toBe(7.6);
    expect(formatMiles(995523 - 995447)).toBe('7.6');
  });

  it('totals September exactly, where the sheet reads 85.800000000017462', () => {
    const days: Array<[number, number]> = [
      [995447, 995523],
      [995834, 995969],
      [996231, 996406],
      [996794, 996933],
      [999332, 999510],
      [999646, 999801],
    ];
    const total = days.reduce((sum, [start, end]) => sum + (end - start), 0);
    expect(formatMiles(total)).toBe('85.8');
  });
});

describe('checkReading', () => {
  it('refuses an end below its own start', () => {
    expect(checkReading(995400, { startTenths: 995447 })).toMatchObject({ level: 'error' });
  });

  it('warns on an implausibly long day but still allows it', () => {
    expect(checkReading(1050447, { startTenths: 995447 })).toMatchObject({ level: 'warn' });
  });

  it('warns when a reading is below the last one, since an odometer can be replaced', () => {
    expect(checkReading(1000, { previousTenths: 995447 })).toMatchObject({ level: 'warn' });
  });

  it('passes an ordinary day', () => {
    expect(checkReading(995523, { startTenths: 995447 })).toEqual({ level: 'ok' });
    expect(checkReading(995834, { previousTenths: 995523 })).toEqual({ level: 'ok' });
  });
});
