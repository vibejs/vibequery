import { createApp, effectScope } from '@usevibejs/ui';
import { mountComposable } from '@usevibejs/ui/testing';
import { focusManager, QueryObserver } from '@tanstack/query-core';
import { describe, expect, it } from 'vitest';
import { createVibeQueryPlugin, queryClientKey, useQueryClient } from './client.ts';
import { VibeQueryError } from './errors.ts';
import { createTestClient, mountQuery, settle } from './test-utils.ts';
import { useQuery } from './useQuery.ts';

describe('QueryClient plugin', () => {
  it('builds a client from config and accepts an explicit override', () => {
    const plugin = createVibeQueryPlugin({
      queryClientConfig: { defaultOptions: { queries: { gcTime: 12, retry: false } } },
    });
    const mounted = mountComposable(() => useQueryClient().getDefaultOptions().queries?.gcTime, {
      plugins: [plugin],
    });
    expect(mounted.result).toBe(12);
    const client = createTestClient();
    expect(useQueryClient(client)).toBe(client);
    const explicit = mountComposable(() => useQueryClient(), {
      plugins: [createVibeQueryPlugin({ queryClient: client })],
    });
    expect(explicit.result).toBe(client);
    const generated = mountComposable(() => useQueryClient(), {
      plugins: [createVibeQueryPlugin()],
    });
    expect(generated.result).toBeInstanceOf(generated.result.constructor);
    expect(queryClientKey).toBeTypeOf('symbol');
    mounted.unmount();
    explicit.unmount();
    generated.unmount();
  });

  it('reuses one client across applications and disconnects focus after the last unmount', async () => {
    const client = createTestClient();
    let calls = 0;
    const first = mountQuery(
      () =>
        useQuery({
          queryKey: ['shared'],
          queryFn: async () => {
            calls += 1;
            return 'a';
          },
        }),
      client,
    );
    const second = mountQuery(
      () =>
        useQuery({
          queryKey: ['shared'],
          queryFn: async () => {
            calls += 1;
            return 'a';
          },
        }),
      client,
    );
    await settle();
    expect(calls).toBe(1);
    expect(first.result.data).toBe('a');
    expect(second.result.data).toBe('a');
    first.unmount();
    focusManager.setFocused(false);
    focusManager.setFocused(true);
    await settle();
    expect(calls).toBe(2);
    second.unmount();
    const orphan = new QueryObserver(client, {
      queryKey: ['shared'],
      queryFn: async () => {
        calls += 1;
        return 'a';
      },
    });
    const unsubscribe = orphan.subscribe(() => {});
    await settle();
    expect(calls).toBe(3);
    focusManager.setFocused(false);
    focusManager.setFocused(true);
    await settle();
    expect(calls).toBe(3);
    unsubscribe();
  });

  it('keeps two plugins on independent caches', async () => {
    const left = mountQuery(() => useQuery({ queryKey: ['item'], queryFn: async () => 'left' }));
    const right = mountQuery(() => useQuery({ queryKey: ['item'], queryFn: async () => 'right' }));
    await settle();
    expect(left.result.data).toBe('left');
    expect(right.result.data).toBe('right');
    left.unmount();
    right.unmount();
  });

  it('reads the client from app.runWithContext and releases the observer with the scope', async () => {
    const client = createTestClient();
    const app = createApp({ name: 'Host', setup: () => ({}), render: () => [] });
    app.use(createVibeQueryPlugin({ queryClient: client }));
    const element = document.createElement('div');
    document.body.append(element);
    app.mount(element);
    const scope = effectScope();
    app.runWithContext(() => {
      expect(useQueryClient()).toBe(client);
      scope.run(() => {
        useQuery({ queryKey: ['scoped'], queryFn: async () => 'inside' });
      });
    });
    await settle();
    expect(client.getQueryData(['scoped'])).toBe('inside');
    expect(
      client
        .getQueryCache()
        .find({ queryKey: ['scoped'] })
        ?.getObserversCount(),
    ).toBe(1);
    scope.stop();
    expect(
      client
        .getQueryCache()
        .find({ queryKey: ['scoped'] })
        ?.getObserversCount(),
    ).toBe(0);
    app.unmount();
    element.remove();
  });

  it('throws outside a scope and when no client was provided', () => {
    expect(() => useQueryClient()).toThrow(/run inside/);
    expect(() => useQuery({ queryKey: ['x'], queryFn: async () => 1 })).toThrow(/effect scope/);
    const app = createApp({ name: 'Empty', setup: () => ({}), render: () => [] });
    app.runWithContext(() => {
      expect(() => useQueryClient()).toThrow(VibeQueryError);
    });
  });
});
