import { computed, ref } from '@usevibejs/ui';
import { focusManager, onlineManager, skipToken } from '@tanstack/query-core';
import { describe, expect, it, vi } from 'vitest';
import { useQueryClient } from './client.ts';
import { VibeQueryError } from './errors.ts';
import { queryOptions } from './options.ts';
import { createTestClient, deferred, expectSetupError, mountQuery, settle } from './test-utils.ts';
import { useIsFetching } from './useIsFetching.ts';
import { useQuery } from './useQuery.ts';

describe('useQuery', () => {
  it('loads data once for shared observers and exposes stable actions', async () => {
    const client = createTestClient();
    let calls = 0;
    const first = mountQuery(
      () =>
        useQuery({
          queryKey: ['user'],
          queryFn: async () => {
            calls += 1;
            return { name: 'Ada' };
          },
        }),
      client,
    );
    const second = mountQuery(
      () =>
        useQuery(queryOptions({ queryKey: ['user'], queryFn: async () => ({ name: 'other' }) })),
      client,
    );
    expect(first.result.isPending).toBe(true);
    expect(first.result.isFetching).toBe(true);
    await settle();
    expect(calls).toBe(1);
    expect(first.result.data).toEqual({ name: 'Ada' });
    expect(second.result.data).toEqual({ name: 'Ada' });
    expect(first.result.isSuccess).toBe(true);
    expect(first.result.isStale).toBe(true);
    const refetch = first.result.refetch;
    await refetch();
    expect(calls).toBe(2);
    first.unmount();
    second.unmount();
    expect(
      client
        .getQueryCache()
        .find({ queryKey: ['user'] })
        ?.getObserversCount(),
    ).toBe(0);
  });

  it('refetches when a reactive query key changes and does not run queryFn while reading options', async () => {
    const id = ref(1);
    let building = false;
    const mounted = mountQuery(() => {
      const options = () => {
        building = true;
        const built = {
          queryKey: ['user', id.value] as const,
          queryFn: () => {
            if (building) throw new Error('queryFn ran while building options');
            return id.value;
          },
        };
        building = false;
        return built;
      };
      return useQuery(options);
    });
    await settle();
    expect(mounted.result.data).toBe(1);
    id.value = 2;
    await settle();
    expect(mounted.result.data).toBe(2);
    expect(mounted.client.getQueryCache().findAll().length).toBe(2);
    mounted.unmount();
  });

  it('tracks refs nested in a query key and a zero-argument staleTime getter', async () => {
    const id = ref('a');
    const stale = ref(60_000);
    const mounted = mountQuery(() =>
      useQuery({
        queryKey: ['row', id],
        staleTime: () => stale.value,
        queryFn: async () => id.value,
      }),
    );
    await settle();
    expect(mounted.result.data).toBe('a');
    expect(mounted.result.isStale).toBe(false);
    stale.value = 0;
    await settle();
    expect(mounted.result.isStale).toBe(true);
    id.value = 'b';
    await settle();
    expect(mounted.result.data).toBe('b');
    mounted.unmount();
  });

  it('supports conditional, dependent, selected, placeholder, and initial data', async () => {
    const enabled = ref(false);
    const userId = ref<number | null>(null);
    const mounted = mountQuery(() => {
      const user = useQuery({
        queryKey: ['user'],
        enabled,
        placeholderData: { id: 0, name: '…' },
        queryFn: async () => ({ id: 7, name: 'Ada' }),
        select: (value: { id: number; name: string }) => value.name,
      });
      const posts = useQuery({
        queryKey: ['posts', userId],
        enabled: () => userId.value !== null,
        queryFn: async () => [`posts-${String(userId.value)}`],
      });
      const seeded = useQuery({
        queryKey: ['seeded'],
        queryFn: async () => 2,
        initialData: 1,
      });
      return { user, posts, seeded };
    });
    expect(mounted.result.user.fetchStatus).toBe('idle');
    expect(mounted.result.user.data).toBe('…');
    expect(mounted.result.user.isPlaceholderData).toBe(true);
    expect(mounted.result.seeded.data).toBe(1);
    expect(mounted.result.posts.fetchStatus).toBe('idle');
    enabled.value = true;
    await settle();
    expect(mounted.result.user.data).toBe('Ada');
    userId.value = 7;
    await settle();
    expect(mounted.result.posts.data).toEqual(['posts-7']);
    mounted.unmount();
  });

  it('passes query-aware callbacks through and preserves class instances', async () => {
    const when = new Date('2020-01-01T00:00:00.000Z');
    let enabledCalls = 0;
    const mounted = mountQuery(() =>
      useQuery({
        queryKey: ['dated', when],
        enabled: (query) => {
          enabledCalls += 1;
          return query.queryKey[0] === 'dated';
        },
        queryFn: async ({ signal }) => {
          expect(signal.aborted).toBe(false);
          return when.toISOString();
        },
      }),
    );
    await settle();
    expect(enabledCalls).toBeGreaterThan(0);
    expect(mounted.result.data).toBe('2020-01-01T00:00:00.000Z');
    mounted.unmount();
  });

  it('aborts the previous request when the key changes', async () => {
    const id = ref(1);
    const first = deferred<string>();
    const second = deferred<string>();
    const signals: AbortSignal[] = [];
    const mounted = mountQuery(() =>
      useQuery({
        queryKey: ['slow', id],
        queryFn: ({ signal }) => {
          signals.push(signal);
          return id.value === 1 ? first.promise : second.promise;
        },
      }),
    );
    id.value = 2;
    await settle();
    expect(signals[0]?.aborted).toBe(true);
    second.resolve('done');
    await settle();
    expect(mounted.result.data).toBe('done');
    first.resolve('late');
    await settle();
    expect(mounted.result.data).toBe('done');
    mounted.unmount();
  });

  it('retries on a controlled clock, then exposes the error', async () => {
    vi.useFakeTimers();
    const client = createTestClient({ defaultOptions: { queries: { retry: 1, retryDelay: 25 } } });
    let calls = 0;
    const mounted = mountQuery(
      () =>
        useQuery({
          queryKey: ['flaky'],
          queryFn: async () => {
            calls += 1;
            throw new Error('nope');
          },
        }),
      client,
    );
    await vi.advanceTimersByTimeAsync(0);
    expect(calls).toBe(1);
    expect(mounted.result.isError).toBe(false);
    await vi.advanceTimersByTimeAsync(25);
    expect(calls).toBe(2);
    expect(mounted.result.isError).toBe(true);
    expect(mounted.result.error).toEqual(expect.objectContaining({ message: 'nope' }));
    expect(mounted.result.failureCount).toBe(2);
    mounted.unmount();
    vi.useRealTimers();
  });

  it('garbage-collects unused data and invalidates active queries', async () => {
    vi.useFakeTimers();
    const client = createTestClient({ defaultOptions: { queries: { gcTime: 30, staleTime: 0 } } });
    let calls = 0;
    const mounted = mountQuery(
      () =>
        useQuery({
          queryKey: ['temp'],
          queryFn: async () => {
            calls += 1;
            return calls;
          },
        }),
      client,
    );
    await vi.advanceTimersByTimeAsync(0);
    expect(mounted.result.data).toBe(1);
    mounted.unmount();
    await vi.advanceTimersByTimeAsync(30);
    expect(client.getQueryData(['temp'])).toBeUndefined();
    const active = mountQuery(
      () =>
        useQuery({
          queryKey: ['live'],
          queryFn: async () => {
            calls += 1;
            return calls;
          },
        }),
      client,
    );
    await vi.advanceTimersByTimeAsync(0);
    await client.invalidateQueries({ queryKey: ['live'] });
    expect(active.result.data).toBe(3);
    active.unmount();
    vi.useRealTimers();
  });

  it('prefetches, polls, refetches on focus, and pauses while offline', async () => {
    vi.useFakeTimers();
    const client = createTestClient();
    let calls = 0;
    await client.prefetchQuery({
      queryKey: ['prefetched'],
      queryFn: async () => 'ready',
    });
    const mounted = mountQuery(() => {
      const fetching = useIsFetching();
      const query = useQuery({
        queryKey: ['prefetched'],
        queryFn: async () => {
          calls += 1;
          return `v${String(calls)}`;
        },
        refetchInterval: 100,
        staleTime: 0,
      });
      return { fetching, query };
    }, client);
    expect(mounted.result.query.data).toBe('ready');
    await vi.advanceTimersByTimeAsync(0);
    const afterMount = calls;
    expect(afterMount).toBeGreaterThan(0);
    await vi.advanceTimersByTimeAsync(100);
    expect(calls).toBeGreaterThan(afterMount);
    onlineManager.setOnline(false);
    await vi.advanceTimersByTimeAsync(100);
    expect(mounted.result.query.isPaused).toBe(true);
    onlineManager.setOnline(true);
    await vi.advanceTimersByTimeAsync(0);
    focusManager.setFocused(false);
    focusManager.setFocused(true);
    await vi.advanceTimersByTimeAsync(0);
    expect(calls).toBeGreaterThan(1);
    expect(mounted.result.fetching.value).toBeTypeOf('number');
    mounted.unmount();
    vi.useRealTimers();
  });

  it('rejects malformed options and accepts a computed options bag', async () => {
    expect(() =>
      expectSetupError(() => {
        useQuery({ queryFn: async () => 1 } as never);
      }),
    ).toThrow(VibeQueryError);
    expect(() =>
      expectSetupError(() => {
        useQuery((() => Promise.resolve({ queryKey: ['a'], queryFn: async () => 1 })) as never);
      }),
    ).toThrow(/synchronous/);
    expect(() =>
      expectSetupError(() => {
        useQuery({
          queryKey: () => Promise.resolve(['a']),
          queryFn: async () => 1,
        } as never);
      }),
    ).toThrow(/synchronous/);
    expect(() =>
      expectSetupError(() => {
        useQuery([] as never);
      }),
    ).toThrow(/object/);
    const bag = Object.create(null) as {
      queryKey: readonly string[];
      queryFn: () => Promise<number>;
    };
    bag.queryKey = ['null-proto'];
    bag.queryFn = async () => 3;
    const computedOptions = computed(() => ({
      queryKey: ['computed'] as const,
      queryFn: async () => 4,
    }));
    const mounted = mountQuery(() => ({
      plain: useQuery(bag),
      computed: useQuery(computedOptions),
    }));
    await settle();
    expect(mounted.result.plain.data).toBe(3);
    expect(mounted.result.computed.data).toBe(4);
    mounted.unmount();
  });

  it('keeps previous data while the next key is in flight', async () => {
    const page = ref(1);
    const pending = deferred<number>();
    const mounted = mountQuery(() =>
      useQuery({
        queryKey: ['page', page],
        placeholderData: (previous: number | undefined) => previous,
        queryFn: () => (page.value === 1 ? Promise.resolve(1) : pending.promise),
      }),
    );
    await settle();
    expect(mounted.result.data).toBe(1);
    page.value = 2;
    await settle();
    expect(mounted.result.data).toBe(1);
    expect(mounted.result.isPlaceholderData).toBe(true);
    pending.resolve(2);
    await settle();
    expect(mounted.result.data).toBe(2);
    mounted.unmount();
  });

  it('counts filtered in-flight queries', async () => {
    const gate = deferred<string>();
    const mounted = mountQuery(() => {
      useQuery({ queryKey: ['alpha'], queryFn: () => gate.promise });
      useQuery({ queryKey: ['beta'], queryFn: async () => 'b' });
      return {
        alpha: useIsFetching({ queryKey: ['alpha'] }),
        client: useQueryClient(),
      };
    });
    await settle();
    expect(mounted.result.alpha.value).toBe(1);
    gate.resolve('a');
    await settle();
    expect(mounted.result.alpha.value).toBe(0);
    mounted.unmount();
  });

  it('does not fetch a skipped query', async () => {
    const mounted = mountQuery(() =>
      useQuery({
        queryKey: ['skipped'],
        queryFn: skipToken,
      }),
    );
    await settle();
    expect(mounted.result.fetchStatus).toBe('idle');
    expect(mounted.result.isPending).toBe(true);
    expect(mounted.client.getQueryData(['skipped'])).toBeUndefined();
    mounted.unmount();
  });
});
