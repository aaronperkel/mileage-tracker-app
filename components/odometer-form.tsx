'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ConfirmStrip } from '@/components/confirm-strip';
import { OdometerStrip } from '@/components/odometer-strip';
import { checkReading, formatMiles, formatOdometer } from '@/lib/odometer';
import { formatDayLabel } from '@/lib/date';
import { send } from '@/lib/send';

/*
 * The screen that gets used standing next to a car, one-handed, twice a day.
 * Everything else here can be a page; this has to be a tool.
 *
 * Entry is digits only, filled from the right, so the last key pressed is
 * always the tenth of a mile — 999801 reads 99,980.1 and 1000124 reads
 * 100,012.4 without anyone counting places or hunting for a decimal point on a
 * numeric keypad. Pasting or typing '99980.1' works too: the punctuation is
 * stripped and lands on the same digits.
 *
 * The input itself is transparent and sits over the drums. It is a real input —
 * focusable, labelled, typeable — so the keyboard, autofill and accessibility
 * all behave; the strip is just what it looks like.
 */

type Trip = { date: string; startTenths: number; endTenths: number | null };
type Previous = { date: string; tenths: number } | null;

type Props = {
  date: string;
  trip: Trip | null;
  previous: Previous;
};

const MAX_DIGITS = 7; // six whole miles and a tenth

export function OdometerForm({ date, trip, previous }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [digits, setDigits] = useState('');
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [undoing, setUndoing] = useState(false);

  /* Leaving is the second reading of the day; arriving is the first. */
  const leaving = trip !== null && trip.endTenths === null;
  const done = trip !== null && trip.endTenths !== null;

  const tenths = digits ? Number(digits) : null;
  const check =
    tenths === null
      ? { level: 'ok' as const }
      : checkReading(tenths, {
          startTenths: leaving ? trip.startTenths : null,
          previousTenths: previous?.tenths ?? null,
        });

  const blocked = check.level === 'error';
  const ready = tenths !== null && !blocked && !saving;

  async function save() {
    if (!ready) return;
    setSaving(true);
    setFailure(null);

    const response = leaving
      ? await fetch(`/api/trips/${date}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ endTenths: String(tenths / 10) }),
        })
      : await fetch('/api/trips', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ date, startTenths: String(tenths / 10) }),
        });

    if (!response.ok) {
      const body = await response.json().catch(() => ({ error: 'That did not save.' }));
      setFailure(body.error ?? 'That did not save.');
      setSaving(false);
      return;
    }

    setDigits('');
    setSaving(false);
    router.refresh();
  }

  /*
   * Taking back this morning's arrival — tapped on a day off, or on the wrong
   * number. Deleting the row puts the screen back to waiting for an arrival.
   */
  async function undoArrival(): Promise<string | null> {
    const error = await send(`/api/trips/${date}`, 'DELETE');
    if (error) return error;
    setUndoing(false);
    setDigits('');
    router.refresh();
    return null;
  }

  if (done) {
    return (
      <DayDone
        trip={trip}
        onCorrect={() => router.push(`/log/${date.slice(0, 7)}`)}
        onUndo={async () => {
          const error = await send(`/api/trips/${date}`, 'PATCH', { endTenths: null });
          if (error) return error;
          router.refresh();
          return null;
        }}
      />
    );
  }

  return (
    <form
      className="flex flex-col items-center"
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      {/*
        The input covers the drums exactly, so tapping anywhere on the odometer
        puts the keyboard up. It must stay inside this relative wrapper — left
        to the form, `absolute` would resolve against the page and the real hit
        area would sit somewhere else entirely.
      */}
      <div className="relative rounded-[3px] focus-within:outline-2 focus-within:outline-offset-4 focus-within:outline-ink">
        <OdometerStrip digits={digits} />
        <input
          ref={inputRef}
          autoFocus
          value={digits}
          onChange={(event) => setDigits(event.target.value.replace(/\D/g, '').slice(0, MAX_DIGITS))}
          inputMode="numeric"
          enterKeyHint="done"
          autoComplete="off"
          aria-label={leaving ? 'Odometer now, leaving work' : 'Odometer now, arriving at work'}
          aria-describedby="reading-hint"
          /*
           * Transparent rather than hidden: display:none or a zero-size box
           * loses the caret on iOS and stops the keyboard opening on focus.
           * 16px is what keeps Safari from zooming the page on that focus.
           */
          className="absolute inset-0 h-full w-full cursor-pointer bg-transparent text-[16px] text-transparent caret-transparent opacity-0 outline-none"
        />
      </div>

      <p id="reading-hint" className="mt-3 min-h-5 text-center text-sm">
        <Hint check={check} digits={digits} leaving={leaving} trip={trip} previous={previous} />
      </p>

      <button
        type="submit"
        disabled={!ready}
        className="mt-6 w-full max-w-xs bg-ink py-3.5 text-base font-medium text-ground transition-colors disabled:bg-rule-strong disabled:text-ground"
      >
        {saving ? 'Saving' : leaving ? 'Leaving work' : 'Arrived at work'}
      </button>

      {failure ? <p className="mt-3 text-sm text-error">{failure}</p> : null}

      {leaving && trip ? (
        undoing ? (
          <ConfirmStrip
            className="mt-6 w-full max-w-xs"
            message={`Remove this morning's arrival at ${formatOdometer(trip.startTenths)}?`}
            confirmLabel="Remove"
            onConfirm={undoArrival}
            onCancel={() => setUndoing(false)}
          />
        ) : (
          <button
            type="button"
            onClick={() => setUndoing(true)}
            className="mt-6 text-sm text-ink-soft hover:text-error"
          >
            Undo arrival
          </button>
        )
      ) : null}
    </form>
  );
}

function Hint({
  check,
  digits,
  leaving,
  trip,
  previous,
}: {
  check: ReturnType<typeof checkReading>;
  digits: string;
  leaving: boolean;
  trip: Trip | null;
  previous: Previous;
}) {
  if (check.level === 'error') return <span className="text-error">{check.message}</span>;
  if (check.level === 'warn') return <span className="text-warn">{check.message}</span>;

  /* Once the reading is plausible, show what it will be worth. */
  if (digits && leaving && trip) {
    return (
      <span className="text-ink-soft tnum">
        {formatMiles(Number(digits) - trip.startTenths)} miles today
      </span>
    );
  }
  if (leaving && trip) {
    return (
      <span className="text-ink-soft tnum">
        Arrived at {formatOdometer(trip.startTenths)}
      </span>
    );
  }
  if (previous) {
    return (
      <span className="text-ink-faint tnum">
        Last reading {formatOdometer(previous.tenths)}, {formatDayLabel(previous.date)}
      </span>
    );
  }
  return <span className="text-ink-faint">Type the odometer, tenths and all</span>;
}

/*
 * Both readings in. The day is closed; what is left is a correction, or taking
 * back the ending reading — keyed in the car park before actually leaving.
 */
function DayDone({
  trip,
  onCorrect,
  onUndo,
}: {
  trip: Trip;
  onCorrect: () => void;
  onUndo: () => Promise<string | null>;
}) {
  const [undoing, setUndoing] = useState(false);
  const miles = (trip.endTenths ?? 0) - trip.startTenths;
  return (
    <div className="flex flex-col items-center">
      <OdometerStrip tenths={trip.endTenths} />
      <p className="mt-4 text-2xl font-semibold text-ink tnum">{formatMiles(miles)} miles today</p>
      <p className="mt-1 text-sm text-ink-soft tnum">
        {formatOdometer(trip.startTenths)} to {formatOdometer(trip.endTenths ?? 0)}
      </p>
      {undoing ? (
        <ConfirmStrip
          className="mt-6 w-full max-w-xs"
          message={`Remove today's ending reading, ${formatOdometer(trip.endTenths ?? 0)}? The day reopens.`}
          confirmLabel="Remove"
          onConfirm={onUndo}
          onCancel={() => setUndoing(false)}
        />
      ) : (
        <div className="mt-6 flex items-center gap-4">
          <button
            type="button"
            onClick={onCorrect}
            className="border border-rule bg-surface px-4 py-2.5 text-sm font-medium text-ink hover:border-rule-strong"
          >
            Correct today
          </button>
          <button
            type="button"
            onClick={() => setUndoing(true)}
            className="text-sm text-ink-soft hover:text-error"
          >
            Undo leaving
          </button>
        </div>
      )}
    </div>
  );
}
