import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import { vibe } from '@usevibejs/compiler/vite';
import { defineConfig } from 'vite';

const components = fileURLToPath(new URL('./src/components/ui', import.meta.url));

export default defineConfig({
  plugins: [vibe(), tailwindcss()],
  resolve: {
    alias: { '@vibecn': components },
  },
  build: { target: 'es2022' },
});
