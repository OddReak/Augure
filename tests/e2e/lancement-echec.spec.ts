import { expect, test } from '@playwright/test';

/**
 * Écran de lancement (§7, post-livraison) — la garantie qui compte le plus :
 * il se retire même quand la prévision n'arrive jamais. Un écran d'attente
 * resté monté couvrirait toute l'application sans qu'aucun autre test ne le
 * signale (Playwright attend l'actionnabilité, il ne fait qu'expirer).
 *
 * Projet `pwa` (dist-pwa) et non la suite principale : MSW répond dans la page
 * elle-même sous `VITE_MOCK=1`, aucune interception réseau de Playwright ne
 * passe avant lui. Sans `VITE_MOCK`, `vite preview` ne fait tourner aucune
 * fonction Vercel (voir `performance.spec.ts`, même raison) : les appels
 * `/api/*` échouent réellement, sans rien avoir à simuler.
 */
test('l’écran de lancement se retire même quand la prévision échoue (§7)', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('[data-ecran-lancement]')).toHaveCount(0, { timeout: 20_000 });
  await expect(page.getByText(/n’a pas pu être chargée/)).toBeVisible();
});
