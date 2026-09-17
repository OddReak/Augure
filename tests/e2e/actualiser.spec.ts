import { expect, test } from '@playwright/test';

/**
 * Actualisation manuelle de l'accueil (§11, post-livraison — demandé) : la
 * pastille de gauche du chapeau remplace le partage (toujours accessible depuis
 * le menu du lieu) et force une vraie requête, sans attendre le seuil de cinq
 * minutes du §7.
 */
test.describe('Actualiser la météo (§11)', () => {
  test('déclenche une nouvelle requête, montre l’état en cours puis rend la main', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Sept jours')).toBeVisible();

    const requete = page.waitForRequest(/\/api\/current/);
    await page.getByRole('button', { name: 'Actualiser la météo' }).click();
    await requete;

    await expect(page.getByRole('button', { name: 'Actualisation en cours' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Actualiser la météo' })).toBeEnabled();
    // La donnée reste affichée tout du long, jamais d'écran vide ni d'erreur.
    await expect(page.getByText('Cestas')).toBeVisible();
  });

  test('le partage reste accessible depuis le menu du lieu', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Menu' }).click();
    await expect(page.getByRole('dialog').getByRole('button', { name: /Partager/ })).toBeVisible();
  });

  test('inerte hors ligne, où la requête ne pourrait jamais aboutir', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Sept jours')).toBeVisible();

    await page.context().setOffline(true);
    await expect(page.getByRole('button', { name: 'Actualiser la météo' })).toBeDisabled();

    await page.context().setOffline(false);
    await expect(page.getByRole('button', { name: 'Actualiser la météo' })).toBeEnabled();
  });
});
