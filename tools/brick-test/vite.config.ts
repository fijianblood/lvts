// Standalone build of the Noqublox brick test (not part of the website build):
//   npx vite build --config tools/brick-test/vite.config.ts
//   npx vite --config tools/brick-test/vite.config.ts   (to play it locally)
import { defineConfig } from 'vite';

export default defineConfig({
  root: __dirname,
  base: './',
  build: { outDir: 'dist', emptyOutDir: true },
});
