import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Écran de lancement (§7, post-livraison — `src/app/EcranLancement.tsx`).
 * Verrouillé comme le mouvement orchestré du §7 l'est déjà
 * (`mouvement-lancement.test.ts`) : par lecture du CSS et de la source,
 * valeur par valeur, plutôt que par une capture chronométrée.
 */

const racine = process.cwd();
const css = readFileSync(join(racine, 'src/app/EcranLancement.module.css'), 'utf-8');
const tsx = readFileSync(join(racine, 'src/app/EcranLancement.tsx'), 'utf-8');

function nombreDe(source: string, expression: RegExp): number {
  const trouve = source.match(expression);
  expect(trouve, `valeur introuvable pour ${expression}`).not.toBeNull();
  return Number(trouve![1]);
}

describe('écran de lancement (§7, post-livraison)', () => {
  it('avance par marches, jamais en glissé : anneau en steps(8), retrait en steps(4)', () => {
    expect(css).toMatch(/animation:\s*tournerAnneau\s+1600ms\s+steps\(8\)\s+infinite/);
    expect(css).toMatch(/retirerEcran\s+\d+ms\s+steps\(4\)/);
    // Une rotation de 45° exactement : huit rayons et huit points à 22,5°
    // d'intervalle ramènent la figure sur elle-même, la boucle est invisible.
    expect(css).toMatch(/@keyframes\s+tournerAnneau\s*\{[^}]*\{\s*transform:\s*rotate\(0deg\)[^@]*rotate\(45deg\)/);
  });

  it('se retire par le bas, pour ne jamais faire cohabiter deux paysages', () => {
    expect(css).toMatch(
      /@keyframes\s+retirerEcran\s*\{\s*from\s*\{\s*clip-path:\s*inset\(0 0 0 0\);\s*\}\s*to\s*\{\s*clip-path:\s*inset\(0 0 100% 0\);/,
    );
  });

  it('le démontage attend la fin de la plus longue animation de sortie', () => {
    const duree = nombreDe(css, /retirerEcran\s+(\d+)ms\s+steps\(4\)/);
    const retard = nombreDe(css, /retirerEcran\s+\d+ms\s+steps\(4\)\s+(\d+)ms/);
    const dureeFondu = nombreDe(css, /estomperEcran\s+(\d+)ms\s+linear/);
    const retardFondu = nombreDe(css, /estomperEcran\s+\d+ms\s+linear\s+(\d+)ms/);
    const dureeSortie = nombreDe(tsx, /const DUREE_SORTIE_MS = (\d+);/);

    expect(dureeSortie).toBeGreaterThanOrEqual(duree + retard);
    expect(dureeSortie).toBeGreaterThanOrEqual(dureeFondu + retardFondu);
  });

  it('un plafond dur relève l’écran même si aucune donnée n’arrive jamais', () => {
    const minimale = nombreDe(tsx, /const DUREE_MINIMALE_MS = (\d+) \* PAS_MS;/);
    const maximale = nombreDe(tsx, /const DUREE_MAXIMALE_MS = (\d+);/);
    const pas = nombreDe(tsx, /const PAS_MS = (\d+);/);
    expect(maximale).toBeGreaterThan(minimale * pas);
  });

  it('prefers-reduced-motion: reduce supprime le mouvement, hors disparition', () => {
    const bloc = css.match(/@media \(prefers-reduced-motion: reduce\) \{([\s\S]*?)\n\}/);
    expect(bloc, 'bloc prefers-reduced-motion absent').not.toBeNull();
    expect(bloc![1]).toMatch(/animation:\s*none;/);
    expect(bloc![1]).toMatch(/animation:\s*estomperEcran\s+\d+ms\s+linear\s+both;/);
    // Le glyphe ne se substitue pas non plus : la cadence est figée côté TSX.
    expect(tsx).toMatch(/if \(phase !== 'lecture' \|\| reduit\) return;/);
  });

  it('ne s’affiche qu’au lancement sur l’accueil, jamais sur un lien profond', () => {
    expect(tsx).toMatch(/window\.location\.pathname === '\/'/);
  });
});
