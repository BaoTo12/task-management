import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig, type ProxyOptions } from 'vite';

/**
 * S48 (48.02): where /api/… goes. The browser always calls /api/… on the Vite origin (same origin: no CORS, 47.11),
 * and Vite forwards it to the real backend: Tomcat on :8081, context /taskflow (DevServer or docker compose).
 */
const tomcat: ProxyOptions = {
  // 8081, not the course's 8080: the local Apache httpd owns 8080. TASKFLOW_BACKEND overrides it.
  target: process.env.TASKFLOW_BACKEND ?? 'http://localhost:8081',
  // /api/tasks → /taskflow/api/tasks: the web app lives under its context path (28.10).
  rewrite: (path) => `/taskflow${path}`,
  // Tomcat's JSESSIONID says Path=/taskflow, but the browser only ever sees /api/… on this origin: without this,
  // the session cookie would be stored and never sent back, and every call after login would be a 401 (48.05).
  cookiePathRewrite: { '/taskflow': '/' },
};
const apiProxy: Record<string, string | ProxyOptions> = {
  '/api': tomcat,
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // '@/…' = src/…: cross-feature and shared imports don't depend on how deep the importing file is.
      // Mirrored in tsconfig.app.json "paths" (TypeScript) — keep the two in sync.
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // Test fixtures (tests/helpers), never imported by src/.
      '@tests': fileURLToPath(new URL('./tests', import.meta.url)),
      // The shared design system lives outside the frontend folder (taskflow/styles).
      '@styles': fileURLToPath(new URL('../styles', import.meta.url)),
    },
  },
  server: { proxy: apiProxy },
  preview: { proxy: apiProxy },
});
