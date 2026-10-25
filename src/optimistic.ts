import type {
  DefaultError,
  MutationFunction,
  MutationObserverOptions,
  QueryClient,
  QueryKey,
} from '@tanstack/query-core';

/** The cache snapshot `optimisticMutation` restores when the mutation fails. */
export interface OptimisticContext<TQuery> {
  readonly previous: TQuery | undefined;
  readonly queryKey: QueryKey;
}

export interface OptimisticMutationOptions<TData, TVariables, TQuery> {
  readonly queryClient: QueryClient;
  readonly mutationFn: MutationFunction<TData, TVariables>;
  /** A key, or a function of the mutation variables when the target query depends on them. */
  readonly queryKey: QueryKey | ((variables: TVariables) => QueryKey);
  /** Returns the cache value to show until the mutation settles. */
  readonly update: (current: TQuery | undefined, variables: TVariables) => TQuery;
  /**
   * When `true` (the default), the targeted query is invalidated after the mutation settles so
   * active observers refetch the server value.
   */
  readonly invalidate?: boolean;
}

/**
 * Builds mutation callbacks that cancel in-flight fetches, write an optimistic cache value, restore
 * the previous value if the mutation fails, and invalidate the query when it settles.
 * Pass the result to `useMutation`. The helpers close over `queryClient`, so they can be created
 * outside setup.
 */
export function optimisticMutation<
  TData,
  TVariables = void,
  TQuery = unknown,
  TError = DefaultError,
>(
  options: OptimisticMutationOptions<TData, TVariables, TQuery>,
): MutationObserverOptions<TData, TError, TVariables, OptimisticContext<TQuery>> {
  const keyFor = (variables: TVariables): QueryKey =>
    typeof options.queryKey === 'function' ? options.queryKey(variables) : options.queryKey;

  return {
    mutationFn: options.mutationFn,
    async onMutate(variables) {
      const queryKey = keyFor(variables);
      await options.queryClient.cancelQueries({ queryKey });
      const previous = options.queryClient.getQueryData<TQuery>(queryKey);
      options.queryClient.setQueryData<TQuery>(queryKey, (current) =>
        options.update(current, variables),
      );
      return { previous, queryKey };
    },
    onError(_error, _variables, context) {
      if (context) options.queryClient.setQueryData(context.queryKey, context.previous);
    },
    onSettled(_data, _error, _variables, context) {
      if (options.invalidate === false || !context) return;
      return options.queryClient.invalidateQueries({ queryKey: context.queryKey });
    },
  };
}
