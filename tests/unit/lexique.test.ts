import { describe, expect, it } from 'vitest';
import { IDS_SIGNES_METEO } from '../../src/domain/signes';
import { FICHES_SIGNES } from '../../src/domain/lexique';

describe('fiches du Lexique (§6, ficheSigne())', () => {
  it('couvre exactement les seize signes météo, chacun avec au moins un seuil', () => {
    for (const id of IDS_SIGNES_METEO) {
      const fiche = FICHES_SIGNES[id];
      expect(fiche, `fiche manquante pour « ${id} »`).toBeDefined();
      expect(fiche.description.length).toBeGreaterThan(0);
      expect(fiche.seuils.length).toBeGreaterThan(0);
    }
    expect(Object.keys(FICHES_SIGNES)).toHaveLength(16);
  });
});
