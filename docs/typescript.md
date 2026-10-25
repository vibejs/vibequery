# TypeScript

`useQuery` infers the cached data from `queryFn` and the selected data from `select`. `queryKey`
must be an array. `initialData` selects an overload whose `data` does not include `undefined`.

```ts
const name = useQuery({
  queryKey: ['user'] as const,
  queryFn: async () => ({ id: 1, name: 'Ada' }),
  select: (user) => user.name,
});
// name.data: string | undefined
```

`queryOptions` and `infiniteQueryOptions` return the same object and brand `queryKey` with
`DataTag`, so `fetchQuery` and `useQuery` can share one definition.

`useMutation` infers variables from `mutationFn` and allows that function to return `TData` or
`Promise<TData>`. `useQueries` is heterogeneous: `combine` is the supported way to name the combined
value. Without it, `results` is an array of query results.

Public types do not use `any`. The implementation casts resolved options at the Query Core boundary
because refs have already been unwrapped and the core types do not describe that intermediate
object.

Boolean options such as `enabled` accept `ref(false)`. A distributive `Ref<true> | Ref<false>` would
reject it.

The package emits ESM, declaration files, and source maps. `sideEffects` is `false`.
