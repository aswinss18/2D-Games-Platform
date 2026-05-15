import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  root: __dirname,
  server: {
    host: '0.0.0.0',
    port: 4200,
  },
  preview: {
    host: '0.0.0.0',
    port: 4300,
  },
  build: {
    outDir: resolve(__dirname, '../../dist/apps/ss-run'),
    emptyOutDir: true,
  },
});
