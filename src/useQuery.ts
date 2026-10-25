import type { MaybeRefOrGetter } from '@usevibejs/ui';
import {
  QueryObserver,
  type DefaultError,
  type DefinedQueryObserverResult,
  type QueryKey,
  type QueryObserverOptions,
  type QueryObserverResult,
} from '@tanstack/query-core';
import { assertScope, useQueryClient } from './client.ts';
import { assertQueryKey, useObserverResult } from './observer.ts';
import type { UseQueryOptions } from './types.ts';

/**
 * Subscribes to a query for the lifetime of the active component or effect scope.
 *
 * The returned object is stable. Read `data`, `error`, and the status flags on it in the template
 * or in a `computed`/`watch`. Destructuring copies the current values and does not stay reactive.
 * Put every value that should start a new request in `queryKey`. `queryFn` receives an
 * `AbortSignal` and is not called while the options are read.
 */
export function useQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: MaybeRefOrGetter<
    UseQueryOptions<TQueryFnData, TError, TData, TQueryKey> & {
      readonly initialData: TQueryFnData | (() => TQueryFnData);
    }
  >,
): DefinedQueryObserverResult<TData, TError>;
export function useQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: MaybeRefOrGetter<UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>>,
): QueryObserverResult<TData, TError>;
export function useQuery(options: MaybeRefOrGetter<UseQueryOptions>): QueryObserverResult {
  assertScope('useQuery');
  const client = useQueryClient();
  return useObserverResult(
    options,
    (resolved) =>
      new QueryObserver(
        client,
        resolved as unknown as QueryObserverOptions<unknown, Error, unknown, unknown, QueryKey>,
      ),
    (resolved) => {
      assertQueryKey('useQuery', resolved as { queryKey?: QueryKey });
    },
  );
}
