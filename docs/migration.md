# Coming from TanStack Query

VibeQuery is an adapter. The cache, observers, and mutation engine are TanStack Query Core. Names such as `QueryClient`, `queryKey`, `staleTime`, `gcTime`, `invalidateQueries`, and `skipToken` mean the same thing.

What changes is the binding to the view:

- Install one client with `app.use(createVibeQueryPlugin(client))`. There is no process-wide singleton.
- Call `useQuery`, `useMutation`, `useInfiniteQuery`, and `useQueries` inside component setup or an effect scope.
- The returned object is stable. Read `query.data` in a template or script. Do not destructure it, and do not read `.value` on the result itself.
- Pass reactive keys and options as refs, computeds, or getters. The adapter subscribes once and calls `setOptions` when they change.
- `queryOptions` and `infiniteQueryOptions` live in `@usevibejs/query`. They are identity helpers; Query Core does not export them.
- Devtools and the contract helper are separate entry points, so a production bundle that does not import them does not include them.
