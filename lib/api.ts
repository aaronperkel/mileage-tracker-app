import { NextResponse } from 'next/server';
import type { ZodType } from 'zod';

/*
 * Shared route-handler plumbing. Every response carries no-store: this app is
 * one person looking at a reading they just entered, and a cached odometer is
 * always wrong.
 */

const NO_STORE = { 'cache-control': 'no-store' } as const;

export function jsonOk<T>(body: T, status = 200): NextResponse {
  return NextResponse.json(body, { status, headers: NO_STORE });
}

export function jsonError(error: string, status: number, extra?: Record<string, unknown>): NextResponse {
  return NextResponse.json({ error, ...extra }, { status, headers: NO_STORE });
}

type ParsedBody<T> = { ok: true; data: T } | { ok: false; response: NextResponse };

/** Parse and validate a JSON body, or hand back the 400 to return. */
export async function parseJsonBody<T>(request: Request, schema: ZodType<T>): Promise<ParsedBody<T>> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return { ok: false, response: jsonError('The request body was not valid JSON.', 400) };
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return {
      ok: false,
      response: jsonError(first?.message ?? 'That request was not valid.', 400),
    };
  }

  return { ok: true, data: parsed.data };
}

/**
 * Catches anything a handler throws and returns a 500 rather than an HTML error
 * page, which a fetch() caller cannot do anything useful with.
 */
export async function withErrorHandling(handler: () => Promise<NextResponse>): Promise<NextResponse> {
  try {
    return await handler();
  } catch (error: unknown) {
    console.error('Route handler failed:', error);
    return jsonError('Something went wrong on the server.', 500);
  }
}
