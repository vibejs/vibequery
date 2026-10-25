import { describe, expect, it } from 'vitest';
import { useQueryDevtools } from './devtools.ts';
import { mountQuery, settle } from './test-utils.ts';
import { useMutation } from './useMutation.ts';
import { useQuery } from './useQuery.ts';

describe('useQueryDevtools', () => {
  it('tracks queries, mutations, and a bounded event log', async () => {
    const mounted = mountQuery(() => {
      const devtools = useQueryDevtools();
      const query = useQuery({
        queryKey: ['row'],
        queryFn: async () => ({ n: 1 }),
      });
      const failed = useQuery({
        queryKey: ['bad'],
        retry: false,
        queryFn: () => {
          throw 'boom';
        },
      });
      const mutation = useMutation({
        mutationKey: ['save'],
        mutationFn: async () => {
          throw new Error('nope');
        },
      });
      return { devtools, query, failed, mutation };
    });
    await settle();
    await expect(mounted.result.mutation.mutateAsync(undefined)).rejects.toThrow('nope');
    await settle();
    const queries = mounted.result.devtools.queries;
    expect(queries.map((query) => query.status).sort()).toEqual(['error', 'success']);
    expect(queries.find((query) => query.status === 'success')).toMatchObject({
      fetchStatus: 'idle',
      isStale: true,
      observers: 1,
      error: null,
      data: { n: 1 },
    });
    expect(queries.find((query) => query.status === 'error')?.error).toBe('boom');
    expect(mounted.result.devtools.mutations).toMatchObject([
      { status: 'error', error: 'nope', isPaused: false, mutationKey: ['save'] },
    ]);
    expect(mounted.result.devtools.events.some((event) => event.action !== '')).toBe(true);
    expect(mounted.result.devtools.events.some((event) => event.detail !== '')).toBe(true);
    for (let index = 0; index < 60; index += 1) mounted.client.setQueryData(['row'], { n: index });
    expect(mounted.result.devtools.events).toHaveLength(50);
    mounted.result.devtools.clearEvents();
    expect(mounted.result.devtools.events).toEqual([]);
    const retained = mounted.result.devtools;
    mounted.unmount();
    mounted.client.setQueryData(['row'], { n: 99 });
    expect(retained.events).toEqual([]);
  });

  it('throws outside a scope', () => {
    expect(() => useQueryDevtools()).toThrow(/effect scope/);
  });
});
