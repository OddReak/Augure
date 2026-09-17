import { expect, test } from '@playwright/test';

/**
 * Écran de lancement (§7, post-livraison — `src/app/EcranLancement.tsx`).
 * Ce que le test protège n'est pas l'esthétique mais le contrat : l'écran
 * tient le lancement, il se retire, et il ne laisse rien derrière lui — ni
 * nœud, ni capture d'événement. Un écran d'attente qui resterait monté
 * bloquerait toute l'application sans qu'aucun autre test ne s'en aperçoive
 * (Playwright attend l'actionnabilité, il ne fait qu'échouer en fin de délai).
 */

const ECRAN = '[data-ecran-lancement]';

test.describe('Écran de lancement (§7)', () => {
  test('tient le lancement, se retire, et rend la main à l’accueil', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator(ECRAN)).toBeVisible();
    // Le palier est posé avant le premier rendu (`main.tsx`) : l'écran ne peint
    // jamais en `vigies` pour basculer ensuite.
    await expect(page.locator('html')).toHaveAttribute('data-palier', /.+/);

    await expect(page.locator(ECRAN)).toHaveCount(0, { timeout: 10_000 });
    await expect(page.getByText('Cestas')).toBeVisible();
    // La pastille du chapeau redevient réellement cliquable : plus rien ne
    // couvre l'accueil.
    await page.getByRole('button', { name: 'Menu' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('ne s’affiche pas sur un lien profond, qui n’attend aucune prévision', async ({ page }) => {
    await page.goto('/reglages');
    await expect(page.locator(ECRAN)).toHaveCount(0);
  });
});
