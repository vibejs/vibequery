import {
  computed,
  onScopeDispose,
  shallowReadonly,
  shallowRef,
  toValue,
  watch,
  type MaybeRefOrGetter,
} from '@usevibejs/ui';
import {
  QueriesObserver,
  type QueryObserverOptions,
  type QueryObserverResult,
} from '@tanstack/query-core';
import { assertScope, useQueryClient } from './client.ts';
import { VibeQueryError } from './errors.ts';
import { cloneDeepUnref } from './resolve.ts';

// oxlint-disable typescript/no-explicit-any -- a query list is heterogeneous; one type variable cannot name every row
type AnyOptions = QueryObserverOptions<any, any, any, any, any>;

export interface UseQueriesOptions<TCombined> {
  readonly queries: readonly MaybeRefOrGetter<AnyOptions>[];
  readonly combine?: (results: readonly QueryObserverResult[]) => TCombined;
}

/**
 * Subscribes to several queries with one observer set. Observers are reused when a query hash
 * stays the same and replaced when the list changes. `results` is either the per-query results or
 * the value returned by `combine`.
 */
export function useQueries<TCombined>(
  source: MaybeRefOrGetter<
    UseQueriesOptions<TCombined> & {
      readonly combine: (results: readonly QueryObserverResult[]) => TCombined;
    }
  >,
): { readonly results: TCombined };
export function useQueries(
  source: MaybeRefOrGetter<UseQueriesOptions<readonly QueryObserverResult[]>>,
): { readonly results: readonly QueryObserverResult[] };
export function useQueries(source: MaybeRefOrGetter<UseQueriesOptions<unknown>>): {
  readonly results: unknown;
} {
  assertScope('useQueries');
  const client = useQueryClient();
  const version = shallowRef(0);
  let combine: ((results: readonly QueryObserverResult[]) => unknown) | undefined;

  const read = (): { queries: AnyOptions[]; combine?: UseQueriesOptions<unknown>['combine'] } => {
    const resolved = toValue(source);
    if (typeof resolved !== 'object' || resolved === null || !Array.isArray(resolved.queries)) {
      throw new VibeQueryError('useQueries() requires a queries array.');
    }
    const queries = resolved.queries.map((query) => {
      const options = cloneDeepUnref(toValue(query));
      const queryKey =
        typeof options === 'object' && options !== null && 'queryKey' in options
          ? options.queryKey
          : undefined;
      if (typeof options !== 'object' || options === null || !Array.isArray(queryKey)) {
        throw new VibeQueryError('useQueries() requires every query to have an array queryKey.');
      }
      return options as AnyOptions;
    });
    return { queries, combine: resolved.combine };
  };

  const initial = read();
  combine = initial.combine;
  const observer = new QueriesObserver(client, initial.queries, { combine });
  const unsubscribe = observer.subscribe(() => {
    version.value += 1;
  });
  onScopeDispose(unsubscribe);

  watch(
    read,
    (next) => {
      combine = next.combine;
      observer.setQueries(next.queries, { combine });
      version.value += 1;
    },
    { flush: 'sync' },
  );

  const results = computed(() => {
    void version.value;
    const raw = observer.getCurrentResult();
    return combine ? combine(raw) : raw;
  });

  return shallowReadonly({
    get results() {
      return results.value;
    },
  });
}
