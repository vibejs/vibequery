import { ref } from '@usevibejs/ui';
import { describe, expect, it } from 'vitest';
import { expectSetupError, mountQuery, settle } from './test-utils.ts';
import { useQueries } from './useQueries.ts';

describe('useQueries', () => {
  it('runs queries in parallel, combines them, and replaces observers when the list changes', async () => {
    const includeSecond = ref(true);
    const id = ref(1);
    let calls = 0;
    const mounted = mountQuery(() =>
      useQueries(() => ({
        queries: [
          {
            queryKey: ['one', id.value],
            queryFn: async () => {
              calls += 1;
              return id.value;
            },
            staleTime: Infinity,
          },
          ...(includeSecond.value
            ? [
                {
                  queryKey: ['two'],
                  queryFn: async () => 'b',
                  staleTime: Infinity,
                },
              ]
            : []),
        ],
        combine: (results: readonly { data?: unknown }[]) =>
          results.map((result) => result.data).join(','),
      })),
    );
    await settle();
    expect(mounted.result.results).toBe('1,b');
    expect(calls).toBe(1);
    id.value = 2;
    await settle();
    expect(mounted.result.results).toBe('2,b');
    expect(calls).toBe(2);
    includeSecond.value = false;
    await settle();
    expect(mounted.result.results).toBe('2');
    const raw = mountQuery(
      () =>
        useQueries({
          queries: [{ queryKey: ['two'], queryFn: async () => 'shared', staleTime: Infinity }],
        }),
      mounted.client,
    );
    await settle();
    expect(raw.result.results[0]?.data).toBe('b');
    mounted.unmount();
    raw.unmount();
  });

  it('rejects a missing queries array or query key', () => {
    expect(() =>
      expectSetupError(() => {
        useQueries({} as never);
      }),
    ).toThrow(/queries array/);
    expect(() =>
      expectSetupError(() => {
        useQueries({ queries: [{ queryFn: async () => 1 } as never] });
      }),
    ).toThrow(/queryKey/);
    expect(() => useQueries({ queries: [] })).toThrow(/effect scope/);
  });
});
