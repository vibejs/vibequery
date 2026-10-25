# Optimistic updates

`optimisticMutation` builds the callbacks for a cache update that should appear before the server
answers.

```ts
const add = useMutation(
  optimisticMutation({
    queryClient: client,
    queryKey: ['todos'],
    mutationFn: createTodo,
    update: (current, title) => [...(current ?? []), { id: -1, title, done: false }],
  }),
);
```

`onMutate` cancels matching fetches, snapshots `getQueryData`, writes `update(current, variables)`,
and returns `{ previous, queryKey }`. `onError` writes the snapshot back. `onSettled` invalidates
the key unless `invalidate: false`.

`queryKey` may be an array or a function of the variables. The snapshot is the value at the start
of `onMutate`. A later invalidation refetches the server value, which replaces the optimistic row
when the mutation succeeds.

Call `optimisticMutation` anywhere. It closes over the client and does not need a component scope.
The `useMutation` call still does.
