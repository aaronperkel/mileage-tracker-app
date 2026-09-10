import { SignJWT, jwtVerify } from 'jose';
import { env } from '@/lib/env';

/*
 * Session handling, kept free of `next/headers` so proxy.ts can use it too.
 * lib/auth.ts is the cookie-jar-flavoured wrapper for server components.
 */

export const SESSION_COOKIE = 'mileage_session';

/*
 * Six months, not the thirty days a shared app would take.
 *
 * This one is opened twice a working day, one-handed, usually in a parking lot,
 * and the entire point is that nothing stands between the app opening and the
 * number going in. A login screen every month is exactly the friction that
 * stops the log getting kept.
 */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 180;

const ALGORITHM = 'HS256';

function signingKey(): Uint8Array {
  return new TextEncoder().encode(env.authSecret);
}

export async function createSessionToken(): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: ALGORITHM })
    .setSubject('owner')
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(signingKey());
}

/** Never throws — an absent, malformed or expired token is simply "not signed in". */
export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  try {
    await jwtVerify(token, signingKey(), { algorithms: [ALGORITHM] });
    return true;
  } catch {
    return false;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}
