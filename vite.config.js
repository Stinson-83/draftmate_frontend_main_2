import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  base: process.env.VITE_BASE_PATH || "/",
  server: {
    host: true,
    allowedHosts: true,
    proxy: {
      '/drafter': {
        target: 'http://localhost:8003',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/drafter/, '')
      },
      '/lexbot': {
        target: 'http://localhost:8004',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/lexbot/, '')
      },
      '/auth': {
        target: 'http://localhost:8009',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/auth/, '')
      },
      '/query': {
        target: 'http://localhost:8001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/query/, '')
      },
      '/converter': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/converter/, '')
      },
      '/pdf': {
        target: 'http://localhost:8005',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/pdf/, '')
      },
      '/notification': {
        target: 'http://localhost:8015',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/notification/, '')
      },
      '/case_search': {
        target: 'http://localhost:8006',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/case_search/, '')
      },
      '/onlyoffice': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        ws: true,
        rewrite: (path) => path.replace(/^\/onlyoffice/, ''),
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            const host = req.headers.host || 'localhost:5173';
            proxyReq.setHeader('X-Forwarded-Host', `${host}/onlyoffice`);
            proxyReq.setHeader('X-Forwarded-Proto', 'http');
          });
        }
      }
    }
  }
})