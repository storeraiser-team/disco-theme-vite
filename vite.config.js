import { defineConfig } from 'vite';
import shopify from 'vite-plugin-shopify';

export default defineConfig({
  plugins: [shopify()],
  build: {
    emptyOutDir: false,
    rollupOptions: {
      output: {
        entryFileNames: '[name]-disco.js',
        chunkFileNames: '[name]-disco.js',
        assetFileNames: '[name]-disco.[ext]',
      },
    },
  },
  server: {
    cors: true,
    hmr: {
      host: 'localhost',
    },
  },
});
