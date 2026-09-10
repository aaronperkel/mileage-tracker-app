import { describe, expect, it } from 'vitest';
import { summarise, toColumns } from '@/lib/sheet';
import type { Trip } from '@/db/schema';

function trip(date: string, startTenths: number, endTenths: number | null): Trip {
  return {
    id: date,
    date,
    startTenths,
    endTenths,
    createdAt: '',
    updatedAt: '',
  };
}

/* The first six rows of SEP.xlsx, which is the sheet this was built against. */
const september = [
  trip('2026-09-01', 995447, 995523),
  trip('2026-09-02', 995834, 995969),
  trip('2026-09-03', 996231, 996406),
  trip('2026-09-04', 996794, 996933),
  trip('2026-09-08', 999332, 999510),
  trip('2026-09-09', 999646, 999801),
];

describe('summarise', () => {
  it('reproduces the totals the sheet computes', () => {
    const summary = summarise('2026-09', september);
    expect(summary.completeCount).toBe(6);
    expect(summary.totalMilesTenths).toBe(858); // F33, without the float drift
    expect(summary.totalAmount).toBe(65.21); // H33 reads 65.208000000013271
  });

  it('matches H33 on the two complete months, which per-row rounding does not', () => {
    /*
     * The sheet rounds only where it displays the total. Rounding each day to
     * the cent first lands a cent high on August and three cents high on June.
     */
    const june = summarise('2026-06', [trip('2026-06-01', 0, 1733)]); // 173.3 mi at 0.725
    expect(june.totalAmount).toBe(125.64); // H33 reads 125.64250000004432

    const august = summarise('2026-08', [trip('2026-08-03', 0, 2262)]); // 226.2 mi at 0.76
    expect(august.totalAmount).toBe(171.91); // H33 reads 171.91200000001993
  });

  it('counts an open day without letting it contribute miles', () => {
    const summary = summarise('2026-09', [...september, trip('2026-09-10', 999950, null)]);
    expect(summary.openCount).toBe(1);
    expect(summary.completeCount).toBe(6);
    expect(summary.totalMilesTenths).toBe(858);
  });

  it('flags a month too long for rows 7-31', () => {
    const rows = Array.from({ length: 26 }, (_, i) =>
      trip(`2026-03-${String(i + 1).padStart(2, '0')}`, 100000 + i * 100, 100050 + i * 100),
    );
    expect(summarise('2026-03', rows).overflows).toBe(true);
    expect(summarise('2026-03', rows.slice(0, 25)).overflows).toBe(false);
  });

  it('applies each row rate across a rate change', () => {
    /* 1 July 2026 moved 0.725 -> 0.76. A month spanning it has both. */
    const summary = summarise('2026-06', [
      trip('2026-06-30', 100000, 100100), // 10.0 mi at 0.725 = 7.25
      trip('2026-07-01', 100200, 100300), // 10.0 mi at 0.76  = 7.60
    ]);
    expect(summary.totalAmount).toBe(14.85);
  });
});

describe('toColumns', () => {
  it('emits ungrouped readings and M/D/YYYY dates', () => {
    const { date, start, end } = toColumns(summarise('2026-09', september.slice(0, 2)).rows);
    expect(date).toBe('9/1/2026\n9/2/2026');
    expect(start).toBe('99544.7\n99583.4');
    expect(end).toBe('99552.3\n99596.9');
  });

  it('keeps all three columns the same length when a day is still open', () => {
    /*
     * The alignment invariant. Dropping the open day would shift every reading
     * below it onto the wrong date — a sheet that is wrong and looks right.
     */
    const rows = summarise('2026-09', [
      trip('2026-09-01', 995447, 995523),
      trip('2026-09-02', 995834, null),
      trip('2026-09-03', 996231, 996406),
    ]).rows;

    const columns = toColumns(rows);
    const lengths = Object.values(columns).map((column) => column.split('\n').length);
    expect(lengths).toEqual([3, 3, 3]);
    expect(columns.end).toBe('99552.3\n\n99640.6');
  });
});
