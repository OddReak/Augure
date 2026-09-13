import { expect, test } from '@playwright/test';

/**
 * Phase 8, critères d'acceptation explicites (§8) :
 * « les lieux survivent à un rechargement » et « l'écran Mes lieux affiche
 * six paliers distincts simultanément ».
 */

const VILLES_DEMO = ['Rennes', 'Annecy', 'Toulouse', 'Chamonix', 'Séville'];

test.describe('Mes lieux (§8)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('recherche et ajout de cinq lieux, six paliers distincts, persistance au rechargement', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Cestas', exact: true }).click();
    await expect(page).toHaveURL('/mes-lieux');

    for (const ville of VILLES_DEMO) {
      await page.getByRole('button', { name: 'Ajouter', exact: true }).click();
      await expect(page).toHaveURL('/recherche');
      await page.getByLabel('Rechercher une ville').fill(ville);
      const resultat = page.getByRole('button', { name: new RegExp(`^${ville}`) });
      await expect(resultat).toBeVisible();
      await resultat.click();
      await expect(page).toHaveURL('/mes-lieux');
    }

    // Six paliers distincts : la position live (Cestas → vigies) et les cinq lieux ajoutés
    // (ondee, veille, colere, cendre, fournaise — voir tests/unit/demo-lieux.test.ts).
    await expect
      .poll(async () =>
        new Set(
          await page.locator('[data-palier]').evaluateAll((els) => els.map((e) => e.getAttribute('data-palier'))),
        ).size,
      )
      .toBe(6);

    for (const ville of VILLES_DEMO) {
      await expect(page.getByText(ville, { exact: true })).toBeVisible();
    }

    await page.reload();
    for (const ville of VILLES_DEMO) {
      await expect(page.getByText(ville, { exact: true })).toBeVisible();
    }
  });
});
