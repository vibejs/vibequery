import { createApp, nextTick, type Plugin } from '@usevibejs/ui';
import { flushPromises, mountComposable } from '@usevibejs/ui/testing';
import { QueryClient, type QueryClientConfig } from '@tanstack/query-core';
import { createVibeQueryPlugin } from './client.ts';

export interface MountedQuery<T> {
  readonly client: QueryClient;
  readonly plugin: Plugin;
  readonly result: T;
  unmount(): void;
}

export function createTestClient(config?: QueryClientConfig): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity, ...config?.defaultOptions?.queries },
      mutations: { retry: false, ...config?.defaultOptions?.mutations },
    },
    queryCache: config?.queryCache,
    mutationCache: config?.mutationCache,
  });
}

export function mountQuery<T>(
  fn: () => T,
  client: QueryClient = createTestClient(),
): MountedQuery<T> {
  const plugin = createVibeQueryPlugin(client);
  const mounted = mountComposable(fn, { plugins: [plugin] });
  return { client, plugin, result: mounted.result, unmount: mounted.unmount };
}

export async function settle(): Promise<void> {
  await flushPromises();
  await nextTick();
  await flushPromises();
}

/**
 * Runs setup inside an app that records `config.errorHandler`. Vibe reports setup failures there
 * instead of rejecting `mount`, so this rethrows the recorded error for assertions.
 */
export function expectSetupError(fn: () => void, client: QueryClient = createTestClient()): void {
  const errors: unknown[] = [];
  const app = createApp({
    name: 'Capture',
    setup: () => {
      fn();
    },
    render: () => [],
  });
  app.config.errorHandler = (error) => {
    errors.push(error);
  };
  app.use(createVibeQueryPlugin(client));
  const element = document.createElement('div');
  document.body.append(element);
  app.mount(element);
  app.unmount();
  element.remove();
  if (errors[0]) throw errors[0];
}

export function deferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
} {
  let resolve: (value: T) => void = () => {};
  let reject: (error: unknown) => void = () => {};
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
