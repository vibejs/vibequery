import { onScopeDispose, shallowReadonly, shallowRef, watch, type ShallowRef } from '@usevibejs/ui';
import type { QueryKey } from '@tanstack/query-core';
import { VibeQueryError } from './errors.ts';
import { resolveOptions } from './resolve.ts';

interface Observer<TResult extends object> {
  /** Accepts the concrete option object. Typed as `never` so each observer class stays assignable. */
  setOptions(options: never): void;
  subscribe(listener: (result: TResult) => void): () => void;
  getCurrentResult(): TResult;
}

/**
 * Subscribes one observer for the lifetime of the active scope and exposes a stable readonly view
 * of its latest result. Property reads track the observer's notifications, so a template that reads
 * `data` updates when that result changes and does not poll Query Core on its own.
 */
export function useObserverResult<TResult extends object>(
  source: unknown,
  create: (options: Record<string, unknown>) => Observer<TResult>,
  validate?: (options: Record<string, unknown>) => void,
): TResult {
  const version = shallowRef(0);
  const read = (): Record<string, unknown> => {
    const options = resolveOptions(source);
    validate?.(options);
    return options;
  };
  const observer = create(read());
  const unsubscribe = observer.subscribe(() => {
    version.value += 1;
  });
  onScopeDispose(unsubscribe);
  watch(
    read,
    (options) => {
      observer.setOptions(options as never);
      version.value += 1;
    },
    { flush: 'sync' },
  );
  return expose(observer, version);
}

function expose<TResult extends object>(
  observer: Observer<TResult>,
  version: ShallowRef<number>,
): TResult {
  const sample = observer.getCurrentResult();
  const target: Record<string, unknown> = {};
  for (const key of Object.keys(sample)) {
    const value = sample[key as keyof TResult];
    if (typeof value === 'function') {
      target[key] = (...args: readonly unknown[]) => {
        const latest = observer.getCurrentResult() as Record<string, unknown>;
        const method = latest[key];
        return Reflect.apply(method as (...params: readonly unknown[]) => unknown, observer, args);
      };
    } else {
      Object.defineProperty(target, key, {
        enumerable: true,
        configurable: true,
        get() {
          void version.value;
          if ('trackProp' in observer && typeof observer.trackProp === 'function') {
            observer.trackProp(key);
          }
          return observer.getCurrentResult()[key as keyof TResult];
        },
      });
    }
  }
  if (typeof target.mutate === 'function') {
    const mutate = target.mutate as (...args: readonly unknown[]) => unknown;
    target.mutateAsync = (...args: readonly unknown[]) => mutate(...args);
  }
  return shallowReadonly(target) as TResult;
}

/** Requires an array `queryKey` before an observer is allowed to subscribe. */
export function assertQueryKey(hook: string, options: { readonly queryKey?: QueryKey }): void {
  if (!Array.isArray(options.queryKey)) {
    throw new VibeQueryError(`${hook}() requires queryKey to be an array.`);
  }
}
