import { expect, test } from '@playwright/test';

/**
 * §7, §9, mockup `feuilleInstall()` : « affiche la feuille à la deuxième ou
 * troisième ouverture, jamais à la première ». iOS Safari uniquement ici
 * (Chrome/Android dépend de `beforeinstallprompt`, que Chromium headless ne
 * déclenche pas de façon fiable — non couvert par ce test, voir DECISIONS.md).
 */
test.describe('Feuille d’installation — iOS Safari (§7, §9)', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
  });

  test('jamais à la première ouverture, proposée à la deuxième, écartée pour de bon par « J’ai compris »', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByText('Sept jours')).toBeVisible();
    await expect(page.getByRole('dialog', { name: 'Installer Augure' })).toHaveCount(0);

    await page.reload();
    const feuille = page.getByRole('dialog', { name: 'Installer Augure' });
    await expect(feuille).toBeVisible();
    await expect(feuille.getByText('Touchez Partager')).toBeVisible();
    await expect(feuille.getByText('Sur l’écran d’accueil', { exact: false })).toBeVisible();

    await feuille.getByRole('button', { name: 'J’ai compris' }).click();
    await expect(feuille).toHaveCount(0);

    await page.reload();
    await expect(page.getByRole('dialog', { name: 'Installer Augure' })).toHaveCount(0);
  });
});
