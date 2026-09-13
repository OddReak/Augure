import { expect, test } from '@playwright/test';

/** Phase 8 (§6, `ecranDetail()`) : ouverture du détail d'un jour depuis la ligne des sept jours. */

test.describe('Détail d’un jour (§8)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('ouvre le détail depuis les sept jours et affiche min/max, retour compris', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Sept jours')).toBeVisible();

    // La première ligne des sept jours est aujourd'hui (samedi 19/09/2026, fixture Cestas).
    const ligneAujourdhui = page.getByRole('button').filter({ hasText: 'sam.' });
    await ligneAujourdhui.click();

    await expect(page).toHaveURL(/\/jour\//);
    await expect(page.getByText('Samedi', { exact: true })).toBeVisible();
    await expect(page.getByText('minimum 13°')).toBeVisible();
    await expect(page.getByText('Conditions')).toBeVisible();

    await page.getByRole('button', { name: 'Retour' }).click();
    await expect(page).toHaveURL('/');
  });
});
