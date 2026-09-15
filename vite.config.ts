import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const TAILLES_ICONES = [72, 96, 128, 144, 152, 192, 384, 512];

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // PWA (§3, §9) : Workbox, `registerType: 'prompt'` — jamais de skipWaiting()
    // inconditionnel (§9, interdits). `injectRegister: false` : l'enregistrement du
    // service worker est déclenché nous-mêmes, depuis React (`RegistreurPwa.tsx`),
    // après le démarrage de MSW en mode `VITE_MOCK` — jamais avant (voir DECISIONS.md,
    // « deux service workers, un seul actif »).
    // `injectManifest` (pas `generateSW`, le défaut) : la notification quotidienne
    // (§10) a besoin d'un vrai gestionnaire `push` dans le service worker pour
    // afficher la notification reçue, du code personnalisé que `generateSW`
    // n'autorise pas — voir `src/sw.ts` (JOURNAL.md, absence de notification à
    // l'heure prévue).
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      includeAssets: ['fonts/*.woff2'],
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,woff2,png}'],
        globIgnores: ['mockServiceWorker.js'],
      },
      manifest: {
        id: '/',
        name: 'Augure',
        short_name: 'Augure',
        description: 'Météo, sans compte, avec notification quotidienne.',
        lang: 'fr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        // Palier « vigies » (§5.2), palier par défaut avant toute donnée météo (Layout.tsx) —
        // --ciel et --papier recopiés de jetons.css.
        background_color: '#fbebcb',
        theme_color: '#f5c044',
        icons: [
          ...TAILLES_ICONES.map((taille) => ({
            src: `/icons/icon-${taille}.png`,
            sizes: `${taille}x${taille}`,
            type: 'image/png',
          })),
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
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
