'use client';

import { useState, type ReactNode } from 'react';

/*
 * The one confirmation pattern in the app: an inline strip that takes the place
 * of whatever button asked for it. Not a modal — a modal on a phone in a car
 * park is a second screen to find your way out of.
 *
 * Every deletion goes through here, because each one throws away a number that
 * was read off the dial once and cannot be read again. Keep is focused first,
 * so a stray second tap or an Enter lands on the harmless choice.
 */

type Props = {
  message: ReactNode;
  confirmLabel: string;
  /** Resolves to an error to show, or null once it worked. */
  onConfirm: () => Promise<string | null>;
  onCancel: () => void;
  className?: string;
};

export function ConfirmStrip({ message, confirmLabel, onConfirm, onCancel, className = '' }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setBusy(true);
    setError(null);
    const failure = await onConfirm();
    /* On success the parent re-renders without this strip; only a failure stays. */
    if (failure) {
      setError(failure);
      setBusy(false);
    }
  }

  return (
    <div role="group" aria-label={confirmLabel} className={`border-l-2 border-error bg-surface px-3 py-2.5 ${className}`}>
      <p className="text-sm text-ink tnum">{message}</p>
      {error ? <p className="mt-1 text-xs text-error">{error}</p> : null}
      <div className="mt-2.5 flex gap-2">
        <button
          type="button"
          onClick={() => void confirm()}
          disabled={busy}
          className="bg-error px-3 py-2 text-sm font-medium text-ground disabled:bg-rule-strong"
        >
          {busy ? 'Removing' : confirmLabel}
        </button>
        <button
          type="button"
          autoFocus
          onClick={onCancel}
          disabled={busy}
          className="border border-rule bg-surface px-3 py-2 text-sm text-ink"
        >
          Keep
        </button>
      </div>
    </div>
  );
}
