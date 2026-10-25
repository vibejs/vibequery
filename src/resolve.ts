import { isRef, toValue, type MaybeRefOrGetter } from '@usevibejs/ui';
import { VibeQueryError } from './errors.ts';

/**
 * Fields whose zero-argument functions are Vibe getters (`() => value`) rather than Query Core
 * callbacks. Callbacks that declare a parameter are left intact so Query Core can call them with
 * the query. `queryFn`, `select`, and page-param callbacks are never in this set: evaluating them
 * while reading options would start work or depend on data the option pass does not have.
 */
const ZERO_ARG_GETTER_FIELDS: ReadonlySet<string> = new Set([
  'enabled',
  'gcTime',
  'initialPageParam',
  'maxPages',
  'mutationKey',
  'networkMode',
  'queryKey',
  'refetchInterval',
  'refetchIntervalInBackground',
  'refetchOnMount',
  'refetchOnReconnect',
  'refetchOnWindowFocus',
  'retryOnMount',
  'staleTime',
]);

function isPlainRecord(value: object): value is Record<string, unknown> {
  const proto: unknown = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function readGetter(field: string, getter: () => unknown): unknown {
  const result = getter();
  if (result instanceof Promise) {
    throw new VibeQueryError(
      `VibeQuery: \`${field}\` must be synchronous. Read reactive values in the option getter and do asynchronous work in queryFn or mutationFn.`,
    );
  }
  return result;
}

/**
 * Copies `value`, replacing refs with their current values. Function values are kept, except
 * zero-argument getters of {@link ZERO_ARG_GETTER_FIELDS}, which are called so the watcher that
 * reads options subscribes to the refs they touch. `queryFn` is never called here.
 */
export function cloneDeepUnref(value: unknown, field?: string): unknown {
  if (isRef(value)) return cloneDeepUnref(value.value, field);
  if (typeof value === 'function') {
    if (field !== undefined && ZERO_ARG_GETTER_FIELDS.has(field) && value.length === 0) {
      const getter = value as () => unknown;
      return cloneDeepUnref(readGetter(field, getter), field);
    }
    return value;
  }
  if (typeof value !== 'object' || value === null) return value;
  if (Array.isArray(value)) return value.map((item) => cloneDeepUnref(item));
  if (!isPlainRecord(value)) return value;
  const copy: Record<string, unknown> = {};
  for (const key of Object.keys(value)) copy[key] = cloneDeepUnref(value[key], key);
  return copy;
}

function isThenable(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { then?: unknown }).then === 'function'
  );
}

/** The current plain value of an options bag, ref, or getter. */
export function resolveOptions(source: unknown): Record<string, unknown> {
  const resolved = cloneDeepUnref(toValue(source as MaybeRefOrGetter<unknown>));
  if (isThenable(resolved)) {
    throw new VibeQueryError(
      'VibeQuery: options must be synchronous. Read reactive values in the option getter and do asynchronous work in queryFn or mutationFn.',
    );
  }
  if (typeof resolved !== 'object' || resolved === null || Array.isArray(resolved)) {
    throw new VibeQueryError('VibeQuery: options must be an object, a ref, or a getter.');
  }
  return resolved as Record<string, unknown>;
}
