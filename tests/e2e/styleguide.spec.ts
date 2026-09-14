import { test, expect } from '@playwright/test';

test('le styleguide affiche les six paliers', async ({ page }) => {
  await page.goto('/styleguide');
  await expect(page.getByRole('heading', { name: 'Styleguide' })).toBeVisible();
  const cartes = page.locator('figure[data-palier]');
  await expect(cartes).toHaveCount(6);
  await expect(page).toHaveScreenshot('styleguide.png', { fullPage: true });
});
