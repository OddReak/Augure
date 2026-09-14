import { expect, test } from '@playwright/test';

/**
 * Vue détaillée de la qualité de l'air (§11, post-livraison) : ouverte
 * depuis la frise horaire quand la métrique « Qualité air » est active —
 * signalé par l'utilisateur (« l'indice indique 1 pour chaque heure »),
 * cette vue donne le pourquoi (polluant dominant, détail par polluant) que
 * la seule bande 1-6 de la frise ne peut pas exprimer.
 */
test.describe('Qualité de l’air (§11)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('ouverte depuis la frise horaire, affiche le polluant dominant et le détail par polluant', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Qualité air' }).click();

    const lien = page.getByRole('link', { name: /détail/ });
    await expect(lien).toBeVisible();
    await lien.click();

    await expect(page).toHaveURL('/qualite-air');
    await expect(page.getByText('Qualité de l’air', { exact: true })).toBeVisible();
    await expect(page.getByText(/Polluant dominant/)).toBeVisible();
    await expect(page.getByText('Ozone', { exact: true })).toBeVisible();
    await expect(page.getByText("Dioxyde d'azote")).toBeVisible();
    await expect(page.getByText('Particules fines PM2,5')).toBeVisible();

    await page.getByRole('button', { name: 'Retour' }).click();
    await expect(page).toHaveURL('/');
  });
});
