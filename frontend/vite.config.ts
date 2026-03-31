import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api/v1': {
        target: process.env.VITE_API_BASE_URL ?? 'http://localhost:8080',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.error('[proxy error]', err);
          });
        },
      },
    },
  },
});
