# Architecture

VibeQuery does not reimplement a cache. `@tanstack/query-core` owns queries, mutations, retries, garbage collection, and focus or network refetch. This package binds those observers to a Vibe effect scope.

Each composable resolves options once, creates one observer, and subscribes. A `shallowRef` version counter bumps when the observer notifies or when options change. The public result is a `shallowReadonly` object whose data fields read the current observer result. Functions on the result stay stable and call the latest observer method. The result is not a deep reactive proxy, so query data is not wrapped again.

Option resolution tracks refs, computeds, and zero-argument getters on a fixed field list (`queryKey`, `enabled`, `staleTime`, and the other timing and key fields). It does not call `queryFn`, `select`, `initialData`, or `placeholderData` while reading options. Nested refs inside `queryKey` arrays are unwrapped. A getter that returns a promise throws `VibeQueryError`.

`watch` runs without `immediate`. The first subscription already used the initial options, so the watcher only pushes later changes through `setOptions`. Disposal of the scope unsubscribes that one observer.

The client is provided with an `InjectionKey`. `mount` and `unmount` are reference counted by Query Core, so two apps can share one client only when they share one plugin instance. Unmounting the app does not clear the cache.

`src/contract.ts` and `src/devtools.ts` are separate build entries. The main entry does not import them.
