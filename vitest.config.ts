import { resolve } from 'node:path';
import { vibe } from '@usevibejs/compiler/vite';
import { defineConfig } from 'vitest/config';

const sourceAlias = [
  { find: '@usevibejs/query/contract', replacement: resolve('src/contract.ts') },
  { find: '@usevibejs/query/devtools', replacement: resolve('src/devtools.ts') },
  { find: '@usevibejs/query', replacement: resolve('src/index.ts') },
];

export default defineConfig({
  test: {
    projects: [
      {
        resolve: { alias: sourceAlias },
        test: {
          name: 'unit',
          environment: 'jsdom',
          include: ['src/**/*.test.ts'],
          setupFiles: ['test/setup.ts'],
        },
      },
      {
        resolve: { alias: sourceAlias },
        plugins: [vibe()],
        test: {
          name: 'components',
          environment: 'jsdom',
          include: ['test/**/*.vibe.test.ts'],
          setupFiles: ['test/setup.ts'],
        },
      },
      {
        plugins: [vibe()],
        resolve: {
          alias: [{ find: '@vibecn', replacement: resolve('examples/gallery/src/components/ui') }],
        },
        test: {
          name: 'integration',
          environment: 'jsdom',
          include: ['test/**/*.integration.test.ts', 'examples/gallery/test/**/*.test.ts'],
          setupFiles: ['test/setup.ts'],
          testTimeout: 30_000,
        },
      },
    ],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['**/*.test.ts', '**/*.test-d.ts', 'src/test-utils.ts'],
      thresholds: { 100: true, perFile: true },
    },
  },
});
