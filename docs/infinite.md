# Infinite queries

```ts
const feed = useInfiniteQuery({
  queryKey: ['feed', filter],
  initialPageParam: 0,
  queryFn: ({ pageParam, signal }) => fetchPage(pageParam, signal),
  getNextPageParam: (last) => last.next,
  getPreviousPageParam: (first) => first.previous,
  maxPages: 10,
});

await feed.fetchNextPage();
```

`initialPageParam` and `getNextPageParam` are required. `0` and `null` are valid cursors because
the check is `Object.hasOwn`, not truthiness. `initialPageParam` may be a ref or a zero-argument
getter.

`data` is `{ pages, pageParams }` unless `select` returns something else. `hasNextPage` follows
`getNextPageParam`. `fetchNextPage` and `fetchPreviousPage` stay bound to this subscription.

Changing `queryKey` starts a new infinite query. Page cursors belong in the param callbacks, not in
the key, unless a filter should discard the loaded pages.
