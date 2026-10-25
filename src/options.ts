import type { DataTag, DefaultError, InfiniteData, QueryKey } from '@tanstack/query-core';
import type { UseInfiniteQueryOptions, UseQueryOptions } from './types.ts';

/**
 * Names a query's key and function together so `useQuery` and `queryClient.fetchQuery` share one
 * type. The returned object is the same reference; the helper exists for inference and for the
 * `DataTag` brand on `queryKey`.
 */
export function queryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
): UseQueryOptions<TQueryFnData, TError, TData, TQueryKey> & {
  readonly queryKey: DataTag<TQueryKey, TQueryFnData, TError>;
} {
  return options as UseQueryOptions<TQueryFnData, TError, TData, TQueryKey> & {
    readonly queryKey: DataTag<TQueryKey, TQueryFnData, TError>;
  };
}

/** The infinite-query counterpart of {@link queryOptions}. */
export function infiniteQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>,
): UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> & {
  readonly queryKey: DataTag<TQueryKey, TQueryFnData, TError>;
} {
  return options as UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> & {
    readonly queryKey: DataTag<TQueryKey, TQueryFnData, TError>;
  };
}
