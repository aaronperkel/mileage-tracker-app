import Link from 'next/link';

/*
 * The gated shell. One rule at the bottom, two destinations, nothing else —
 * a nav bar would be larger than most of what it navigates to.
 */
export default function AppLayout({ children }: LayoutProps<'/'>) {
  return (
    <div
      className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5"
      style={{
        paddingTop: 'max(env(safe-area-inset-top), 0.75rem)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 0.75rem)',
      }}
    >
      {children}
      <footer className="mt-auto flex items-center justify-between border-t border-rule pt-3 text-sm">
        <Link href="/" className="text-ink-soft hover:text-ink">
          Today
        </Link>
        <Link href="/log" className="text-ink-soft hover:text-ink">
          Monthly log
        </Link>
      </footer>
    </div>
  );
}
