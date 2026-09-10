import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CopyColumns } from '@/components/copy-columns';
import { MonthTable } from '@/components/month-table';
import { currentMonth, formatMonthLabel, isMonth, shiftMonth } from '@/lib/date';
import { formatMiles } from '@/lib/odometer';
import { formatDollars } from '@/lib/rate';
import { getMonth } from '@/lib/queries/trips';
import { SHEET_ROW_CAPACITY } from '@/lib/sheet';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps<'/log/[month]'>) {
  const { month } = await params;
  return { title: isMonth(month) ? formatMonthLabel(month) : 'Log' };
}

export default async function MonthPage({ params }: PageProps<'/log/[month]'>) {
  const { month } = await params;
  if (!isMonth(month)) notFound();

  const summary = await getMonth(month);
  const isCurrent = month >= currentMonth();

  return (
    <main className="py-4">
      <header className="flex items-baseline justify-between">
        <h1 className="text-lg font-semibold text-ink">{formatMonthLabel(month)}</h1>
        <nav className="flex items-center gap-3 text-sm">
          <Link href={`/log/${shiftMonth(month, -1)}`} className="text-ink-soft hover:text-ink">
            Earlier
          </Link>
          {isCurrent ? (
            <span className="text-ink-faint">Later</span>
          ) : (
            <Link href={`/log/${shiftMonth(month, 1)}`} className="text-ink-soft hover:text-ink">
              Later
            </Link>
          )}
        </nav>
      </header>

      <dl className="mt-4 mb-5 flex divide-x divide-rule border-y border-rule">
        <Figure label={summary.completeCount === 1 ? 'day' : 'days'} value={String(summary.completeCount)} />
        <Figure label="miles" value={formatMiles(summary.totalMilesTenths)} />
        <Figure label="estimated" value={formatDollars(summary.totalAmount)} />
      </dl>

      {summary.openCount > 0 ? (
        <p className="mb-4 border-l-2 border-warn bg-surface px-3 py-2 text-sm text-warn">
          {summary.openCount === 1
            ? 'One day has no ending reading.'
            : `${summary.openCount} days have no ending reading.`}{' '}
          They still take a row in every column, so the paste stays lined up — but column E will be
          blank for them.
        </p>
      ) : null}

      {summary.overflows ? (
        <p className="mb-4 border-l-2 border-warn bg-surface px-3 py-2 text-sm text-warn">
          {summary.rows.length} days, and the sheet has {SHEET_ROW_CAPACITY} rows. Add rows below 31
          before pasting, or the last {summary.rows.length - SHEET_ROW_CAPACITY} will not fit.
        </p>
      ) : null}

      <MonthTable rows={summary.rows} />
      <CopyColumns rows={summary.rows} />
    </main>
  );
}

/*
 * Three figures on one rule, not a meta string. Each is a different unit and
 * gets compared month to month, so each keeps its own column.
 */
function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 py-3 text-center">
      <dd className="text-xl font-semibold text-ink tnum">{value}</dd>
      <dt className="mt-0.5 text-xs text-ink-soft">{label}</dt>
    </div>
  );
}
