# Vibe.js contract clients

`@usevibejs/contract` calls resolve to an `ApiResult`. HTTP failures, network failures, and aborted
requests do not reject. Query Core only records a failure when `queryFn` or `mutationFn` throws or
rejects, so pass the result through `@usevibejs/query/contract`.

```ts
import { fromApiResult } from '@usevibejs/query/contract';

const profile = useQuery({
  queryKey: ['profile', id],
  queryFn: ({ signal }) =>
    fromApiResult(api.directory.one({ params: { id: id.value } }, { signal })),
});
```

`fromApiResult` returns the success data and preserves its type. A failed result becomes an
`ApiResultError` whose `message` is `detail` or `title`, with `code`, `status`, `problem`, and
`response`. `unwrapApiResult` does the same step synchronously.

This entry is not imported by the main package. Applications that only use `fetch` do not pay for
it, and they do not need `@usevibejs/contract` installed.

The helper is structural. It accepts an `ApiResult` without forcing every query through a contract
client.
