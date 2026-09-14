import { expect, test } from '@playwright/test';
import { CESTAS_AIR, CESTAS_ALERTES, CESTAS_COURANT, CESTAS_HORAIRE, CESTAS_QUOTIDIEN } from '../../src/mocks/fixtures/cestas';

/**
 * Phase 9, critère d'acceptation explicite (§8) : « test Playwright hors
 * ligne qui ouvre l'application et lit la dernière donnée connue ».
 *
 * Tourne contre un second build, sans `VITE_MOCK` (voir `playwright.config.ts`,
 * projet `pwa`) : c'est le seul contexte où le vrai service worker Workbox
 * s'enregistre (DECISIONS.md, « deux service workers, un seul actif » — sous
 * `VITE_MOCK=1`, le service worker MSW reste seul à contrôler la page pour ne
 * jamais perturber la suite principale). Sans clé Foreca, les réponses
 * `/api/*` sont fournies par `page.route` (interception réseau côté test,
 * pas un second service worker) le temps du premier chargement en ligne,
 * pour que le code réel de l'application (TanStack Query, son persisteur
 * IndexedDB) écrive lui-même le cache qu'il relira ensuite hors ligne.
 */
test.describe('Hors ligne — service worker réel (§9)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('précharge le socle applicatif en ligne, puis lit la dernière donnée connue sans réseau', async ({
    page,
    context,
  }) => {
    await page.route('**/api/current**', (route) => route.fulfill({ json: CESTAS_COURANT }));
    await page.route('**/api/hourly**', (route) => route.fulfill({ json: CESTAS_HORAIRE }));
    await page.route('**/api/daily**', (route) => route.fulfill({ json: CESTAS_QUOTIDIEN }));
    await page.route('**/api/air**', (route) => route.fulfill({ json: CESTAS_AIR }));
    await page.route('**/api/alerts**', (route) => route.fulfill({ json: CESTAS_ALERTES }));

    await page.goto('/');
    await expect(page.getByText('Sept jours')).toBeVisible();

    // Premier chargement : le service worker s'installe et s'active, mais ne contrôle
    // jamais la page qui l'a lui-même enregistré (règle du cycle de vie des service
    // workers, pas une particularité d'Augure) — il faut une seconde navigation, encore
    // en ligne, pour qu'il prenne effectivement la main avant de couper le réseau.
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await expect(page.getByText('Sept jours')).toBeVisible();
    await expect
      .poll(async () => page.evaluate(() => navigator.serviceWorker.controller !== null))
      .toBe(true);

    await context.setOffline(true);
    // Plus aucune réponse fabriquée par le test : seuls le service worker (socle) et le
    // persisteur IndexedDB (donnée) peuvent désormais répondre.
    await page.unrouteAll({ behavior: 'ignoreErrors' });
    await page.reload();

    await expect(page.getByText('Sept jours')).toBeVisible();
    await expect(page.locator('button', { hasText: 'Cestas' })).toBeVisible();
    await expect(page.getByText('28°', { exact: false }).first()).toBeVisible();
  });
});
