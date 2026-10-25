import type { MaybeRefOrGetter } from '@usevibejs/ui';
import {
  InfiniteQueryObserver,
  type DefaultError,
  type InfiniteData,
  type InfiniteQueryObserverOptions,
  type InfiniteQueryObserverResult,
  type QueryKey,
} from '@tanstack/query-core';
import { assertScope, useQueryClient } from './client.ts';
import { VibeQueryError } from './errors.ts';
import { assertQueryKey, useObserverResult } from './observer.ts';
import type { UseInfiniteQueryOptions } from './types.ts';

/**
 * Subscribes to an infinite query. `fetchNextPage` and `fetchPreviousPage` stay bound to this
 * subscription. Page cursors belong in `initialPageParam`, `getNextPageParam`, and
 * `getPreviousPageParam`; the page identity that should refetch belongs in `queryKey`.
 */
export function useInfiniteQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: MaybeRefOrGetter<
    UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>
  >,
): InfiniteQueryObserverResult<TData, TError> {
  assertScope('useInfiniteQuery');
  const client = useQueryClient();
  return useObserverResult(
    options,
    (resolved) =>
      new InfiniteQueryObserver(
        client,
        resolved as unknown as InfiniteQueryObserverOptions<
          TQueryFnData,
          TError,
          TData,
          TQueryKey,
          TPageParam
        >,
      ),
    (resolved) => {
      assertQueryKey('useInfiniteQuery', resolved as { queryKey?: QueryKey });
      if (!Object.hasOwn(resolved, 'initialPageParam')) {
        throw new VibeQueryError('useInfiniteQuery() requires initialPageParam.');
      }
      const next = resolved.getNextPageParam;
      if (typeof next !== 'function') {
        throw new VibeQueryError('useInfiniteQuery() requires getNextPageParam.');
      }
    },
  );
}
