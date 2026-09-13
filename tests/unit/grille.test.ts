import { describe, expect, it } from 'vitest';
import { arrondirSurGrille, cleGrille, coordonneesSurGrille } from '../../api/_lib/grille';

describe('arrondi des coordonnées sur la grille de cache (§4.1)', () => {
  it("arrondit sur un pas de 0,05°", () => {
    expect(arrondirSurGrille(44.74)).toBeCloseTo(44.75, 10);
    expect(arrondirSurGrille(44.7301)).toBeCloseTo(44.75, 10);
  });

  it('deux coordonnées distantes de moins de 5 km produisent la même clé (§7 acceptation phase 7)', () => {
    // Cestas et un point à quelques centaines de mètres, dans la même case de grille.
    const cle1 = cleGrille(44.74, -0.68);
    const cle2 = cleGrille(44.76, -0.71);
    expect(cle2).toBe(cle1);
  });

  it('deux coordonnées qui changent de case produisent une clé différente', () => {
    const cle1 = cleGrille(44.74, -0.68);
    const cle2 = cleGrille(44.9, -0.68);
    expect(cle2).not.toBe(cle1);
  });

  it("la clé reste stable malgré l'imprécision binaire de la division flottante", () => {
    // -0.68 / 0.05 * 0.05 vaut -0.7000000000000001 en IEEE 754 : la clé doit rester "-0.70".
    const { longitude } = coordonneesSurGrille(0, -0.68);
    expect(longitude.toFixed(2)).toBe('-0.70');
    expect(cleGrille(0, -0.68)).toBe('0.00,-0.70');
  });
});
