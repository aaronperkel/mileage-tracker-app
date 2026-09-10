import { describe, expect, it } from 'vitest';
import {
  currentMonth,
  formatDayLabel,
  formatExcelDate,
  formatMonthLabel,
  isMonth,
  shiftMonth,
  todayInZone,
} from '@/lib/date';

describe('todayInZone', () => {
  it('files a late Eastern evening under that day, not the UTC tomorrow', () => {
    /* 2026-09-09 20:30 EDT is 2026-09-10 00:30 UTC. */
    expect(todayInZone(new Date('2026-09-10T00:30:00Z'))).toBe('2026-09-09');
  });

  it('does the same across a month boundary', () => {
    expect(todayInZone(new Date('2026-10-01T02:00:00Z'))).toBe('2026-09-30');
    expect(currentMonth(new Date('2026-10-01T02:00:00Z'))).toBe('2026-09');
  });

  it('handles an early-morning Eastern time normally', () => {
    expect(todayInZone(new Date('2026-09-09T13:00:00Z'))).toBe('2026-09-09');
  });
});

describe('labels', () => {
  it('names the right weekday, with no off-by-one from UTC midnight', () => {
    expect(formatDayLabel('2026-09-01')).toBe('Tue, Sep 1');
    expect(formatMonthLabel('2026-09')).toBe('September 2026');
  });

  it('formats the Date column the way US Excel parses it', () => {
    expect(formatExcelDate('2026-09-01')).toBe('9/1/2026');
    expect(formatExcelDate('2026-12-25')).toBe('12/25/2026');
  });
});

describe('shiftMonth', () => {
  it('crosses years in both directions', () => {
    expect(shiftMonth('2026-09', -1)).toBe('2026-08');
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
  });
});

describe('isMonth', () => {
  it('rejects a bad month, which the route uses to 404', () => {
    expect(isMonth('2026-09')).toBe(true);
    expect(isMonth('2026-13')).toBe(false);
    expect(isMonth('2026-9')).toBe(false);
    expect(isMonth('nope')).toBe(false);
  });
});
