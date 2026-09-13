import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // es2022 : le top-level await de main.tsx (démarrage conditionnel du worker MSW,
  // §3 VITE_MOCK) le requiert. Couvre largement iOS 16.4+ (cible réelle de la PWA).
  build: {
    target: 'es2022',
  },
  server: {
    host: true,
    allowedHosts: ['.app.github.dev'],
  },
  test: {
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.{ts,tsx}', 'src/**/*.test.{ts,tsx}'],
    globals: false,
  },
});
