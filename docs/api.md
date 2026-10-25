# API reference

## Client

`createVibeQueryPlugin(client | { queryClient, queryClientConfig })` returns one plugin. `install` mounts the client, provides it, and unmounts it with the app. `useQueryClient()` reads that client. Pass an existing client to override the injected one.

`QueryClient` is the Query Core class. Construct it yourself when the app needs custom defaults, then pass that instance to the plugin.

## Queries

`useQuery(options)` and `useInfiniteQuery(options)` return a stable readonly view of the observer result. `queryKey` is required and must be an array. Infinite queries also require `initialPageParam` and `getNextPageParam`.

`useQueries({ queries, combine })` returns `{ results }`. Without `combine`, `results` is the raw observer array. With `combine`, `results` is that function's return value.

`useIsFetching(filters?)` and `useIsMutating(filters?)` return a `ComputedRef<number>`.

`queryOptions` and `infiniteQueryOptions` return the same object and brand `queryKey` for `DataTag` inference.

## Mutations

`useMutation(options)` returns the observer result plus `mutateAsync`, which is the same function as `mutate`. `mutationFn` may return a value or a promise. `optimisticMutation({ queryClient, keyFor, updater, invalidate })` cancels the query, snapshots it, writes the optimistic value, rolls back on error, and invalidates on settle unless `invalidate` is `false`.

## Contract

`@usevibejs/query/contract` exports `fromApiResult`, `unwrapApiResult`, and `ApiResultError`. A failed `ApiResult` becomes a thrown `ApiResultError` with `problem`, `response`, `code`, and `status`.

## Devtools

`useQueryDevtools()` subscribes to the query and mutation caches and keeps the latest 50 events. `QueryDevtools.vibe` renders that view.
