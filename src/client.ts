import {
  getCurrentScope,
  hasInjectionContext,
  inject,
  type InjectionKey,
  type Plugin,
} from '@usevibejs/ui';
import { QueryClient, type QueryClientConfig } from '@tanstack/query-core';
import { VibeQueryError } from './errors.ts';

/** App-level key for the `QueryClient` installed by {@link createVibeQueryPlugin}. */
export const queryClientKey: InjectionKey<QueryClient> = Symbol('vibequery.QueryClient');

/** Options for {@link createVibeQueryPlugin}. Pass a `QueryClient` directly to use that instance. */
export interface VibeQueryPluginOptions {
  /** An existing client. When omitted, the plugin builds one from `queryClientConfig`. */
  readonly queryClient?: QueryClient;
  /** Forwarded to `new QueryClient` when `queryClient` is omitted. */
  readonly queryClientConfig?: QueryClientConfig;
}

function createClient(options: QueryClient | VibeQueryPluginOptions): QueryClient {
  if (options instanceof QueryClient) return options;
  return options.queryClient ?? new QueryClient(options.queryClientConfig);
}

/**
 * Installs a `QueryClient` on the application. `app.use(plugin)` provides the client to
 * `useQueryClient()` and mounts Query Core's focus and online listeners. Each application that
 * installs the plugin holds one mount; the listeners disconnect when the last of those
 * applications unmounts. The client and its cache stay in memory, so a shared client can outlive
 * one application without leaking listeners into the next.
 *
 * Creating the plugin does not install a process-wide singleton. Two applications that do not
 * share a client cannot see each other's queries.
 */
export function createVibeQueryPlugin(options: QueryClient | VibeQueryPluginOptions = {}): Plugin {
  const client = createClient(options);
  return {
    install(app) {
      client.mount();
      app.provide(queryClientKey, client);
      app.onUnmount(() => {
        client.unmount();
      });
    },
  };
}

/**
 * The `QueryClient` provided by the surrounding application. Pass `override` to use a specific
 * client, which is how tests and helpers target a client without an injection context.
 */
export function useQueryClient(override?: QueryClient): QueryClient {
  if (override) return override;
  if (!hasInjectionContext()) {
    throw new VibeQueryError(
      'useQueryClient() must run inside a component setup or app.runWithContext() after createVibeQueryPlugin() is installed.',
    );
  }
  const client = inject(queryClientKey);
  if (!client) {
    throw new VibeQueryError(
      'No QueryClient was provided. Install createVibeQueryPlugin() with app.use().',
    );
  }
  return client;
}

/** Throws when `hook` runs outside a component setup or an effect scope. */
export function assertScope(hook: string): void {
  if (!getCurrentScope()) {
    throw new VibeQueryError(
      `${hook}() must be called inside a component setup or an effect scope.`,
    );
  }
}
