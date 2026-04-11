/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import viteCompression from 'vite-plugin-compression';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  if (mode !== 'test' && !env.VITE_API_BASE_URL) {
    console.warn('\x1b[33m⚠ VITE_API_BASE_URL not set — using default http://localhost:8080\x1b[0m');
  }

  return {
    plugins: [
      react(),
      viteCompression({ algorithm: 'gzip', threshold: 1024 }),
      viteCompression({ algorithm: 'brotliCompress', threshold: 1024, ext: '.br' }),
      ...(process.env.ANALYZE
        ? [visualizer({ open: true, gzipSize: true, filename: 'dist/stats.html' })]
        : []),
    ],
    test: {
      globals: true,
      environment: 'jsdom',
      include: ['src/**/*.test.{ts,tsx}'],
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-mantine': [
              '@mantine/core',
              '@mantine/hooks',
              '@mantine/form',
              '@mantine/notifications',
              '@mantine/modals',
            ],
            'vendor-redux': [
              '@reduxjs/toolkit',
              'react-redux',
            ],
          },
        },
      },
    },
    server: {
      port: 3000,
      proxy: {
        '/api/v1': {
          target: env.VITE_API_BASE_URL || 'http://localhost:8080',
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on('error', (err) => {
              console.error('[proxy error]', err);
            });
          },
        },
      },
    },
  };
});
