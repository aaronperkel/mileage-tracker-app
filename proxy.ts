import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/session';

/*
 * The password gate. Next 16 renamed middleware.ts to proxy.ts; same job.
 *
 * Deny by default, with one hole — the login screen and its API, or nobody can
 * get in. Unlike ../vermont-plate-log there is nothing here worth sharing, so
 * there is no public page and no exception list to keep honest.
 */

const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/logout'];

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.includes(pathname)) return NextResponse.next();

  if (await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.next();
  }

  /*
   * A fetch() caller cannot follow a redirect to an HTML login page usefully,
   * so the API gets a status it can branch on and pages get the redirect.
   */
  if (pathname.startsWith('/api/')) {
    return NextResponse.json(
      { error: 'Sign in first.' },
      { status: 401, headers: { 'cache-control': 'no-store' } },
    );
  }

  const url = new URL('/login', request.url);
  const target = `${pathname}${request.nextUrl.search}`;
  if (target && target !== '/') url.searchParams.set('next', target);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|ttf|woff2)$).*)',
  ],
};
