import { eq } from 'drizzle-orm';
import { getDb, trips } from '@/db';
import { jsonError, jsonOk, parseJsonBody, withErrorHandling } from '@/lib/api';
import { isIsoDate } from '@/lib/date';
import { tripUpdateSchema } from '@/lib/validation';

/*
 * Leaving work, and every correction afterwards.
 *
 * PATCH carries whichever readings changed. `endTenths: null` reopens a day —
 * the way back out of having closed it on a wrong number.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ date: string }> }) {
  return withErrorHandling(async () => {
    const { date } = await params;
    if (!isIsoDate(date)) return jsonError('That is not a date.', 400);

    const parsed = await parseJsonBody(request, tripUpdateSchema);
    if (!parsed.ok) return parsed.response;

    const { startTenths, endTenths } = parsed.data;
    const existing = await getDb().select().from(trips).where(eq(trips.date, date)).limit(1);
    const current = existing[0];
    if (!current) return jsonError('No reading for that day yet.', 404);

    /*
     * Checked here as well as in the browser: the form can only refuse what it
     * can see, and a correction may move the start above an end saved hours ago.
     */
    const start = startTenths ?? current.startTenths;
    const end = endTenths === undefined ? current.endTenths : endTenths;
    if (end !== null && end < start) {
      return jsonError('The ending reading is below the starting one.', 400);
    }

    const [row] = await getDb()
      .update(trips)
      .set({
        ...(startTenths === undefined ? {} : { startTenths }),
        ...(endTenths === undefined ? {} : { endTenths }),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(trips.date, date))
      .returning();

    return jsonOk({ trip: row });
  });
}

/** Removing a day logged by mistake — a day off keyed in as a workday. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ date: string }> }) {
  return withErrorHandling(async () => {
    const { date } = await params;
    if (!isIsoDate(date)) return jsonError('That is not a date.', 400);

    const [row] = await getDb().delete(trips).where(eq(trips.date, date)).returning();
    if (!row) return jsonError('No reading for that day.', 404);
    return jsonOk({ deleted: date });
  });
}
