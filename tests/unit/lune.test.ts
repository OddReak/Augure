import { describe, expect, it } from 'vitest';
import { fractionIlluminee, nomPhase, prochainesPhases } from '../../src/domain/lune';

/**
 * Cinq dates de référence connues (recherche web — timeanddate.com/
 * theskylive.com, voir DECISIONS.md) : les quatre phases primaires réelles
 * de septembre-octobre 2026.
 */
const REFERENCES = [
  { iso: '2026-09-11T03:27:00Z', nom: 'Nouvelle lune', fraction: 0 },
  { iso: '2026-09-18T20:46:00Z', nom: 'Premier quartier', fraction: 0.5 },
  { iso: '2026-09-26T16:51:00Z', nom: 'Pleine lune', fraction: 1 },
  { iso: '2026-10-03T13:27:00Z', nom: 'Dernier quartier', fraction: 0.5 },
  { iso: '2026-10-10T15:52:00Z', nom: 'Nouvelle lune', fraction: 0 },
] as const;

describe('calcul de phase de la lune (Meeus, §domain/lune.ts, phase 6) — cinq dates de référence connues', () => {
  for (const ref of REFERENCES) {
    it(`${ref.nom} du ${ref.iso}`, () => {
      const date = new Date(ref.iso);
      expect(fractionIlluminee(date)).toBeCloseTo(ref.fraction, 1); // à 5 % près (toBeCloseTo, precision 1)
      expect(nomPhase(date)).toBe(ref.nom);
    });
  }

  it('la fraction illuminée reste toujours dans [0, 1]', () => {
    for (let jour = 0; jour < 400; jour++) {
      const f = fractionIlluminee(new Date(Date.UTC(2026, 0, 1 + jour)));
      expect(f).toBeGreaterThanOrEqual(0);
      expect(f).toBeLessThanOrEqual(1);
    }
  });
});

describe('prochaines phases (Meeus ch. 49, corrections périodiques)', () => {
  it('retombe sur les quatre dates réelles de référence depuis une date antérieure à toutes', () => {
    const prochaines = prochainesPhases(new Date('2026-09-13T00:00:00Z'));
    expect(prochaines).toHaveLength(4);
    expect(prochaines.map((p) => p.nom)).toEqual([
      'Premier quartier',
      'Pleine lune',
      'Dernier quartier',
      'Nouvelle lune',
    ]);
    const tolerance = 5 * 60_000; // cinq minutes, comme l'algorithme solaire (Meeus, éléments moyens)
    expect(Math.abs(prochaines[0].dateUtc.getTime() - new Date('2026-09-18T20:46:00Z').getTime())).toBeLessThan(
      tolerance,
    );
    expect(Math.abs(prochaines[1].dateUtc.getTime() - new Date('2026-09-26T16:51:00Z').getTime())).toBeLessThan(
      tolerance,
    );
    expect(Math.abs(prochaines[2].dateUtc.getTime() - new Date('2026-10-03T13:27:00Z').getTime())).toBeLessThan(
      tolerance,
    );
    expect(Math.abs(prochaines[3].dateUtc.getTime() - new Date('2026-10-10T15:52:00Z').getTime())).toBeLessThan(
      tolerance,
    );
  });

  it('les quatre prochaines phases sont toujours strictement après la date donnée, et triées', () => {
    const date = new Date('2026-09-26T16:51:00Z'); // pile à une pleine lune connue
    const prochaines = prochainesPhases(date);
    for (const p of prochaines) {
      expect(p.dateUtc.getTime()).toBeGreaterThanOrEqual(date.getTime());
    }
    const instants = prochaines.map((p) => p.dateUtc.getTime());
    expect([...instants].sort((a, b) => a - b)).toEqual(instants);
  });
});
