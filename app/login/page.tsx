import { redirect } from 'next/navigation';
import { isSignedIn } from '@/lib/auth';
import { LoginForm } from './login-form';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Sign in' };

/** Refuses anything that is not a same-site path, so ?next= cannot bounce off-site. */
function safeNext(next: string | undefined): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) return '/';
  return next;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  if (await isSignedIn()) redirect(safeNext(next));

  return (
    <div
      className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-5"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <h1 className="text-xl font-semibold text-ink">Mileage</h1>
      <p className="mt-1 text-sm text-ink-soft">Odometer in, odometer out.</p>
      <LoginForm next={safeNext(next)} />
    </div>
  );
}
