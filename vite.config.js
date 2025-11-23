import { defineConfig } from 'vite';
import { qwikVite } from '@builder.io/qwik/optimizer';

export default defineConfig({
  plugins: [
    qwikVite({
      client: {
        input: ['src/entry.jsx'],
      },
      ssr: {
        input: ['src/entry.ssr.jsx'],
      },
    }),
  ],
  build: {
    target: 'es2020',
    outDir: 'dist',
  },
  resolve: {
    alias: {
      '~': '/src',
    },
  },
  preview: {
    headers: {
      'Cache-Control': 'public, max-age=600',
    },
  },
  dev: {
    headers: {
      'Cache-Control': 'public, max-age=0',
    },
  },
});


