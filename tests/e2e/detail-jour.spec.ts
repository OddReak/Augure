import { expect, test } from '@playwright/test';

/**
 * Phase 8 (§6, `ecranDetail()`) : ouverture du détail d'un jour depuis la
 * ligne des sept jours. §11, post-livraison : devenu une feuille (comme le
 * menu du lieu), pas une navigation — demandé par l'utilisateur, voir
 * DECISIONS.md. Plus de changement d'URL à vérifier : une boîte de dialogue
 * apparaît sur l'accueil et se referme sur elle-même.
 */

test.describe('Détail d’un jour (§11)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('ouvre le détail depuis les sept jours en feuille et se referme sans naviguer', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Sept jours')).toBeVisible();

    // La première ligne des sept jours est aujourd'hui (samedi 19/09/2026, fixture Cestas).
    const ligneAujourdhui = page.getByRole('button').filter({ hasText: 'sam.' });
    await ligneAujourdhui.click();

    const feuille = page.getByRole('dialog', { name: 'Samedi' });
    await expect(feuille).toBeVisible();
    await expect(feuille.getByText('minimum 13°')).toBeVisible();
    await expect(feuille.getByText('Conditions')).toBeVisible();
    await expect(page).toHaveURL('/');

    await feuille.getByRole('button', { name: 'Fermer' }).click();
    await expect(feuille).not.toBeVisible();
    await expect(page).toHaveURL('/');
  });
});
