import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': new URL('.', import.meta.url).pathname },
  },
  server: {
    port: 3000,
    proxy: {
      // PHP backend for local development: run `php -S 127.0.0.1:8099 -t …`
      // (see README) or point PHP_ORIGIN at the deployed site.
      '/api': { target: process.env.PHP_ORIGIN ?? 'http://127.0.0.1:8099', changeOrigin: true },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
  },
});
