import { expect, test } from '@playwright/test';

/**
 * §10 : l'interrupteur « Résumé du lendemain » reflète l'état réel de
 * l'abonnement Push (même principe que « Position en direct », phase 8 :
 * jamais un faux interrupteur), et sur iOS hors mode autonome, ouvre la
 * feuille d'installation au lieu de demander une permission qui échouerait
 * en silence (§10, contrainte iOS).
 */
test.describe('Réglages — notifications (§10)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('tente réellement l’abonnement et rapporte l’échec sans clés Supabase configurées', async ({ page }) => {
    await page.goto('/reglages');

    const interrupteur = page.getByRole('switch', { name: 'Résumé du lendemain' });
    await expect(interrupteur).toHaveAttribute('aria-checked', 'false');
    await expect(page.getByText('Désactivé')).toBeVisible();

    await interrupteur.click();

    // Aucune clé Supabase configurée dans ce build (VITE_MOCK) : l'échec est réel et
    // visible, pas un succès simulé — voir src/lib/push.ts.
    await expect(page.getByText(/Supabase non configuré/)).toBeVisible();
    await expect(interrupteur).toHaveAttribute('aria-checked', 'false');
  });

  test('sur iOS hors mode autonome, ouvre la feuille d’installation plutôt que de demander la permission', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'userAgent', {
        configurable: true,
        get: () =>
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
      });
    });

    await page.goto('/reglages');
    const interrupteur = page.getByRole('switch', { name: 'Résumé du lendemain' });

    await interrupteur.click();

    // Ouverte dès le premier clic malgré la première ouverture (§7, §10 : « à la deuxième
    // ou troisième ouverture » ne s'applique qu'à la proposition spontanée, pas à celle-ci).
    await expect(page.getByRole('dialog', { name: 'Installer Augure' })).toBeVisible();
    await expect(interrupteur).toHaveAttribute('aria-checked', 'false');
  });
});
