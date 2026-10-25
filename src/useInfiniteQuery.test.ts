import { ref } from '@usevibejs/ui';
import { describe, expect, it } from 'vitest';
import { VibeQueryError } from './errors.ts';
import { infiniteQueryOptions } from './options.ts';
import { expectSetupError, mountQuery, settle } from './test-utils.ts';
import { useInfiniteQuery } from './useInfiniteQuery.ts';

describe('useInfiniteQuery', () => {
  it('loads pages in both directions and stops at the ends', async () => {
    const filter = ref('all');
    const mounted = mountQuery(() =>
      useInfiniteQuery(
        infiniteQueryOptions({
          queryKey: ['feed', filter],
          initialPageParam: 1,
          queryFn: async ({ pageParam }) => ({
            items: [`${filter.value}-${String(pageParam)}`],
            next: pageParam < 3 ? pageParam + 1 : undefined,
            previous: pageParam > 1 ? pageParam - 1 : undefined,
          }),
          getNextPageParam: (last) => last.next,
          getPreviousPageParam: (first) => first.previous,
          maxPages: 2,
        }),
      ),
    );
    await settle();
    expect(mounted.result.data?.pages).toEqual([
      { items: ['all-1'], next: 2, previous: undefined },
    ]);
    expect(mounted.result.hasNextPage).toBe(true);
    await mounted.result.fetchNextPage();
    expect(mounted.result.data?.pages.map((page) => page.items[0])).toEqual(['all-1', 'all-2']);
    await mounted.result.fetchNextPage();
    expect(mounted.result.data?.pages.map((page) => page.items[0])).toEqual(['all-2', 'all-3']);
    expect(mounted.result.hasNextPage).toBe(false);
    expect(mounted.result.hasPreviousPage).toBe(true);
    await mounted.result.fetchPreviousPage();
    filter.value = 'open';
    await settle();
    expect(mounted.result.data?.pages[0]?.items).toEqual(['open-1']);
    mounted.unmount();
    expect(
      mounted.client
        .getQueryCache()
        .find({ queryKey: ['feed', 'open'] })
        ?.getObserversCount(),
    ).toBe(0);
  });

  it('accepts an initial page param of 0 and rejects incomplete options', async () => {
    expect(() =>
      expectSetupError(() => {
        useInfiniteQuery({
          queryKey: ['missing'],
          queryFn: async () => 1,
          getNextPageParam: () => undefined,
        } as never);
      }),
    ).toThrow(VibeQueryError);
    expect(() =>
      expectSetupError(() => {
        useInfiniteQuery({
          queryKey: ['missing'],
          queryFn: async () => 1,
          initialPageParam: 0,
        } as never);
      }),
    ).toThrow(/getNextPageParam/);
    const mounted = mountQuery(() =>
      useInfiniteQuery({
        queryKey: ['zero'],
        initialPageParam: () => 0,
        queryFn: async ({ pageParam }) => pageParam,
        getNextPageParam: () => undefined,
      }),
    );
    await settle();
    expect(mounted.result.data?.pages).toEqual([0]);
    expect(mounted.result.hasNextPage).toBe(false);
    mounted.unmount();
  });

  it('throws outside a scope', () => {
    expect(() =>
      useInfiniteQuery({
        queryKey: ['x'],
        queryFn: async () => 1,
        initialPageParam: 0,
        getNextPageParam: () => undefined,
      }),
    ).toThrow(/effect scope/);
  });
});
