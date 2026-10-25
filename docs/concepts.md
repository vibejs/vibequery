# Concepts

A query is a cached request identified by a `queryKey`. Every component that subscribes to the same
key on the same `QueryClient` shares one cache entry and one in-flight request.

VibeQuery does not keep a second copy of that state. `useQuery` subscribes to a `QueryObserver`.
When the observer notifies, a version ref changes and the stable result object reads
`getCurrentResult()` again. Templates that read `data`, `error`, or a status flag update. Cache
data is not wrapped in a deep reactive proxy.

## The client belongs to the app

`createVibeQueryPlugin(client)` provides that client with `app.provide` and calls `client.mount()`.
`app.unmount()` calls `client.unmount()`. Mounting is reference-counted, so two apps can share one
client and the focus and online listeners disconnect only after both apps unmount. The cache itself
is not cleared on unmount.

There is no process-wide client. Two plugins built from different clients cannot see each other's
queries. Pass an existing `QueryClient` to the plugin, or let the plugin construct one from
`queryClientConfig`. The client is created when the plugin is created, not on every `app.use()`.

`useQueryClient()` reads the client from the current injection context. `useQueryClient(client)`
returns that client directly, which is useful in tests.

## What is reactive

`useQuery`, `useInfiniteQuery`, `useMutation`, and `useQueries` accept a plain options object, a
ref, a computed ref, or a getter. Inside the object, refs are unwrapped. These fields also accept a
zero-argument getter, and that getter is tracked:

`enabled`, `gcTime`, `initialPageParam`, `maxPages`, `mutationKey`, `networkMode`, `queryKey`,
`refetchInterval`, `refetchIntervalInBackground`, `refetchOnMount`, `refetchOnReconnect`,
`refetchOnWindowFocus`, `retryOnMount`, `staleTime`.

A function that declares a parameter is left for Query Core. `enabled: (query) => query.isStale()`
is not called while options are read, so refs used only inside it are not tracked. Read those refs
in the options getter or in a zero-argument getter.

`queryFn`, `mutationFn`, `select`, `initialData`, `placeholderData`, `retry`, `retryDelay`, and the
page-param callbacks are never called while options are read.

## Lifecycle

The observer is created and subscribed once. Later option changes call `setOptions`. Destroying the
component scope, or the effect scope that called the composable, unsubscribes. That drops the
observer. Query Core then applies `gcTime` to the unused cache entry.

A mutation that has already started keeps running after the component unmounts. `useIsMutating`
still counts it.
