import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
      '/query': {
        target: 'http://localhost',
        changeOrigin: true
      },
      '/api': {
        target: 'http://localhost',
        changeOrigin: true
      },
      '/onlyoffice': {
        target: 'http://localhost',
        changeOrigin: true,
        ws: true
      }
    }
  }
})
