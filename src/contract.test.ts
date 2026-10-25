import { createClient, defineContract, get } from '@usevibejs/contract';
import { describe, expect, it } from 'vitest';
import { ApiResultError, fromApiResult, unwrapApiResult } from './contract.ts';
import { mountQuery, settle } from './test-utils.ts';
import { useQuery } from './useQuery.ts';

const responseSchema = {
  '~standard': {
    version: 1 as const,
    vendor: 'vibequery-test',
    validate: (value: unknown) => ({ value }),
  },
};

const users = defineContract('/users', {
  one: get('/:id', { response: responseSchema }),
});

function json(body: unknown, status = 200, contentType = 'application/json'): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': contentType },
  });
}

describe('contract helpers', () => {
  it('unwraps a successful result and preserves its data type at runtime', async () => {
    const api = createClient(users, {
      baseUrl: 'https://example.test',
      fetch: async () => json({ id: '1', name: 'Ada' }),
    });
    const result = await api.one({ params: { id: 1 } });
    expect(unwrapApiResult(result)).toEqual({ id: '1', name: 'Ada' });
    await expect(fromApiResult(result)).resolves.toEqual({ id: '1', name: 'Ada' });
    const mounted = mountQuery(() =>
      useQuery({
        queryKey: ['user', '1'],
        queryFn: ({ signal }) => fromApiResult(api.one({ params: { id: '1' } }, { signal })),
      }),
    );
    await settle();
    expect(mounted.result.data).toEqual({ id: '1', name: 'Ada' });
    mounted.unmount();
  });

  it('turns HTTP and network failures into query errors', async () => {
    const missing = createClient(users, {
      baseUrl: 'https://example.test',
      fetch: async () =>
        json(
          { title: 'Missing', status: 404, code: 'NOT_FOUND', detail: 'No user' },
          404,
          'application/problem+json',
        ),
    });
    const failed = await missing.one({ params: { id: '9' } });
    expect(failed.ok).toBe(false);
    if (failed.ok) return;
    expect(() => unwrapApiResult(failed)).toThrow(ApiResultError);
    let caught: unknown;
    try {
      unwrapApiResult(failed);
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(ApiResultError);
    const error = caught as ApiResultError;
    expect(error.message).toBe('No user');
    expect(error.code).toBe('NOT_FOUND');
    expect(error.status).toBe(404);
    expect(error.response?.status).toBe(404);
    const titled = createClient(users, {
      baseUrl: 'https://example.test',
      fetch: async () =>
        json(
          { type: 'about:blank', title: 'Missing', status: 404, code: 'NOT_FOUND' },
          404,
          'application/problem+json',
        ),
    });
    const titledResult = await titled.one({ params: { id: '8' } });
    expect(() => unwrapApiResult(titledResult)).toThrow('Missing');
    const offline = createClient(users, {
      baseUrl: 'https://example.test',
      fetch: () => Promise.reject(new TypeError('offline')),
    });
    await expect(fromApiResult(offline.one({ params: { id: '1' } }))).rejects.toMatchObject({
      name: 'ApiResultError',
      code: 'NETWORK_ERROR',
      message: 'offline',
    });
  });
});
