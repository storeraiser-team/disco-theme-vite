import { defineConfig } from 'vite';
import shopify from 'vite-plugin-shopify';

export default defineConfig({
  plugins: [
    shopify({
      snippetFile: 'vite-tag.liquid',
      // Customizar o template do snippet gerado
      themeRoot: './',
      sourceCodeDir: 'frontend',
      entrypointsDir: 'frontend/entrypoints',
    }),
  ],
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
    allowedHosts: ['.trycloudflare.com', '.myshopify.com', '.shopify.com', 'localhost', '127.0.0.1'],
    cors: {
      origin: [
        /^https?:\/\/(?:(?:[^:]+\.)?localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/,
        /\.myshopify\.com$/,
        /\.shopify\.com$/,
        /\.trycloudflare\.com$/,
      ],
    },
  },
});
