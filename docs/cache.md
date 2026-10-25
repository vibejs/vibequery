# Cache

`QueryClient` is re-exported from Query Core. Use it for imperative work:

```ts
await client.prefetchQuery({ queryKey: ['user', id], queryFn: fetchUser });
client.setQueryData(['user', id], next);
await client.invalidateQueries({ queryKey: ['user'] });
await client.cancelQueries({ queryKey: ['user', id] });
const data = client.getQueryData(['user', id]);
```

`invalidateQueries` marks matching queries stale and refetches the active ones.
`cancelQueries` aborts an in-flight fetch when the query function read `context.signal`.
`prefetchQuery` writes the cache without an observer. A later `useQuery` with the same key reuses
that value and refetches when it is stale.

`staleTime` keeps a successful result fresh so focus, mount, and a new observer do not refetch.
`gcTime` removes an unused entry after the last observer unsubscribes. Both are disabled while
Query Core treats the environment as a server. Tests in this repository force
`environmentManager.setIsServer(() => false)` because Node evaluates that flag at import time.

`dehydrate` and `hydrate` are re-exported for passing a cache between requests. Focus and online
state are process-wide managers from Query Core. Reset them between tests if a test changes them.

Import `QueryClient` from `@usevibejs/query`. A second copy of `@tanstack/query-core` would make
`instanceof` checks fail.
