import { expect, test } from '@playwright/test';

/**
 * Phase 8, critère d'acceptation explicite (§8) : « permission accordée
 * puis refusée ». Chromium headless ne simule pas de façon fiable l'API
 * Permissions elle-même (par opposition à `getCurrentPosition`), donc le
 * test intercepte `navigator.permissions.query` — exactement la fonction
 * que `src/lib/position.ts` interroge — plutôt que le mécanisme natif.
 * L'état simulé vit dans `localStorage` (pas une variable de script
 * d'initialisation) pour survivre au rechargement de la page.
 */

const CLE_ETAT_TEST = '__etatPermissionTest';

test.describe('Réglages — position (§8)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('reflète successivement la permission accordée puis refusée', async ({ page }) => {
    await page.addInitScript((cle) => {
      Object.defineProperty(window.navigator, 'permissions', {
        configurable: true,
        value: {
          query: (params: PermissionDescriptor) =>
            Promise.resolve({
              state: params.name === 'geolocation' ? (localStorage.getItem(cle) ?? 'granted') : 'granted',
            } as PermissionStatus),
        },
      });
    }, CLE_ETAT_TEST);

    await page.goto('/reglages');
    await expect(page.getByText('Autorisée', { exact: true })).toBeVisible();

    await page.evaluate((cle) => localStorage.setItem(cle, 'denied'), CLE_ETAT_TEST);
    await page.reload();

    await expect(page.getByText(/Refusée/)).toBeVisible();
    await expect(page.getByText(/Réglages iOS/)).toBeVisible();
  });
});
