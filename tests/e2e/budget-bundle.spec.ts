import { gzipSync } from 'node:zlib';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

/**
 * Phase 11, critère d'acceptation explicite (§8) : « bundle initial sous
 * 180 Ko compressé. » Mesuré sur `dist-pwa/` (comme `hors-ligne-pwa.spec.ts`)
 * — le seul build produit sans `VITE_MOCK` (voir `playwright.config.ts`),
 * donc le seul qui représente honnêtement ce qu'un navigateur téléchargerait
 * réellement en production. `dist/` (projet `chromium`) inclut le bundle
 * MSW du mode mock et fausserait la mesure à la hausse.
 *
 * « Initial » : uniquement ce que `index.html` référence directement
 * (`<script>`/`<link rel="stylesheet">`) — c'est ce qu'un navigateur charge
 * avant le premier rendu. Un chunk chargé plus tard par un import
 * dynamique (`workbox-window`, enregistré après le premier rendu par
 * `RegistreurPwa`, phase 9) n'entre pas dans ce budget, exactement comme il
 * n'entre pas dans le calcul du premier rendu utile (`performance.spec.ts`).
 */

const BUDGET_OCTETS = 180 * 1024;
const dossierDist = join(process.cwd(), 'dist-pwa');

function tailleGzip(cheminRelatif: string): number {
  const contenu = readFileSync(join(dossierDist, cheminRelatif));
  return gzipSync(contenu, { level: 9 }).length;
}

test('bundle initial (script + feuille de style référencés par index.html) sous 180 Ko compressé', () => {
  const html = readFileSync(join(dossierDist, 'index.html'), 'utf-8');

  const scripts = [...html.matchAll(/<script[^>]*\bsrc="([^"]+)"/g)].map((m) => m[1]);
  const styles = [...html.matchAll(/<link[^>]*\brel="stylesheet"[^>]*\bhref="([^"]+)"/g)].map((m) => m[1]);
  const references = [...scripts, ...styles];

  // Si cette liste devient vide, le motif ci-dessus a cessé de correspondre au HTML généré
  // (changement de structure de Vite) — mieux vaut un échec explicite qu'un budget mesuré sur rien.
  expect(references.length).toBeGreaterThan(0);

  let total = 0;
  const detail: Record<string, number> = {};
  for (const reference of references) {
    // Chemins absolus depuis la racine du site (`/assets/...`) — dist-pwa en est la racine.
    const chemin = reference.replace(/^\//, '');
    const octets = tailleGzip(chemin);
    detail[chemin] = octets;
    total += octets;
  }

  expect(total, `détail (octets gzip) : ${JSON.stringify(detail, null, 2)}`).toBeLessThan(BUDGET_OCTETS);
});
