import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { IDS_SIGNES_METEO } from '../../src/domain/signes';
import { ID_ICONES_INTERFACE } from '../../src/design/icones';

const sprite = readFileSync(join(process.cwd(), 'src/design/signes.svg'), 'utf-8');

describe('sprite de signes', () => {
  it('contient un <symbol> pour chacun des seize signes météo et des vingt-neuf icônes d\'interface', () => {
    const attendus = [...IDS_SIGNES_METEO, ...ID_ICONES_INTERFACE];
    expect(attendus).toHaveLength(45);
    for (const id of attendus) {
      expect(sprite.includes(`id="signe-${id}"`)).toBe(true);
    }
  });

  it('ne contient aucun symbole supplémentaire non catalogué', () => {
    const attendus = new Set<string>([...IDS_SIGNES_METEO, ...ID_ICONES_INTERFACE]);
    const trouves = [...sprite.matchAll(/id="signe-([a-z_]+)"/g)].map((m) => m[1]);
    expect(trouves).toHaveLength(45);
    for (const id of trouves) {
      expect(attendus.has(id)).toBe(true);
    }
  });
});
