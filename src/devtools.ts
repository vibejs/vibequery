import { onScopeDispose, shallowReadonly, shallowRef } from '@usevibejs/ui';
import type { Mutation, Query, QueryClient } from '@tanstack/query-core';
import { assertScope, useQueryClient } from './client.ts';

const MAX_EVENTS = 50;

export interface QueryDevtoolsQuery {
  readonly queryHash: string;
  readonly queryKey: readonly unknown[];
  readonly status: string;
  readonly fetchStatus: string;
  readonly isStale: boolean;
  readonly observers: number;
  readonly dataUpdatedAt: number;
  readonly error: string | null;
  readonly data: unknown;
}

export interface QueryDevtoolsMutation {
  readonly mutationId: number;
  readonly mutationKey: readonly unknown[] | undefined;
  readonly status: string;
  readonly isPaused: boolean;
  readonly submittedAt: number;
  readonly variables: unknown;
  readonly error: string | null;
}

export interface QueryDevtoolsEvent {
  readonly time: number;
  readonly scope: 'query' | 'mutation';
  readonly type: string;
  readonly action: string;
  readonly detail: string;
}

export interface QueryDevtools {
  readonly queries: readonly QueryDevtoolsQuery[];
  readonly mutations: readonly QueryDevtoolsMutation[];
  readonly events: readonly QueryDevtoolsEvent[];
  clearEvents(): void;
}

function errorText(error: unknown): string | null {
  if (error == null) return null;
  if (error instanceof Error) return error.message;
  return String(error);
}

function actionType(event: object): string {
  if (!('action' in event)) return '';
  const action = event.action as { type: unknown };
  return String(action.type);
}

function queryRows(client: QueryClient): readonly QueryDevtoolsQuery[] {
  return client
    .getQueryCache()
    .getAll()
    .map((query: Query) => ({
      queryHash: query.queryHash,
      queryKey: query.queryKey,
      status: query.state.status,
      fetchStatus: query.state.fetchStatus,
      isStale: query.isStale(),
      observers: query.getObserversCount(),
      dataUpdatedAt: query.state.dataUpdatedAt,
      error: errorText(query.state.error),
      data: query.state.data,
    }));
}

function mutationRows(client: QueryClient): readonly QueryDevtoolsMutation[] {
  return client
    .getMutationCache()
    .getAll()
    .map((mutation: Mutation) => ({
      mutationId: mutation.mutationId,
      mutationKey: mutation.options.mutationKey,
      status: mutation.state.status,
      isPaused: mutation.state.isPaused,
      submittedAt: mutation.state.submittedAt,
      variables: mutation.state.variables,
      error: errorText(mutation.state.error),
    }));
}

function detailFor(event: object, scope: 'query' | 'mutation'): string {
  if (scope === 'query') {
    return (event as { query: { queryHash: string } }).query.queryHash;
  }
  const mutation = (event as { mutation?: { mutationId: number } }).mutation;
  return mutation ? String(mutation.mutationId) : '';
}

/**
 * A live, read-only view of the active client's query cache, mutation cache, and recent cache
 * events. Import it from `@usevibejs/query/devtools` so production bundles that never import that
 * entry do not include it. Rendering is left to `QueryDevtools.vibe` or to application code.
 */
export function useQueryDevtools(): QueryDevtools {
  assertScope('useQueryDevtools');
  const client = useQueryClient();
  const version = shallowRef(0);
  const events: QueryDevtoolsEvent[] = [];

  const push = (event: object, scope: 'query' | 'mutation'): void => {
    events.push({
      time: Date.now(),
      scope,
      type: String((event as { type: string }).type),
      action: actionType(event),
      detail: detailFor(event, scope),
    });
    if (events.length > MAX_EVENTS) events.splice(0, events.length - MAX_EVENTS);
    version.value += 1;
  };

  const unsubscribeQuery = client.getQueryCache().subscribe((event) => {
    push(event, 'query');
  });
  const unsubscribeMutation = client.getMutationCache().subscribe((event) => {
    push(event, 'mutation');
  });
  onScopeDispose(() => {
    unsubscribeQuery();
    unsubscribeMutation();
  });

  return shallowReadonly({
    get queries() {
      void version.value;
      return queryRows(client);
    },
    get mutations() {
      void version.value;
      return mutationRows(client);
    },
    get events() {
      void version.value;
      return events.slice();
    },
    clearEvents() {
      events.length = 0;
      version.value += 1;
    },
  });
}
