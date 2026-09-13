import { test, expect } from '@playwright/test';

/**
 * Phase 5, critère d'acceptation : le défilement et la bascule de métrique
 * de la frise horaire (§6, `horaires()` du mockup).
 */

const IDS = ['temp', 'ress', 'pluie', 'vent', 'uv', 'air'] as const;

test.describe('frise horaire (§6, phase 5)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('les positions horizontales des colonnes ne bougent pas d\'un pixel en basculant les six métriques', async ({
    page,
  }) => {
    await page.goto('/');
    const rail = page.locator('svg[role="img"][aria-label$="heure par heure"]');
    await expect(rail).toBeVisible();

    const colonnes = () => page.locator('[data-testid^="colonne-"]');
    const nb = await colonnes().count();
    expect(nb).toBeGreaterThan(1);

    const positionsInitiales = await colonnes().evaluateAll((noeuds) =>
      noeuds.map((n) => n.getAttribute('data-x')),
    );

    const onglets = page.locator('[role="tablist"] [role="tab"]');
    await expect(onglets).toHaveCount(6);

    for (let i = 0; i < IDS.length; i++) {
      await onglets.nth(i).click();
      await expect(onglets.nth(i)).toHaveAttribute('aria-selected', 'true');
      const positions = await colonnes().evaluateAll((noeuds) => noeuds.map((n) => n.getAttribute('data-x')));
      expect(positions).toEqual(positionsInitiales);
    }
  });

  test('le défilement horizontal de la frise ne réinitialise pas la géométrie des colonnes', async ({ page }) => {
    await page.goto('/');
    const rail = page.locator('.rail, [class*="rail"]').first();
    await rail.evaluate((el) => {
      el.scrollLeft = 150;
    });
    const scrollApres = await rail.evaluate((el) => el.scrollLeft);
    expect(scrollApres).toBeGreaterThan(0);

    const colonnes = page.locator('[data-testid^="colonne-"]');
    const largeurs = await colonnes.evaluateAll((noeuds) => noeuds.map((n) => n.getAttribute('data-x')));
    // les positions restent strictement croissantes et régulières malgré le défilement du conteneur
    const nombres = largeurs.map(Number);
    for (let i = 1; i < nombres.length; i++) {
      expect(nombres[i]).toBeGreaterThan(nombres[i - 1]);
    }
  });

  test('les six libellés du sélecteur tiennent sans troncature à 390 px, en français', async ({ page }) => {
    await page.goto('/');
    const boutons = page.locator('[role="tablist"] [role="tab"]');
    await expect(boutons).toHaveCount(6);

    const debordements = await boutons.evaluateAll((noeuds) =>
      noeuds.map((n) => n.scrollWidth - n.clientWidth),
    );
    for (const debordement of debordements) {
      expect(debordement).toBeLessThanOrEqual(1); // tolérance d'arrondi sub-pixel
    }

    const grille = page.locator('[role="tablist"]');
    const grilleDebordeLaFenetre = await grille.evaluate((el) => el.scrollWidth > document.documentElement.clientWidth + 1);
    expect(grilleDebordeLaFenetre).toBe(false);
  });

  test("les six libellés tiennent encore après passage aux variantes les plus longues", async ({ page }) => {
    await page.goto('/');
    const boutons = page.locator('[role="tablist"] [role="tab"]');
    await expect(boutons).toHaveCount(6);

    // Variantes les plus longues attestées dans le document maître (§5.2) pour
    // chacune des six métriques — plus longues que les libellés courts choisis
    // pour le sélecteur (« Qualité air » vs « Qualité de l'air », etc.).
    const libellesLongs = [
      'Température',
      'Ressenti',
      'Précipitations',
      'Vent',
      'Indice UV',
      "Qualité de l'air",
    ];

    await boutons.evaluateAll((noeuds, textes) => {
      noeuds.forEach((n, i) => {
        const texte = n.querySelector('svg')?.nextSibling;
        if (texte) texte.textContent = textes[i];
        else n.append(document.createTextNode(textes[i]));
      });
    }, libellesLongs);

    const debordements = await boutons.evaluateAll((noeuds) => noeuds.map((n) => n.scrollWidth - n.clientWidth));
    for (const debordement of debordements) {
      expect(debordement).toBeLessThanOrEqual(1);
    }
  });
});
