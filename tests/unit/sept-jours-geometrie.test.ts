import { describe, expect, it } from 'vitest';
import { BORNE_BASSE, BORNE_HAUTE, NOMBRE_SEGMENTS, segmentsJour } from '../../src/design/sept-jours-geometrie';

describe('barre segmentée des sept jours (§6, `blocSept()` du mockup)', () => {
  it("compte toujours quinze segments, sur l'échelle fixe −5 → 40 °C", () => {
    expect(NOMBRE_SEGMENTS).toBe(15);
    expect(BORNE_BASSE).toBe(-5);
    expect(BORNE_HAUTE).toBe(40);
    expect(segmentsJour(10, 25)).toHaveLength(15);
  });

  it('au moins un segment est actif même pour un écart min/max étroit', () => {
    const segments = segmentsJour(20, 20);
    expect(segments.some((s) => s.actif)).toBe(true);
  });

  it('les segments actifs portent tous une bande de température, les inactifs aucune', () => {
    const segments = segmentsJour(5, 30);
    for (const s of segments) {
      if (s.actif) expect(s.bande).toBeDefined();
      else expect(s.bande).toBeUndefined();
    }
  });

  it("un jour très froid n'allume que des segments en début d'échelle", () => {
    const segments = segmentsJour(-5, -2);
    const indexActifs = segments.map((s, i) => (s.actif ? i : -1)).filter((i) => i >= 0);
    expect(Math.max(...indexActifs)).toBeLessThan(3);
  });

  it("un jour très chaud n'allume que des segments en fin d'échelle", () => {
    const segments = segmentsJour(37, 40);
    const indexActifs = segments.map((s, i) => (s.actif ? i : -1)).filter((i) => i >= 0);
    expect(Math.min(...indexActifs)).toBeGreaterThan(11);
  });

  it("l'échelle ne bouge jamais avec la série (contrairement au plafond des colonnes de la frise)", () => {
    // Les segments d'un jour à 13–28° et d'un jour à 14–34° ne partagent
    // pas le même plafond : chacun est positionné sur la même échelle fixe.
    const froid = segmentsJour(13, 28);
    const chaud = segmentsJour(14, 34);
    expect(froid).toHaveLength(15);
    expect(chaud).toHaveLength(15);
    const dernierActifFroid = froid.map((s, i) => (s.actif ? i : -1)).filter((i) => i >= 0).pop();
    const dernierActifChaud = chaud.map((s, i) => (s.actif ? i : -1)).filter((i) => i >= 0).pop();
    expect(dernierActifChaud).toBeGreaterThan(dernierActifFroid!);
  });
});
