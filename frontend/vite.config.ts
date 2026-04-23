import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Backend chạy 1 port (trùng với PORT trong backend/.env, mặc định 3000)
const BACKEND_URL = 'http://localhost:3000';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: false,
        timeout: 30000,
        configure: (proxy) => {
          proxy.on('error', (err, _req, res) => {
            console.warn('[vite proxy] backend error:', err.message);
            try {
              (res as any).writeHead(502, { 'Content-Type': 'application/json' });
              (res as any).end(JSON.stringify({ message: 'Backend unreachable. Is the server running on ' + BACKEND_URL + '?' }));
            } catch (_) { }
          });
          proxy.on('proxyRes', (proxyRes, req) => {
            if (proxyRes.statusCode === 404 || proxyRes.statusCode === 500) {
              console.warn('[vite proxy]', proxyRes.statusCode, req.method, req.url);
            }
          });
        },
      },
      '/uploads': {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: false,
        timeout: 10000,
      },
      '/ws': {
        target: BACKEND_URL,
        ws: true,
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
