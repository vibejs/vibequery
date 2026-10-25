export { VibeQueryError } from './errors.ts';
export {
  createVibeQueryPlugin,
  queryClientKey,
  useQueryClient,
  type VibeQueryPluginOptions,
} from './client.ts';
export { infiniteQueryOptions, queryOptions } from './options.ts';
export {
  optimisticMutation,
  type OptimisticContext,
  type OptimisticMutationOptions,
} from './optimistic.ts';
export type { UseInfiniteQueryOptions, UseQueryOptions } from './types.ts';
export { useInfiniteQuery } from './useInfiniteQuery.ts';
export { useIsFetching, useIsMutating } from './useIsFetching.ts';
export { useMutation, type UseMutationOptions, type UseMutationReturn } from './useMutation.ts';
export { useQueries, type UseQueriesOptions } from './useQueries.ts';
export { useQuery } from './useQuery.ts';

export {
  CancelledError,
  InfiniteQueryObserver,
  MutationCache,
  MutationObserver,
  QueriesObserver,
  QueryCache,
  QueryClient,
  QueryObserver,
  dehydrate,
  focusManager,
  hashKey,
  hydrate,
  isCancelledError,
  keepPreviousData,
  matchMutation,
  matchQuery,
  onlineManager,
  partialMatchKey,
  replaceEqualDeep,
  skipToken,
} from '@tanstack/query-core';

export type {
  CancelOptions,
  DataTag,
  DefaultError,
  DefaultOptions,
  DehydratedState,
  DefinedQueryObserverResult,
  FetchNextPageOptions,
  FetchPreviousPageOptions,
  InfiniteData,
  InfiniteQueryObserverResult,
  InvalidateOptions,
  MutationFilters,
  MutationFunction,
  MutationObserverOptions,
  MutationObserverResult,
  MutationState,
  QueryFilters,
  QueryFunction,
  QueryFunctionContext,
  QueryKey,
  QueryObserverOptions,
  QueryObserverResult,
  QueryState,
  RefetchOptions,
  SkipToken,
} from '@tanstack/query-core';
