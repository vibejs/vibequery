# Third-party notices

VibeQuery adapts [TanStack Query](https://tanstack.com/query) for Vibe.js.
The published package depends on `@tanstack/query-core` 5.104.5, which is
licensed under the MIT License. Copyright for that project belongs to its
respective holders. The license text is included with the installed package
at `node_modules/@tanstack/query-core/LICENSE`.

VibeQuery does not copy Query Core's cache, scheduler, or mutation state
machine. Those behaviors come from the dependency above.
