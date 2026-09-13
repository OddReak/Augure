import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const cheminJetons = join(process.cwd(), 'src/design/jetons.css');
const source = readFileSync(cheminJetons, 'utf-8');

const PALIERS = ['vigies', 'ondee', 'veille', 'colere', 'cendre', 'fournaise'] as const;

const QUATORZE_JETONS = [
  '--trame-rgb',
  '--trame-op',
  '--ciel',
  '--ciel-b',
  '--ciel-txt',
  '--p1',
  '--p2',
  '--p3',
  '--encre',
  '--papier',
  '--trait',
  '--signe',
  '--lune',
  '--lune-b',
];

function blocDuPalier(palier: string): string {
  const motif = new RegExp(String.raw`\[data-palier=['"]${palier}['"]\]\s*\{([^}]*)\}`);
  const trouve = source.match(motif);
  if (!trouve) {
    throw new Error(`Aucun bloc de jetons trouvé pour le palier « ${palier} ».`);
  }
  return trouve[1];
}

describe('jetons de palier', () => {
  it.each(PALIERS)('%s définit les quatorze jetons attendus', (palier) => {
    const bloc = blocDuPalier(palier);
    for (const jeton of QUATORZE_JETONS) {
      expect(bloc.includes(`${jeton}:`)).toBe(true);
    }
  });

  it("le palier vigies porte les valeurs exactes du mockup", () => {
    const bloc = blocDuPalier('vigies');
    expect(bloc).toContain('--ciel: #f5c044');
    expect(bloc).toContain('--signe: #c2411f');
    expect(bloc).toContain('--trame-op: 0.075');
  });
});
