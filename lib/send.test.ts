import { afterEach, describe, expect, it, vi } from 'vitest';
import { send } from '@/lib/send';

afterEach(() => vi.unstubAllGlobals());

function stubFetch(impl: () => Promise<Response>) {
  const fetch = vi.fn(impl);
  vi.stubGlobal('fetch', fetch);
  return fetch;
}

describe('send', () => {
  it('resolves to null when the API accepts it', async () => {
    stubFetch(async () => Response.json({ deleted: '2026-11-09' }));
    await expect(send('/api/trips/2026-11-09', 'DELETE')).resolves.toBeNull();
  });

  it('sends no body or content type for a bare DELETE', async () => {
    const fetch = stubFetch(async () => Response.json({}));
    await send('/api/trips/2026-11-09', 'DELETE');
    expect(fetch).toHaveBeenCalledWith('/api/trips/2026-11-09', { method: 'DELETE' });
  });

  it('serialises a body as JSON', async () => {
    const fetch = stubFetch(async () => Response.json({}));
    await send('/api/trips/2026-11-09', 'PATCH', { endTenths: null });
    expect(fetch).toHaveBeenCalledWith('/api/trips/2026-11-09', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: '{"endTenths":null}',
    });
  });

  it("passes on the API's own error message", async () => {
    stubFetch(async () => Response.json({ error: 'No reading for that day.' }, { status: 404 }));
    await expect(send('/api/trips/2026-11-09', 'DELETE')).resolves.toBe('No reading for that day.');
  });

  it('falls back when the error body is not JSON', async () => {
    stubFetch(async () => new Response('<html>', { status: 502 }));
    await expect(send('/api/trips/2026-11-09', 'DELETE')).resolves.toBe('That did not go through.');
  });

  it('reports a dropped connection instead of throwing', async () => {
    stubFetch(async () => {
      throw new TypeError('Failed to fetch');
    });
    await expect(send('/api/trips/2026-11-09', 'DELETE')).resolves.toBe(
      'Could not reach the server. Nothing changed.',
    );
  });
});
