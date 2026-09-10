'use client';

import { useState } from 'react';
import { PASTE_TARGETS, toColumns, type MonthRow } from '@/lib/sheet';

/*
 * The month, on the clipboard, one column at a time.
 *
 * Three buttons rather than one because the columns the sheet wants are not
 * adjacent: Date is A, Starting Mileage is C, Ending Mileage is E, and B and D
 * hold Origin and Destination on every row. A single wide paste at A7 would
 * write a reading into Origin and flatten the Total Miles formula in F.
 */

type Props = { rows: MonthRow[] };

const COLUMNS = [
  { key: 'date', label: 'Dates' },
  { key: 'start', label: 'Starting' },
  { key: 'end', label: 'Ending' },
] as const;

export function CopyColumns({ rows }: Props) {
  const [copied, setCopied] = useState<string | null>(null);
  const columns = toColumns(rows);

  async function copy(key: (typeof COLUMNS)[number]['key']) {
    try {
      await navigator.clipboard.writeText(columns[key]);
      setCopied(key);
      window.setTimeout(() => setCopied((current) => (current === key ? null : current)), 2000);
    } catch {
      setCopied('failed');
    }
  }

  if (rows.length === 0) return null;

  return (
    <div className="mt-6">
      <div className="grid grid-cols-3 gap-px bg-rule">
        {COLUMNS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => void copy(key)}
            className="bg-surface px-2 py-3 text-center transition-colors hover:bg-ground"
          >
            <span className="block text-sm font-medium text-ink">
              {copied === key ? 'Copied' : label}
            </span>
            <span className="mt-0.5 block text-xs text-ink-faint tnum">
              paste at {PASTE_TARGETS[key]}
            </span>
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-ink-faint">
        {copied === 'failed'
          ? 'The clipboard is blocked here. Select the table above and copy it instead.'
          : 'Leave columns F and H alone — they are the formulas that total the sheet.'}
      </p>
    </div>
  );
}
