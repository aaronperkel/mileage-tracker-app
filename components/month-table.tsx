'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDayLabel } from '@/lib/date';
import { checkReading, formatMiles, formatOdometer, parseTenths } from '@/lib/odometer';
import type { MonthRow } from '@/lib/sheet';

/*
 * The month as it will reach the sheet: one row per day, in the order the rows
 * get pasted. Tapping a day opens the two readings for correction, which is the
 * only editing this app needs — everything else is done from the field on the
 * home screen.
 */

export function MonthTable({ rows }: { rows: MonthRow[] }) {
  const [editing, setEditing] = useState<string | null>(null);

  if (rows.length === 0) {
    return (
      <p className="border-t border-rule py-8 text-center text-sm text-ink-soft">
        No readings this month yet.
      </p>
    );
  }

  return (
    <ol className="border-t border-rule">
      {rows.map((row) =>
        editing === row.date ? (
          <li key={row.date} className="border-b border-rule py-3">
            <EditRow row={row} onDone={() => setEditing(null)} />
          </li>
        ) : (
          <li key={row.date} className="border-b border-rule">
            <button
              type="button"
              onClick={() => setEditing(row.date)}
              className="flex w-full items-baseline gap-3 py-2.5 text-left hover:bg-surface"
            >
              <span className="w-20 shrink-0 text-sm text-ink-soft">{formatDayLabel(row.date)}</span>
              <span className="flex-1 text-sm text-ink tnum">
                {formatOdometer(row.startTenths)}
                <span className="text-ink-faint"> to </span>
                {row.endTenths == null ? (
                  <span className="text-warn">still out</span>
                ) : (
                  formatOdometer(row.endTenths)
                )}
              </span>
              <span className="w-14 shrink-0 text-right text-sm font-medium text-ink tnum">
                {row.milesTenths == null ? '—' : formatMiles(row.milesTenths)}
              </span>
            </button>
          </li>
        ),
      )}
    </ol>
  );
}

function EditRow({ row, onDone }: { row: MonthRow; onDone: () => void }) {
  const router = useRouter();
  const [start, setStart] = useState(String(row.startTenths / 10));
  const [end, setEnd] = useState(row.endTenths == null ? '' : String(row.endTenths / 10));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startTenths = parseTenths(start);
  const endTenths = end.trim() === '' ? null : parseTenths(end);
  const malformed = startTenths === null || (end.trim() !== '' && endTenths === null);
  const check =
    startTenths !== null && endTenths !== null
      ? checkReading(endTenths, { startTenths })
      : { level: 'ok' as const };

  async function save() {
    if (malformed || check.level === 'error') return;
    setBusy(true);
    setError(null);

    const response = await fetch(`/api/trips/${row.date}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ startTenths: start, endTenths: end.trim() === '' ? null : end }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error ?? 'That did not save.');
      setBusy(false);
      return;
    }
    onDone();
    router.refresh();
  }

  async function remove() {
    setBusy(true);
    await fetch(`/api/trips/${row.date}`, { method: 'DELETE' });
    onDone();
    router.refresh();
  }

  return (
    <div>
      <p className="text-sm font-medium text-ink">{formatDayLabel(row.date)}</p>
      <div className="mt-2 flex gap-2">
        <Reading label="Starting" value={start} onChange={setStart} />
        <Reading label="Ending" value={end} onChange={setEnd} placeholder="still out" />
      </div>

      {error || check.level === 'error' ? (
        <p className="mt-2 text-xs text-error">
          {error ?? (check.level === 'error' ? check.message : null)}
        </p>
      ) : null}

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => void save()}
          disabled={busy || malformed || check.level === 'error'}
          className="bg-ink px-3 py-2 text-sm font-medium text-ground disabled:bg-rule-strong"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onDone}
          className="border border-rule bg-surface px-3 py-2 text-sm text-ink"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => void remove()}
          disabled={busy}
          className="ml-auto text-sm text-ink-faint hover:text-error"
        >
          Delete day
        </button>
      </div>
    </div>
  );
}

function Reading({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="flex-1 border border-rule bg-surface px-2 py-1.5 focus-within:border-rule-strong">
      <span className="block text-xs text-ink-soft">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        inputMode="decimal"
        placeholder={placeholder}
        className="w-full bg-transparent text-base text-ink outline-none tnum placeholder:text-ink-faint"
      />
    </label>
  );
}
