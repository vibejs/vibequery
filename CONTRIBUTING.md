# Contributing

Use Node ^24.15.0 or >=26 and pnpm 12.14.0. Run `pnpm install && pnpm build` before examples or tests that consume the package exports. `pnpm check` covers formatting, lint, strict TypeScript, `.vibe` component tests, 100% per-file adapter coverage and production package consumption.

`pnpm dev` opens the example gallery. Use focused branches and Conventional Commits (`feat:`, `fix:`, `test:`, `docs:`, `build:`). Never add attribution trailers.

Add a changeset with `pnpm changeset` for every user-visible change. Releases run from the Release workflow on main.

The library lives at the repository root, the same way `@usevibejs/table` does. Examples are workspace packages under `examples/` and depend on `@usevibejs/query` with `workspace:*`.
