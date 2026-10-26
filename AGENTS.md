# VibeQuery

Use public Vibe.js APIs and TanStack Query Core APIs only. Do not import `@usevibejs/ui/internal`.
English only. Strict TypeScript. Relative TypeScript imports end in `.ts`.
Run `pnpm check` before completion. Runtime source has 100% per-file coverage.
Releases go through changesets and .github/workflows/release.yml. Add a changeset for every user-visible change.
Never publish packages or create remote resources without an explicit release request.
The gallery uses vibecn components copied into `examples/gallery/src/components/ui` with the vibecn CLI. Do not reference sibling repositories.
Never add Co-Authored-By, Signed-off-by, Generated-by or AI attribution trailers to commits.
