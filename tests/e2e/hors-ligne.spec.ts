import { expect, test } from '@playwright/test';

/**
 * §8bis (« chaque écran a son état hors ligne, dessiné ») et mockup
 * `ecranHorsLigne()` : bandeau plein encre/papier sous le chapeau, sous-titre
 * du chapeau remplacé par l'âge de la donnée, dès que le navigateur signale
 * qu'il n'est plus en ligne — la donnée déjà chargée reste affichée.
 */
test.describe('Hors ligne (§8bis)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('le bandeau apparaît hors ligne et disparaît de retour en ligne, sans perdre la donnée affichée', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByText('Sept jours')).toBeVisible(); // attend la donnée réelle, pas l'écran vide initial.

    await expect(page.getByText('Hors ligne', { exact: false })).toHaveCount(0);

    await page.context().setOffline(true);

    await expect(page.getByText('Hors ligne. Dernier relevé à 15:00.')).toBeVisible();
    await expect(page.getByText(/données d’il y a/)).toBeVisible();
    // La donnée déjà chargée reste affichée, seul un bandeau s'ajoute (le sous-titre
    // du chapeau change, mais le nom du lieu et la température restent visibles).
    await expect(page.locator('button', { hasText: 'Cestas' })).toBeVisible();

    await page.context().setOffline(false);
    await expect(page.getByText('Hors ligne', { exact: false })).toHaveCount(0);
  });
});
