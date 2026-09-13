import { test, expect } from '@playwright/test';

test('l\'application se charge et affiche un titre', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'AUGURE' })).toBeVisible();
});
