import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { PALIERS } from '../../src/domain/types';

/**
 * Phase 11, critère d'acceptation explicite (§8) : « axe-core sans violation
 * sérieuse ou critique sur chaque écran et chaque palier. » Le palier est
 * forcé avant toute navigation en écrivant directement la clé de
 * persistance du store (`augure-ui`, `src/lib/magasin.ts`) — le même
 * mécanisme que celui déjà utilisé par `/styleguide` (`forcerPalier`),
 * simplement posé depuis le test plutôt que depuis un sélecteur d'écran,
 * pour auditer les écrans réels plutôt qu'une planche de démonstration.
 *
 * Le Lexique/Cartes/Réglages/Recherche ne changent pas fondamentalement
 * d'agencement d'un palier à l'autre, mais leurs jetons de couleur (encre,
 * papier, accent) en dépendent tous (§5.2) : le contraste doit donc être
 * vérifié sur chacun, pas seulement sur le Héros. `/styleguide` n'est pas
 * inclus : ce n'est pas un écran livré (route non publiée, phase 1), et il
 * affiche déjà les six paliers simultanément sur une seule page conçue pour
 * la comparaison visuelle, pas pour représenter un parcours utilisateur.
 */

function forcerPalier(page: Page, palier: string): Promise<void> {
  return page.addInitScript((p: string) => {
    window.localStorage.setItem('augure-ui', JSON.stringify({ state: { palierForce: p }, version: 0 }));
  }, palier);
}

interface Ecran {
  nom: string;
  ouvrir: (page: Page) => Promise<void>;
}

const ECRANS: Ecran[] = [
  {
    nom: 'Accueil',
    ouvrir: async (page) => {
      await page.goto('/');
      await expect(page.getByText('Sept jours')).toBeVisible();
    },
  },
  { nom: 'Recherche', ouvrir: async (page) => void (await page.goto('/recherche')) },
  { nom: 'Mes lieux', ouvrir: async (page) => void (await page.goto('/mes-lieux')) },
  {
    nom: 'Détail d’un jour',
    ouvrir: async (page) => {
      await page.goto('/');
      await page.getByRole('button').filter({ hasText: 'sam.' }).first().click();
      await expect(page).toHaveURL(/\/jour\//);
    },
  },
  { nom: 'Cartes', ouvrir: async (page) => void (await page.goto('/cartes')) },
  { nom: 'Lexique', ouvrir: async (page) => void (await page.goto('/lexique')) },
  // « orage » (§5.4) : seul signe dont la fiche est rédigée mot pour mot depuis le document
  // maître (DECISIONS.md) — un identifiant de domaine fixe, jamais dépendant d'une donnée.
  { nom: 'Fiche de signe', ouvrir: async (page) => void (await page.goto('/lexique/orage')) },
  { nom: 'Réglages', ouvrir: async (page) => void (await page.goto('/reglages')) },
];

test.describe('Accessibilité — axe-core (§11)', () => {
  for (const palier of PALIERS) {
    test.describe(`palier ${palier}`, () => {
      test.use({ viewport: { width: 390, height: 844 } });

      test.beforeEach(async ({ page }) => {
        await forcerPalier(page, palier);
      });

      for (const ecran of ECRANS) {
        test(`${ecran.nom} — aucune violation sérieuse ou critique`, async ({ page }) => {
          await ecran.ouvrir(page);
          const resultats = await new AxeBuilder({ page }).analyze();
          const graves = resultats.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
          expect(
            graves,
            JSON.stringify(
              graves.map((v) => ({ id: v.id, impact: v.impact, aide: v.help, noeuds: v.nodes.length })),
              null,
              2,
            ),
          ).toEqual([]);
        });
      }
    });
  }
});
