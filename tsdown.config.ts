import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts', 'src/contract.ts', 'src/devtools.ts'],
  format: 'esm',
  outExtensions: () => ({ js: '.js', dts: '.d.ts' }),
  platform: 'neutral',
  target: 'es2022',
  dts: true,
  sourcemap: true,
  clean: true,
  deps: { neverBundle: ['@usevibejs/ui', '@usevibejs/contract', '@tanstack/query-core'] },
});
