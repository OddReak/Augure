import { describe, expect, it } from 'vitest';
import { leverCoucherUtc } from '../../src/domain/soleil';

const CESTAS = { latitude: 44.74, longitude: -0.68 };

/**
 * Références indépendantes (sunrise-sunset.org, recherche web — voir
 * DECISIONS.md), aux deux solstices et à l'équinoxe de septembre 2026, pour
 * Cestas. Tolérance de cinq minutes : l'algorithme (Meeus, éléments moyens,
 * sans VSOP87) vise la précision de la minute, pas la seconde.
 */
const TOLERANCE_MS = 5 * 60_000;

function attendre(instant: Date, iso: string) {
  expect(Math.abs(instant.getTime() - new Date(iso).getTime())).toBeLessThanOrEqual(TOLERANCE_MS);
}

describe('lever et coucher du soleil (Meeus, §domain/soleil.ts, phase 6)', () => {
  it('équinoxe de septembre 2026 à Cestas', () => {
    const resultat = leverCoucherUtc(new Date('2026-09-19T12:00:00Z'), CESTAS);
    expect(resultat).not.toBeNull();
    attendre(resultat!.leverUtc, '2026-09-19T05:44:54Z');
    attendre(resultat!.coucherUtc, '2026-09-19T18:08:05Z');
  });

  it('solstice de décembre 2026 (jour court) à Cestas', () => {
    const resultat = leverCoucherUtc(new Date('2026-12-21T12:00:00Z'), CESTAS);
    expect(resultat).not.toBeNull();
    attendre(resultat!.leverUtc, '2026-12-21T07:35:05Z');
    attendre(resultat!.coucherUtc, '2026-12-21T16:26:28Z');
  });

  it('solstice de juin 2026 (jour long) à Cestas', () => {
    const resultat = leverCoucherUtc(new Date('2026-06-21T12:00:00Z'), CESTAS);
    expect(resultat).not.toBeNull();
    attendre(resultat!.leverUtc, '2026-06-21T04:15:16Z');
    attendre(resultat!.coucherUtc, '2026-06-21T19:53:48Z');
  });

  it('le lever précède toujours le coucher, et le jour est plus long en juin qu\'en décembre', () => {
    const hiver = leverCoucherUtc(new Date('2026-12-21T12:00:00Z'), CESTAS)!;
    const ete = leverCoucherUtc(new Date('2026-06-21T12:00:00Z'), CESTAS)!;
    expect(hiver.leverUtc.getTime()).toBeLessThan(hiver.coucherUtc.getTime());
    const dureeHiver = hiver.coucherUtc.getTime() - hiver.leverUtc.getTime();
    const dureeEte = ete.coucherUtc.getTime() - ete.leverUtc.getTime();
    expect(dureeEte).toBeGreaterThan(dureeHiver);
  });
});
