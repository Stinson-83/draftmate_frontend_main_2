import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendTarget = env.BACKEND_API_URL || 'http://ecs-express-gateway-alb-220524834.ap-south-1.elb.amazonaws.com';
  const onlyofficeTarget = env.ONLYOFFICE_API_URL || 'http://localhost:8081';

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    base: env.VITE_BASE_PATH || "/",
    server: {
      host: true,
      allowedHosts: true,
      watch: {
        ignored: [
          '**/node_modules/**',
          '**/backend/**',
          '**/.git/**',
          '**/shared_drafts/**',
          '**/dist/**',
          '**/.github/**',
        ]
      },
      proxy: {
        '/drafter': {
          target: backendTarget,
          changeOrigin: true,
        },
        '/lexbot': {
          target: backendTarget,
          changeOrigin: true,
        },
        '/auth': {
          target: backendTarget,
          changeOrigin: true,
        },
        '/query': {
          target: backendTarget,
          changeOrigin: true,
        },
        '/converter': {
          target: backendTarget,
          changeOrigin: true,
        },
        '/pdf': {
          target: backendTarget,
          changeOrigin: true,
        },
        '/notification': {
          target: backendTarget,
          changeOrigin: true,
        },
        '/case_search': {
          target: backendTarget,
          changeOrigin: true,
        },
        '/translator': {
          target: backendTarget,
          changeOrigin: true,
        },
        '/subscriptions': {
          target: backendTarget,
          changeOrigin: true,
        },
        '/library-api': {
          target: backendTarget,
          changeOrigin: true,
        },
        '/workflow': {
          target: backendTarget,
          changeOrigin: true,
        },
        '/advocate-api': {
          target: backendTarget,
          changeOrigin: true,
        },
        '/onlyoffice': {
          target: onlyofficeTarget,
          changeOrigin: true,
          ws: true,
          rewrite: (path) => path.replace(/^\/onlyoffice/, ''),
          configure: (proxy, options) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              const host = req.headers.host || 'localhost:5173';
              proxyReq.setHeader('X-Forwarded-Host', `${host}/onlyoffice`);
              proxyReq.setHeader('X-Forwarded-Proto', 'http');
            });
            proxy.on('proxyReqWs', (proxyReq, req, socket, options, head) => {
              const host = req.headers.host || 'localhost:5173';
              proxyReq.setHeader('X-Forwarded-Host', `${host}/onlyoffice`);
              proxyReq.setHeader('X-Forwarded-Proto', 'http');
            });
          }
        },
        '/doc': {
          target: onlyofficeTarget,
          changeOrigin: true,
          ws: true,
        },
        '/heartbeat': {
          target: onlyofficeTarget,
          changeOrigin: true,
        },
        '/info': {
          target: onlyofficeTarget,
          changeOrigin: true,
        }
      }
    }
  }
})