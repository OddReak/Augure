import { describe, expect, it } from 'vitest';
import { RAYON_DISQUE, geometrieDisqueLune } from '../../src/design/disque-lune-geometrie';

/**
 * §6 : « attention au disque lunaire : demi-axe a = R × (1 − 2f), et le
 * drapeau de sens s'inverse au passage du premier quartier (a > 0 ? 0 : 1).
 * C'est le bug classique de ce composant. » — test paramétré sur les cinq
 * valeurs citées par le document maître (phase 6, critère d'acceptation).
 */
describe.each([
  { fraction: 0, sensAttendu: 0, description: 'nouvelle lune : a = R, positif' },
  { fraction: 0.25, sensAttendu: 0, description: 'premier croissant : a > 0' },
  { fraction: 0.5, sensAttendu: 1, description: "premier quartier : a = 0, à la limite — c'est ici que le drapeau bascule" },
  { fraction: 0.75, sensAttendu: 1, description: 'dernier croissant : a < 0' },
  { fraction: 1, sensAttendu: 1, description: 'pleine lune : a = −R, négatif' },
])('géométrie du disque lunaire — fraction $fraction ($description)', ({ fraction, sensAttendu }) => {
  it(`produit le drapeau de sens ${sensAttendu}`, () => {
    const { sens, demiAxe } = geometrieDisqueLune(fraction, 104);
    expect(sens).toBe(sensAttendu);
    expect(demiAxe).toBeCloseTo(RAYON_DISQUE * (1 - 2 * fraction), 6);
  });
});

describe('épaisseur de trait et pas de trame selon la taille du disque', () => {
  it('un grand disque (§6, disque courant 104 px) porte un trait de 3 et un pas de trame de 4', () => {
    expect(geometrieDisqueLune(0.5, 104)).toMatchObject({ epaisseurTrait: 3, pasTrame: 4 });
  });

  it('un petit disque (§6, vignettes de phase 22 px) porte un trait de 2 et un pas de trame de 3', () => {
    expect(geometrieDisqueLune(0.5, 22)).toMatchObject({ epaisseurTrait: 2, pasTrame: 3 });
  });
});
