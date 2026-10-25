import { ref } from '@usevibejs/ui';
import { describe, expect, it, vi } from 'vitest';
import { optimisticMutation } from './optimistic.ts';
import { createTestClient, deferred, mountQuery, settle } from './test-utils.ts';
import { useIsMutating } from './useIsFetching.ts';
import { useMutation } from './useMutation.ts';
import { useQuery } from './useQuery.ts';

describe('useMutation', () => {
  it('reports pending, success, and idle, including a synchronous mutation', async () => {
    const gate = deferred<number>();
    const label = ref('create');
    const mounted = mountQuery(() => {
      const pending = useIsMutating();
      const mutation = useMutation({
        mutationKey: () => [label.value],
        mutationFn: async (value: number) => {
          await gate.promise;
          return value * 2;
        },
      });
      const sync = useMutation({ mutationFn: (value: string) => value.toUpperCase() });
      return { pending, mutation, sync };
    });
    const running = mounted.result.mutation.mutateAsync(3);
    await settle();
    expect(mounted.result.mutation.isPending).toBe(true);
    expect(mounted.result.mutation.variables).toBe(3);
    expect(mounted.result.pending.value).toBe(1);
    gate.resolve(0);
    await expect(running).resolves.toBe(6);
    await settle();
    expect(mounted.result.mutation.isSuccess).toBe(true);
    expect(mounted.result.mutation.data).toBe(6);
    expect(mounted.result.pending.value).toBe(0);
    mounted.result.mutation.reset();
    expect(mounted.result.mutation.isIdle).toBe(true);
    expect(mounted.result.mutation.data).toBeUndefined();
    await mounted.result.sync.mutateAsync('ada');
    expect(mounted.result.sync.data).toBe('ADA');
    label.value = 'update';
    await settle();
    mounted.unmount();
  });

  it('keeps every in-flight mutation visible and records the error', async () => {
    const gates = [deferred<string>(), deferred<string>()];
    let started = 0;
    const mounted = mountQuery(() => {
      const pending = useIsMutating({ status: 'pending' });
      const mutation = useMutation({
        mutationFn: async (value: string) => {
          const gate = gates[started];
          started += 1;
          if (!gate) throw new Error('unexpected');
          return gate.promise.then(() => value);
        },
      });
      return { pending, mutation };
    });
    const first = mounted.result.mutation.mutateAsync('a').catch((error: unknown) => error);
    const second = mounted.result.mutation.mutateAsync('b');
    await settle();
    expect(mounted.result.pending.value).toBe(2);
    gates[0]?.reject(new Error('first failed'));
    await expect(first).resolves.toEqual(expect.objectContaining({ message: 'first failed' }));
    await settle();
    expect(mounted.result.mutation.isPending).toBe(true);
    gates[1]?.resolve('ok');
    await expect(second).resolves.toBe('b');
    await settle();
    expect(mounted.result.mutation.isSuccess).toBe(true);
    const failed = mountQuery(
      () =>
        useMutation({
          mutationFn: () => {
            throw 'plain';
          },
        }),
      mounted.client,
    );
    await expect(
      failed.result.mutateAsync(undefined).catch((error: unknown) => error),
    ).resolves.toBe('plain');
    expect(failed.result.isError).toBe(true);
    expect(failed.result.error).toBe('plain');
    expect(failed.result.failureCount).toBe(1);
    mounted.unmount();
    failed.unmount();
  });

  it('retries a mutation on a controlled clock', async () => {
    vi.useFakeTimers();
    try {
      let calls = 0;
      const mounted = mountQuery(() =>
        useMutation({
          mutationFn: async () => {
            calls += 1;
            throw new Error('later');
          },
          retry: 1,
          retryDelay: 20,
        }),
      );
      const pending = mounted.result.mutateAsync(undefined);
      const captured = pending.catch((error: unknown) => error);
      await vi.advanceTimersByTimeAsync(0);
      expect(calls).toBe(1);
      await vi.advanceTimersByTimeAsync(20);
      await expect(captured).resolves.toEqual(expect.objectContaining({ message: 'later' }));
      expect(calls).toBe(2);
      expect(mounted.result.failureCount).toBe(2);
      mounted.unmount();
    } finally {
      vi.useRealTimers();
    }
  });

  it('writes an optimistic value, rolls it back, and can skip invalidation', async () => {
    const client = createTestClient();
    client.setQueryData(['todos'], [{ id: 1, title: 'a' }]);
    const signals: AbortSignal[] = [];
    let todoFetches = 0;
    const query = mountQuery(
      () =>
        useQuery({
          queryKey: ['todos'],
          queryFn: ({ signal }) => {
            todoFetches += 1;
            signals.push(signal);
            if (todoFetches > 1) return Promise.resolve([{ id: 1, title: 'server' }]);
            return new Promise<readonly { id: number; title: string }[]>((_resolve, reject) => {
              signal.addEventListener('abort', () => {
                reject(new Error('aborted'));
              });
            });
          },
        }),
      client,
    );
    const seen: unknown[] = [];
    const mutation = mountQuery(
      () =>
        useMutation(
          optimisticMutation<
            { id: number; title: string },
            string,
            { id: number; title: string }[]
          >({
            queryClient: client,
            queryKey: (title) => (title.length >= 0 ? ['todos'] : ['other']),
            mutationFn: async (title) => {
              seen.push(client.getQueryData(['todos']));
              if (title === 'bad') throw new Error('bad');
              return { id: 2, title };
            },
            update: (current, title) => [...(current ?? []), { id: 0, title }],
            invalidate: false,
          }),
        ),
      client,
    );
    const skipped = mountQuery(
      () =>
        useMutation(
          optimisticMutation<string, string, string>({
            queryClient: client,
            queryKey: ['note'],
            invalidate: false,
            mutationFn: async (value) => value,
            update: (_current, value) => value,
          }),
        ),
      client,
    );
    const failing = mutation.result.mutateAsync('bad').catch((error: unknown) => error);
    await settle();
    expect(signals[0]?.aborted).toBe(true);
    expect(seen).toEqual([
      [
        { id: 1, title: 'a' },
        { id: 0, title: 'bad' },
      ],
    ]);
    await expect(failing).resolves.toEqual(expect.objectContaining({ message: 'bad' }));
    await settle();
    expect(client.getQueryData(['todos'])).toEqual([{ id: 1, title: 'a' }]);
    expect(todoFetches).toBe(1);
    client.setQueryData(['note'], 'old');
    let fetches = 0;
    const note = mountQuery(
      () =>
        useQuery({
          queryKey: ['note'],
          staleTime: Infinity,
          queryFn: async () => {
            fetches += 1;
            return 'server';
          },
        }),
      client,
    );
    await settle();
    expect(fetches).toBe(0);
    await skipped.result.mutateAsync('new');
    await settle();
    expect(client.getQueryData(['note'])).toBe('new');
    expect(fetches).toBe(0);
    query.unmount();
    mutation.unmount();
    skipped.unmount();
    note.unmount();
  });

  it('invalidates the query after success and ignores a missing snapshot', async () => {
    const client = createTestClient();
    client.setQueryData(['item'], 'old');
    let fetches = 0;
    const query = mountQuery(
      () =>
        useQuery({
          queryKey: ['item'],
          queryFn: async () => {
            fetches += 1;
            return 'server';
          },
        }),
      client,
    );
    await settle();
    const mutation = mountQuery(
      () =>
        useMutation(
          optimisticMutation({
            queryClient: client,
            queryKey: ['item'],
            mutationFn: async (value: string) => value,
            update: (_current, value) => value,
          }),
        ),
      client,
    );
    await mutation.result.mutateAsync('next');
    await settle();
    expect(fetches).toBe(2);
    expect(client.getQueryData(['item'])).toBe('server');
    const options = optimisticMutation({
      queryClient: client,
      queryKey: ['item'],
      mutationFn: async () => 'x',
      update: () => 'y',
    });
    options.onError?.(new Error('x'), undefined, undefined, undefined as never);
    await options.onSettled?.(undefined, new Error('x'), undefined, undefined, undefined as never);
    expect(client.getQueryData(['item'])).toBe('server');
    query.unmount();
    mutation.unmount();
  });
});
