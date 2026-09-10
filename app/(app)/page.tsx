import { OdometerForm } from '@/components/odometer-form';
import { formatLongDate, todayInZone } from '@/lib/date';
import { getPreviousReading, getTripByDate } from '@/lib/queries/trips';

/* Today's reading is the whole point; it can never come from a cache. */
export const dynamic = 'force-dynamic';

export default async function TodayPage() {
  const date = todayInZone();
  const trip = await getTripByDate(date);

  /*
   * The hint reads from the day before, not from today — once today's start is
   * in, "last reading" means the number this morning replaced.
   */
  const previous = await getPreviousReading(trip ? previousDay(date) : date);

  return (
    <main className="flex flex-1 flex-col justify-center py-10">
      <p className="mb-8 text-center text-sm text-ink-soft">{formatLongDate(date)}</p>
      <OdometerForm date={date} trip={trip} previous={previous} />
    </main>
  );
}

function previousDay(date: string): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}
