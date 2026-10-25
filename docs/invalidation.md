# Invalidation

Invalidation tells active observers that their data is stale and starts a refetch.

```ts
await client.invalidateQueries({ queryKey: ['todos'] });
```

The filter matches queries whose key starts with the filter key. `{ queryKey: ['todos'] }` matches
`['todos']` and `['todos', 1]`. It does not match a shorter key.

`optimisticMutation` invalidates on settle by default, so a successful write is replaced by the
server response. Set `invalidate: false` when the mutation response is already the cache value you
want to keep.

`refetch()` on a query result refreshes that subscription only. Invalidation is the right tool when
several components share the key.

A background refetch keeps the previous `data` and sets `isFetching`. `isPending` stays false.
`placeholderData: keepPreviousData` is a different feature: it keeps the previous key's data visible
while the next key loads, and `isPlaceholderData` is true.
