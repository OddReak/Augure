import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

// §5.1 : les sept règles de rendu priment sur le goût, tenues par outil.

const racineSrc = join(process.cwd(), 'src');

function listeFichiersCss(dossier: string): string[] {
  const resultat: string[] = [];
  for (const entree of readdirSync(dossier)) {
    const chemin = join(dossier, entree);
    if (statSync(chemin).isDirectory()) {
      resultat.push(...listeFichiersCss(chemin));
    } else if (entree.endsWith('.css')) {
      resultat.push(chemin);
    }
  }
  return resultat;
}

const fichiers = listeFichiersCss(racineSrc);
const cheminJetons = join(racineSrc, 'design/jetons.css');

describe('règle 1 — deux valeurs, un terminateur, la trame en repeating-linear-gradient seulement', () => {
  it.each(fichiers)('%s ne contient pas de linear-gradient ni radial-gradient interdit', (fichier) => {
    const source = readFileSync(fichier, 'utf-8');
    const estJetons = fichier === cheminJetons;

    if (!estJetons) {
      expect(source.includes('repeating-linear-gradient(')).toBe(false);
    }

    const sansTrame = source.replaceAll('repeating-linear-gradient(', '');
    expect(sansTrame.includes('linear-gradient(')).toBe(false);
    expect(sansTrame.includes('radial-gradient(')).toBe(false);
  });
});

describe('règle 2 — l\'ombre est une forme, jamais box-shadow ni filter: blur', () => {
  it.each(fichiers)('%s ne contient ni box-shadow ni flou', (fichier) => {
    const source = readFileSync(fichier, 'utf-8');
    expect(/box-shadow\s*:/.test(source)).toBe(false);
    expect(/filter\s*:[^;]*blur\(/.test(source)).toBe(false);
  });
});

describe('règle 4 — angle droit, sauf le châssis', () => {
  it.each(fichiers)('%s ne pose un border-radius non nul que sur .chassis', (fichier) => {
    const source = readFileSync(fichier, 'utf-8');
    const blocs = source.matchAll(/([^{}]+)\{([^{}]*)\}/g);
    for (const bloc of blocs) {
      const [, selecteur, corps] = bloc;
      const rayon = corps.match(/border-radius\s*:\s*([^;]+);/);
      if (!rayon) continue;
      const estNul = /^\s*0(px)?\s*$/.test(rayon[1]);
      if (estNul) continue;
      expect(
        selecteur.includes('.chassis'),
        `border-radius non nul hors .chassis dans ${relative(racineSrc, fichier)} (sélecteur « ${selecteur.trim()} »)`,
      ).toBe(true);
    }
  });
});
