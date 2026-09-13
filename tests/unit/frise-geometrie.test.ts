import { describe, expect, it } from 'vitest';
import {
  LARGEUR_SEPARATEUR,
  MARGE_DROITE,
  PAS_COLONNE,
  largeurFrise,
  positionsColonnes,
} from '../../src/design/frise-geometrie';

describe('géométrie de la frise (§6, `horaires()` du mockup)', () => {
  it('espace les colonnes d\'un pas fixe de 58 px quand aucun repère de jour n\'est présent', () => {
    const points = [{}, {}, {}, {}];
    const positions = positionsColonnes(points);
    for (let i = 1; i < positions.length; i++) {
      expect(positions[i] - positions[i - 1]).toBe(PAS_COLONNE);
    }
  });

  it('décale toutes les colonnes qui suivent un repère de jour de sa largeur', () => {
    const sansSep = positionsColonnes([{}, {}, {}]);
    const avecSep = positionsColonnes([{}, { sep: 'dim.' }, {}]);
    expect(avecSep[1] - sansSep[1]).toBe(LARGEUR_SEPARATEUR);
    expect(avecSep[2] - sansSep[2]).toBe(LARGEUR_SEPARATEUR);
    expect(avecSep[0]).toBe(sansSep[0]); // rien avant le repère ne bouge
  });

  it('ne dépend que du nombre de points et des repères de jour, jamais d\'une métrique', () => {
    // La signature ne prend même pas de métrique en paramètre : la garantie
    // « les colonnes ne bougent pas quand on bascule de métrique » (critère
    // d'acceptation phase 5) est structurelle, pas seulement testée au run.
    expect(positionsColonnes.length).toBe(1);
  });

  it('la largeur totale inclut le pas de chaque colonne, les repères de jour et la marge droite', () => {
    const points = [{}, { sep: 'dim.' }, {}, {}];
    expect(largeurFrise(points)).toBe(LARGEUR_SEPARATEUR + points.length * PAS_COLONNE + MARGE_DROITE);
  });
});
