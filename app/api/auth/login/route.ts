import { z } from 'zod';
import { jsonError, jsonOk, parseJsonBody, withErrorHandling } from '@/lib/api';
import { passwordMatches } from '@/lib/password';
import { SESSION_COOKIE, createSessionToken, sessionCookieOptions } from '@/lib/session';

const loginSchema = z.object({ password: z.string().min(1, 'Enter the password.') });

export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const body = await parseJsonBody(request, loginSchema);
    if (!body.ok) return body.response;

    if (!passwordMatches(body.data.password)) {
      return jsonError('That password is not right.', 401);
    }

    const response = jsonOk({ ok: true });
    response.cookies.set(SESSION_COOKIE, await createSessionToken(), sessionCookieOptions());
    return response;
  });
}
