import type { ComputedRef, MaybeRefOrGetter, Ref } from '@usevibejs/ui';
import type {
  DefaultError,
  InfiniteData,
  InfiniteQueryObserverOptions,
  QueryKey,
  QueryObserverOptions,
  QueryObserverResult,
} from '@tanstack/query-core';

type AllowRefDistributed<T> = T extends (...args: never[]) => unknown
  ? T | Ref<T> | ComputedRef<T>
  : T extends readonly unknown[]
    ? { readonly [K in keyof T]: AllowRef<T[K]> } | Ref<T> | ComputedRef<T>
    : T extends object
      ? { readonly [K in keyof T]: AllowRef<T[K]> } | Ref<T> | ComputedRef<T>
      : T | Ref<T> | ComputedRef<T>;

/**
 * `boolean` option unions distribute into `Ref<true> | Ref<false>`, which rejects `ref(false)`.
 * When the field can be any boolean, accept a boolean ref as well.
 */
type AllowRef<T> = [boolean] extends [T]
  ? AllowRefDistributed<T> | Ref<boolean> | ComputedRef<boolean>
  : AllowRefDistributed<T>;

type ReactiveFields<T> = {
  readonly [K in keyof T]: AllowRef<T[K]>;
};

/**
 * `QueryObserverOptions` whose fields may be refs, computed refs, or — for `queryKey` — a getter.
 * Callbacks such as `queryFn` and `select` stay functions. A ref holding one of those callbacks is
 * unwrapped; the callback itself runs only when Query Core fetches or selects.
 */
export type UseQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = ReactiveFields<QueryObserverOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey>> & {
  readonly queryKey: MaybeRefOrGetter<TQueryKey>;
};

/** Options for {@link import('./useInfiniteQuery.ts').useInfiniteQuery}. */
export type UseInfiniteQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> = ReactiveFields<
  InfiniteQueryObserverOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>
> & {
  readonly queryKey: MaybeRefOrGetter<TQueryKey>;
};

export type { QueryObserverResult };
