import { defineConfig, devices } from '@playwright/test';

const RESERVER = !process.env.CI;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
  },
  projects: [
    // Suite principale : VITE_MOCK=1 (fixtures MSW, §3) — voir le commentaire du premier
    // webServer. `hors-ligne-pwa.spec.ts` tourne à part (second projet ci-dessous) : le vrai
    // service worker Workbox ne s'enregistre jamais sous VITE_MOCK (DECISIONS.md, « deux
    // service workers, un seul actif ») et ce test a justement besoin qu'il s'enregistre.
    { name: 'chromium', use: { ...devices['Desktop Chrome'] }, testIgnore: /hors-ligne-pwa\.spec\.ts/ },
    {
      name: 'pwa',
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:4174' },
      testMatch: /hors-ligne-pwa\.spec\.ts/,
    },
  ],
  webServer: [
    {
      // VITE_MOCK=1 : les fonctions /api/* de la phase 7 n'existent pas encore côté `vite preview`,
      // le parcours e2e tourne donc contre les fixtures MSW (§3), comme en développement.
      command: 'pnpm build && pnpm preview',
      env: { VITE_MOCK: '1' },
      url: 'http://localhost:4173',
      reuseExistingServer: RESERVER,
      timeout: 120_000,
    },
    {
      // Build de production réel, sans VITE_MOCK : seul contexte où le service worker
      // Workbox s'enregistre réellement (phase 9) — `outDir`/port séparés pour ne pas
      // écraser le build mocké ci-dessus ni se disputer le port.
      command: 'pnpm build --outDir dist-pwa && pnpm preview --outDir dist-pwa --port 4174',
      url: 'http://localhost:4174',
      reuseExistingServer: RESERVER,
      timeout: 120_000,
    },
  ],
});
