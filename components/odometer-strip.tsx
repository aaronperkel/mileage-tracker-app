import { digitsOf } from '@/lib/odometer';

/*
 * The reading, drawn as the drums it came off.
 *
 * This is the app's one piece of colour and its only object. The gradient on
 * each drum is doing real work — it is the curve of a wheel catching light at
 * the top and rolling into shadow at the bottom, which is what separates a
 * stack of digits from an instrument. The tenths drum is brick, the way the
 * tenths wheel on a mechanical trip meter is a contrasting drum.
 *
 * Sized for six digits and a tenth from the start: this odometer reads 99,980.1
 * and crosses 100,000 within days, and a strip that assumed five would have had
 * to reflow on exactly the drive that mattered.
 */

/** Whole-mile drums. Seven slots in total, counting the tenth. */
const WIDTH = 6;

type Props = {
  /** A stored reading, in tenths. Pads to six whole digits, zeros and all. */
  tenths?: number | null;
  /**
   * Digits as typed, filled from the right. Unreached drums stay blank rather
   * than showing a zero, so a half-entered number is visibly half-entered.
   */
  digits?: string;
  size?: 'lg' | 'sm';
};

function slots({ tenths, digits }: Pick<Props, 'tenths' | 'digits'>): string[] {
  if (digits !== undefined) {
    return [...digits.padStart(WIDTH + 1, ' ')].map((c) => (c === ' ' ? '' : c));
  }
  if (tenths == null) return Array(WIDTH + 1).fill('');
  const { whole, tenth } = digitsOf(tenths, WIDTH);
  return [...whole, tenth];
}

export function OdometerStrip({ tenths, digits, size = 'lg' }: Props) {
  const cells = slots({ tenths, digits });

  const drum =
    size === 'lg'
      ? 'h-[3.25rem] w-8 text-[1.85rem] sm:h-16 sm:w-10 sm:text-[2.3rem]'
      : 'h-7 w-[1.15rem] text-base';

  return (
    <div
      className="flex items-stretch gap-px rounded-[3px] bg-drum-shadow p-px"
      aria-hidden="true"
    >
      {cells.map((digit, index) => (
        <Drum key={index} className={drum} tenth={index === WIDTH}>
          {digit}
        </Drum>
      ))}
    </div>
  );
}

function Drum({
  children,
  className,
  tenth = false,
}: {
  children: string;
  className: string;
  tenth?: boolean;
}) {
  return (
    <span
      className={`flex items-center justify-center overflow-hidden font-drum font-semibold tabular-nums leading-none text-drum-ink ${className}`}
      style={{
        background: tenth
          ? 'linear-gradient(180deg, color-mix(in srgb, var(--tenth-drum) 78%, white) 0%, var(--tenth-drum) 44%, color-mix(in srgb, var(--tenth-drum) 74%, black) 100%)'
          : 'linear-gradient(180deg, var(--drum-edge) 0%, var(--drum) 44%, var(--drum-shadow) 100%)',
      }}
    >
      {children}
    </span>
  );
}
