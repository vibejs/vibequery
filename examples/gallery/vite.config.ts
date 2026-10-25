import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import { vibe } from '@usevibejs/compiler/vite';
import { defineConfig } from 'vite';

const vibecn = fileURLToPath(new URL('../../../vibecn/registry', import.meta.url));

export default defineConfig({
  plugins: [vibe(), tailwindcss()],
  resolve: {
    alias: {
      '@vibecn': `${vibecn}/ui`,
      __VIBECN_UTILS__: `${vibecn}/lib/utils.ts`,
    },
  },
  build: { target: 'es2022' },
});
