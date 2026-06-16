import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Flask backend origin the dev server proxies /api and /static to.
// Override with BACKEND_URL when the backend runs elsewhere.
const BACKEND = process.env.BACKEND_URL || 'http://localhost:5000';

export default defineConfig(({ command }) => ({
  plugins: [react()],
  // Dev server is served from '/'; the production build is served by the
  // backend under Flask's /static/dist/.
  base: command === 'build' ? '/static/dist/' : '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': BACKEND,
      '/static': BACKEND,
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.js'],
  },
}));
