import {
  computed,
  onScopeDispose,
  shallowRef,
  type ComputedRef,
  type MaybeRefOrGetter,
} from '@usevibejs/ui';
import type { MutationFilters, QueryFilters } from '@tanstack/query-core';
import { assertScope, useQueryClient } from './client.ts';
import { resolveOptions } from './resolve.ts';

function useCacheCount(
  read: (version: { readonly value: number }) => number,
  subscribe: (onStoreChange: () => void) => () => void,
): ComputedRef<number> {
  const version = shallowRef(0);
  const count = computed(() => read(version));
  const unsubscribe = subscribe(() => {
    version.value += 1;
  });
  onScopeDispose(unsubscribe);
  return count;
}

/** How many queries matching `filters` are currently fetching. Omit `filters` to count them all. */
export function useIsFetching(filters?: MaybeRefOrGetter<QueryFilters>): ComputedRef<number> {
  assertScope('useIsFetching');
  const client = useQueryClient();
  return useCacheCount(
    (version) => {
      void version.value;
      return client.isFetching(filters === undefined ? undefined : resolveOptions(filters));
    },
    (onStoreChange) => client.getQueryCache().subscribe(onStoreChange),
  );
}

/** How many mutations matching `filters` are currently pending. Omit `filters` to count them all. */
export function useIsMutating(filters?: MaybeRefOrGetter<MutationFilters>): ComputedRef<number> {
  assertScope('useIsMutating');
  const client = useQueryClient();
  return useCacheCount(
    (version) => {
      void version.value;
      return client.isMutating(filters === undefined ? undefined : resolveOptions(filters));
    },
    (onStoreChange) => client.getMutationCache().subscribe(onStoreChange),
  );
}
