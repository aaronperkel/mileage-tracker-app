import { describe, expect, it } from 'vitest';
import { amountFor, rateFor } from '@/lib/rate';

/*
 * These assert against column H of the submitted workbooks. If UVM publishes a
 * new rate, add the threshold here and the sheet updates itself on paste.
 */

describe('rateFor', () => {
  it('matches every boundary in the sheet formula', () => {
    const cases: Array<[string, number]> = [
      ['2026-09-09', 0.76],
      ['2026-07-01', 0.76],
      ['2026-06-30', 0.725],
      ['2026-01-01', 0.725],
      ['2025-12-31', 0.7],
      ['2025-01-01', 0.7],
      ['2024-12-31', 0.67],
      ['2024-01-01', 0.67],
      ['2023-12-31', 0.655],
      ['2023-01-01', 0.655],
      ['2022-12-31', 0.625],
      ['2022-07-01', 0.625],
      ['2022-06-30', 0.585],
      ['2022-01-01', 0.585],
    ];
    for (const [date, rate] of cases) {
      expect(rateFor(date), date).toBe(rate);
    }
  });

  it('falls back the way the sheet does for a date before the table', () => {
    expect(rateFor('2021-12-31')).toBe(0.67);
  });
});

describe('amountFor', () => {
  it('agrees with the workbook rows', () => {
    /* AUG.xlsx row 7: 9.3 miles on 2026-08-03 -> H7 = 7.068. */
    expect(amountFor('2026-08-03', 9.3)).toBe(7.07);
    /* SEP.xlsx row 8: 13.5 miles on 2026-09-02 -> H8 = 10.26. */
    expect(amountFor('2026-09-02', 13.5)).toBe(10.26);
  });

  it('applies the older rate to a June day', () => {
    expect(amountFor('2026-06-08', 4.7)).toBe(3.41);
  });
});
