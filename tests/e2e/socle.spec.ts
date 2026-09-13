import { test, expect } from '@playwright/test';

test("l'application se charge et affiche la météo du lieu courant", async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('AUGURE');
  await expect(page.getByText('Cestas')).toBeVisible();
});
