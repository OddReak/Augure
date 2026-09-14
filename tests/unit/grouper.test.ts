import { describe, expect, it } from 'vitest';
import { grouperParGrille } from '../../supabase/functions/envoi-quotidien/grouper.ts';

/**
 * §10, critère d'acceptation explicite : « un lot de 50 appareils dans la
 * même ville ne déclenche qu'un appel météo » — la garantie tient tout
 * entière dans ce regroupement (l'Edge Function n'appelle la météo qu'une
 * fois par groupe qu'il produit, voir `index.ts`).
 */
describe('grouperParGrille (§10)', () => {
  it('un lot de 50 appareils à la même adresse ne produit qu’un seul groupe', () => {
    const appareils = Array.from({ length: 50 }, (_, i) => ({ id: `d${i}`, lat: 44.74, lon: -0.68 }));
    const groupes = grouperParGrille(appareils);
    expect(groupes).toHaveLength(1);
    expect(groupes[0]?.appareils).toHaveLength(50);
  });

  it('deux appareils à quelques centaines de mètres tombent dans le même groupe (grille de 5 km)', () => {
    const groupes = grouperParGrille([
      { lat: 44.74, lon: -0.68 },
      { lat: 44.741, lon: -0.681 },
    ]);
    expect(groupes).toHaveLength(1);
  });

  it('deux villes distinctes produisent deux groupes, chacun avec ses coordonnées arrondies', () => {
    const groupes = grouperParGrille([
      { lat: 44.74, lon: -0.68 }, // Cestas
      { lat: 48.85, lon: 2.35 }, // Paris
    ]);
    expect(groupes).toHaveLength(2);
    expect(groupes.map((g) => g.cle).sort()).toEqual(['44.75,-0.70', '48.85,2.35']);
  });

  it('conserve tous les appareils, sans en perdre ni en dupliquer, sur un mélange de groupes', () => {
    const appareils = [
      ...Array.from({ length: 30 }, (_, i) => ({ id: `cestas-${i}`, lat: 44.74, lon: -0.68 })),
      ...Array.from({ length: 20 }, (_, i) => ({ id: `paris-${i}`, lat: 48.85, lon: 2.35 })),
    ];
    const groupes = grouperParGrille(appareils);
    const total = groupes.reduce((n, g) => n + g.appareils.length, 0);
    expect(total).toBe(50);
  });
});
