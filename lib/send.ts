/*
 * A mutation from the browser to app/api/*.
 *
 * Resolves to the API's own error message, or null when it worked — so a
 * caller can show exactly what the server refused instead of assuming success.
 * Never throws: a phone in a car park drops its connection, and that has to
 * read as "nothing changed" rather than an unhandled rejection.
 */
export async function send(
  url: string,
  method: 'POST' | 'PATCH' | 'DELETE',
  body?: unknown,
): Promise<string | null> {
  let response: Response;
  try {
    response = await fetch(
      url,
      body === undefined
        ? { method }
        : { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) },
    );
  } catch {
    return 'Could not reach the server. Nothing changed.';
  }

  if (response.ok) return null;
  const payload: unknown = await response.json().catch(() => null);
  const error = (payload as { error?: unknown } | null)?.error;
  return typeof error === 'string' ? error : 'That did not go through.';
}
