# Mutations

```ts
const save = useMutation({
  mutationKey: ['save-user'],
  mutationFn: async (input: { name: string }) => updateUser(input),
  onSuccess: () => client.invalidateQueries({ queryKey: ['user'] }),
});

save.mutate({ name: 'Ada' });
await save.mutateAsync({ name: 'Ada' });
```

`mutationFn` may return a value or a promise. `mutate` and `mutateAsync` are the same function:
Query Core's method returns a promise and rejects when the mutation fails. Attach a catch if you do
not await it.

The result reports `idle`, `pending`, `success`, and `error`, plus `variables`, `data`, `error`,
`failureCount`, and `isPaused`. `reset()` returns it to `idle`.

The observer follows the latest `mutate()` call. Earlier calls still settle their own promises, and
`useIsMutating()` counts every pending mutation in the cache.

`retry` and `retryDelay` schedule retries the same way they do for queries. `mutationKey` may be an
array, a ref, or a zero-argument getter.

Unmounting disposes the observer. It does not cancel a mutation that has already started.
