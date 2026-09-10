import { getDb, trips } from '@/db';
import { jsonError, jsonOk, parseJsonBody, withErrorHandling } from '@/lib/api';
import { tripStartSchema } from '@/lib/validation';

/*
 * Arriving at work: opens the day.
 *
 * Upserts on the date rather than inserting. Arriving twice in one day means
 * the first reading was wrong — a mis-keyed digit noticed on the walk in — so
 * the second one replaces it. A second row would be rejected by the unique
 * index anyway, and "that day already exists" is not a useful thing to tell
 * somebody standing in a car park.
 */
export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const parsed = await parseJsonBody(request, tripStartSchema);
    if (!parsed.ok) return parsed.response;

    const { date, startTenths } = parsed.data;

    const [row] = await getDb()
      .insert(trips)
      .values({ date, startTenths })
      .onConflictDoUpdate({
        target: trips.date,
        set: { startTenths, updatedAt: new Date().toISOString() },
      })
      .returning();

    if (!row) return jsonError('That reading did not save.', 500);
    return jsonOk({ trip: row }, 201);
  });
}
