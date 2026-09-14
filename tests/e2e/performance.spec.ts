import { expect, test } from '@playwright/test';
import {
  CESTAS_COURANT,
  CESTAS_HORAIRE,
  CESTAS_QUOTIDIEN,
} from '../../src/mocks/fixtures/cestas';

/**
 * Phase 11, critère d'acceptation explicite (§8) : « premier rendu utile
 * sous 1,2 s en profil 4G simulé. » Mesuré contre `dist-pwa` (comme
 * `budget-bundle.spec.ts` et `hors-ligne-pwa.spec.ts`) — le seul build sans
 * `VITE_MOCK`, donc représentatif de ce qu'un navigateur télécharge en
 * production.
 *
 * `/api/current|hourly|daily` sont interceptées et servies avec les mêmes
 * fixtures Cestas que MSW (phase 3) — jamais une donnée inventée pour ce
 * test. Nécessaire parce que `vite preview` ne fait tourner aucune fonction
 * Vercel (§4.1, aucune clé Foreca disponible dans cet environnement, voir
 * JOURNAL.md) : sans cette interception, les trois requêtes échouent (404),
 * TanStack Query les rejoue une fois après le délai d'attente exponentiel
 * par défaut (~1 s, `retry: 1`, `lib/requetes.ts`), et la mesure capturerait
 * ce délai de nouvelle tentative plutôt que le budget de rendu réel — un
 * artefact de ce bac à sable, pas une propriété de l'application. Ce test
 * protège donc le budget de rendu propre à l'application (bundle, analyse,
 * exécution) ; la latence réelle de Foreca/Vercel en production reste, comme
 * le reste du projet, non vérifiée faute de clé (JOURNAL.md, ACTIONS.md).
 * `/api/position` répond 204 (comportement documenté hors infrastructure
 * Vercel, `api/position.ts`) : la chaîne de repli retombe sur Cestas, exactement
 * comme en production pour un premier visiteur sans position stockée.
 *
 * « 4G simulé » : le profil « 4G » standard (WebPageTest, Network Link
 * Conditioner) — 170 ms de latence, 9 Mb/s en réception comme en émission —
 * plutôt que le préréglage « Slow 4G » de Lighthouse (1,6 Mb/s), qui
 * simule délibérément une connexion 4G dégradée et non une 4G normale
 * (DECISIONS.md). CPU ralenti ×2 (mobile milieu de gamme), pas ×4 : ce
 * dernier reflète un appareil bas de gamme sous connexion déjà dégradée,
 * cumul que le document maître ne demande pas explicitement. Appliqué via
 * le CDP directement plutôt que le throttling intégré à `page.route` : ce
 * dernier ne simule ni la latence ni le CPU, seulement la bande passante.
 *
 * « Premier rendu utile » : la métrique standard qui s'en approche le plus
 * est le First Contentful Paint (Paint Timing API) — une fois les données
 * servies sans délai artificiel, l'écran d'accueil peint le héros dès la
 * première réponse (§7 : « pas de spinner au démarrage »), donc FCP
 * correspond ici au moment où la température et le paysage apparaissent.
 */

const BUDGET_MS = 1200;

// Débits en octets/s (CDP attend des octets, les préréglages usuels documentent des bits).
const RESEAU_4G = {
  offline: false,
  latency: 170,
  downloadThroughput: (9 * 1024 * 1024) / 8,
  uploadThroughput: (9 * 1024 * 1024) / 8,
};

test('premier rendu utile (First Contentful Paint) sous 1,2 s en 4G simulé', async ({ page }) => {
  await page.route('**/api/position*', (route) => route.fulfill({ status: 204, body: '' }));
  await page.route('**/api/current*', (route) => route.fulfill({ json: CESTAS_COURANT }));
  await page.route('**/api/hourly*', (route) => route.fulfill({ json: CESTAS_HORAIRE }));
  await page.route('**/api/daily*', (route) => route.fulfill({ json: CESTAS_QUOTIDIEN }));
  // Tolérées à l'échec par l'application elle-même (Promise.allSettled, phase 7) : laissées
  // sans réponse plutôt que fabriquer des fixtures d'air/alertes supplémentaires pour ce test.
  await page.route('**/api/air*', (route) => route.abort());
  await page.route('**/api/alerts*', (route) => route.abort());

  const session = await page.context().newCDPSession(page);
  await session.send('Network.enable');
  await session.send('Network.emulateNetworkConditions', RESEAU_4G);
  await session.send('Emulation.setCPUThrottlingRate', { rate: 2 });

  await page.goto('/');
  await expect(page.getByText('Sept jours')).toBeVisible();

  const fcp = await page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        const dejaLa = performance.getEntriesByName('first-contentful-paint')[0];
        if (dejaLa) {
          resolve(dejaLa.startTime);
          return;
        }
        new PerformanceObserver((liste) => {
          const entree = liste.getEntriesByName('first-contentful-paint')[0];
          if (entree) resolve(entree.startTime);
        }).observe({ type: 'paint', buffered: true });
      }),
  );

  expect(fcp, `First Contentful Paint mesuré à ${fcp.toFixed(0)} ms`).toBeLessThan(BUDGET_MS);
});
