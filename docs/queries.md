# Queries

```ts
const user = useQuery({
  queryKey: ['user', id],
  enabled: () => id.value !== '',
  staleTime: 30_000,
  queryFn: ({ signal }) => fetchUser(id.value, signal),
});
```

`queryKey` must be an array. Refs nested in the array are part of the key. Changing the key updates
the observer and fetches the new entry. The previous request is aborted when its `queryFn` read
`context.signal`.

## Status

`status` is `pending`, `success`, or `error`. `fetchStatus` is `fetching`, `paused`, or `idle`.
`isPending` means there is no data yet. `isLoading` means pending and fetching. `isFetching` is
true during a background refresh as well. `isPlaceholderData` is true while the shown value came
from `placeholderData`, including `keepPreviousData`.

`data` can be `undefined` until the query succeeds, unless `initialData` is set. The `initialData`
overload types `data` as defined.

## Conditional and dependent queries

`enabled: false`, a getter that returns false, or `queryFn: skipToken` does not fetch.
A dependent query waits on another result:

```ts
const projects = useQuery({
  queryKey: ['projects', personId],
  enabled: () => person.data !== undefined,
  queryFn: ({ signal }) => fetchProjects(personId.value, signal),
});
```

Put the dependency in `queryKey` too. `enabled` only decides whether to run.

## Parallel queries

`useQueries({ queries, combine })` shares one `QueriesObserver`. Observers are reused when the query
hash stays the same and replaced when the list changes. `results` is the array of results, or the
value returned by `combine`. Do not destructure `results`.

## Other behaviors

Query Core implements `staleTime`, `gcTime`, `retry`, `retryDelay`, `refetchInterval`,
`refetchOnWindowFocus`, `refetchOnReconnect`, `networkMode`, `placeholderData`, `initialData`,
`select`, prefetching, and request deduplication. Pass them through as query options.

`select` transforms cached data for this observer only. The cache keeps the original value.

`useIsFetching(filters)` returns a `ComputedRef<number>`. In a component template the ref is
unwrapped. In `mountComposable` tests, read `.value`.
