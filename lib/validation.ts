import { z } from 'zod';
import { isIsoDate } from '@/lib/date';
import { parseTenths } from '@/lib/odometer';

/*
 * The reading rules live in lib/odometer.ts, not in a Zod refinement, so the
 * browser and the server enforce exactly the same thing — and the error the API
 * returns is the one the form was already showing as you typed.
 */

/** Accepts what the field accepts ('99,544.7', ' 99544.7 ') and stores tenths. */
const reading = z
  .string()
  .transform((raw) => parseTenths(raw))
  .refine((tenths): tenths is number => tenths !== null, {
    message: 'Enter the odometer reading, like 99544.7.',
  });

const isoDate = z.string().refine(isIsoDate, 'Use a date like 2026-09-09.');

/** Arriving at work: opens the day. */
export const tripStartSchema = z.object({
  date: isoDate,
  startTenths: reading,
});

/** Leaving, or correcting either reading afterwards. */
export const tripUpdateSchema = z
  .object({
    startTenths: reading.optional(),
    endTenths: reading.nullable().optional(),
  })
  .refine((body) => body.startTenths !== undefined || body.endTenths !== undefined, {
    message: 'Nothing to change.',
  });

export type TripStart = z.infer<typeof tripStartSchema>;
export type TripUpdate = z.infer<typeof tripUpdateSchema>;
