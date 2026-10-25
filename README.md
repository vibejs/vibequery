# VibeQuery

**VibeQuery — Powerful Async State for Vibe.js.**

VibeQuery is a data-fetching and async state library for [Vibe.js](https://github.com/vibejs/vibejs).
It uses [`@tanstack/query-core`](https://tanstack.com/query) for caching, deduplication, retries,
garbage collection, and mutations, and connects that engine to Vibe's fine-grained reactivity.

The package name is `@usevibejs/query`.

## Install

```bash
pnpm add @usevibejs/query
```

`@usevibejs/ui` is a required peer. `@usevibejs/contract` is optional and is only needed for the
`@usevibejs/query/contract` entry.

## Quick start

```ts
import { createApp } from '@usevibejs/ui';
import { QueryClient, createVibeQueryPlugin } from '@usevibejs/query';
import App from './App.vibe';

const app = createApp(App);
app.use(createVibeQueryPlugin(new QueryClient()));
app.mount('#app');
```

```vibe
<script setup lang="ts">
import { useQuery } from '@usevibejs/query';

const user = useQuery({
  queryKey: ['user', 1],
  queryFn: async ({ signal }) => {
    const response = await fetch('/api/users/1', { signal });
    if (!response.ok) throw new Error('Request failed');
    return response.json() as Promise<{ name: string }>;
  },
});
</script>

<template>
  <p v-if="user.isPending">Loading</p>
  <p v-else-if="user.isError">{{ user.error.message }}</p>
  <p v-else>{{ user.data?.name }}</p>
</template>
```

Read `user.data` in the template or in a `computed` / `watch`. The object `useQuery` returns is
stable. Destructuring it copies the current values and those copies do not update.

## Entries

| Import                                         | Purpose                                      |
| ---------------------------------------------- | -------------------------------------------- |
| `@usevibejs/query`                             | Client, composables, cache helpers           |
| `@usevibejs/query/contract`                    | Turn a failed `ApiResult` into a query error |
| `@usevibejs/query/devtools`                    | Cache inspection composable                  |
| `@usevibejs/query/devtools/QueryDevtools.vibe` | Devtools panel                               |

Production bundles that never import the devtools or contract entries do not include them.

## Local development

The library is the repository root. Examples are workspace packages under `examples/`.

```bash
pnpm install
pnpm build
pnpm check
pnpm dev
```

## Documentation

- [Concepts](docs/concepts.md)
- [Queries](docs/queries.md)
- [Mutations](docs/mutations.md)
- [Infinite queries](docs/infinite.md)
- [Cache](docs/cache.md)
- [Optimistic updates](docs/optimistic.md)
- [Invalidation](docs/invalidation.md)
- [Contract clients](docs/contract.md)
- [TypeScript](docs/typescript.md)
- [Common mistakes](docs/mistakes.md)
- [Coming from TanStack Query](docs/migration.md)
- [API reference](docs/api.md)
- [Architecture](docs/architecture.md)
- [Contributing](CONTRIBUTING.md)

## License

MIT. See [LICENSE](LICENSE) and [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).
