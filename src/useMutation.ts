import type { MaybeRefOrGetter } from '@usevibejs/ui';
import {
  MutationObserver,
  type DefaultError,
  type MutationFunctionContext,
  type MutationKey,
  type MutationObserverOptions,
  type MutationObserverResult,
} from '@tanstack/query-core';
import { assertScope, useQueryClient } from './client.ts';
import { useObserverResult } from './observer.ts';

export type UseMutationReturn<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
> = MutationObserverResult<TData, TError, TVariables, TOnMutateResult> & {
  /**
   * Runs the mutation and resolves with its data, or rejects with its error.
   * `mutate` is the same function: Query Core's observer method returns a promise.
   */
  readonly mutateAsync: MutationObserverResult<
    TData,
    TError,
    TVariables,
    TOnMutateResult
  >['mutate'];
};

/**
 * `MutationObserverOptions` with a synchronous or asynchronous `mutationFn`, and a `mutationKey`
 * that may be a ref or a zero-argument getter.
 */
export type UseMutationOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
> = Omit<
  MutationObserverOptions<TData, TError, TVariables, TOnMutateResult>,
  'mutationFn' | 'mutationKey'
> & {
  readonly mutationFn?: (
    variables: TVariables,
    context: MutationFunctionContext,
  ) => TData | Promise<TData>;
  readonly mutationKey?: MaybeRefOrGetter<MutationKey>;
};

/**
 * Subscribes to a mutation. The returned object keeps the latest status, variables, and data.
 * `mutate` follows the most recently started call; earlier calls still settle their own promises
 * and remain visible to `useIsMutating()`. Unmounting stops the subscription and does not cancel
 * a mutation that has already started.
 */
export function useMutation<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
>(
  options: MaybeRefOrGetter<UseMutationOptions<TData, TError, TVariables, TOnMutateResult>>,
): UseMutationReturn<TData, TError, TVariables, TOnMutateResult> {
  assertScope('useMutation');
  const client = useQueryClient();
  return useObserverResult(
    options,
    (resolved) =>
      new MutationObserver(
        client,
        resolved as MutationObserverOptions<TData, TError, TVariables, TOnMutateResult>,
      ),
  ) as UseMutationReturn<TData, TError, TVariables, TOnMutateResult>;
}
