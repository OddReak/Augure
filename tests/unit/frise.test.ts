import { describe, expect, it } from 'vitest';
import { avecJalons, avecSeparateursJour, construireFrise } from '../../src/domain/frise';
import type { PointHoraire } from '../../src/domain/types';

function point(heure: string, date = '2026-09-19', temperatureC = 20): PointHoraire {
  return {
    horodatage: `${date}T${heure}:00+02:00`,
    temperatureC,
    ressentiC: temperatureC,
    signe: 'soleil',
    symboleBrut: 'd000',
    indiceUv: 3,
    ventKmh: 10,
    pluieMm: 0,
  };
}

describe('insertion des jalons lever/coucher (§domain/frise.ts, phase 5)', () => {
  it('le coucher est inséré au bon index, entre les deux heures qui l\'encadrent', () => {
    const points = [point('19:00', undefined, 24), point('20:00', undefined, 22), point('21:00', undefined, 20)];
    const resultat = avecJalons(points, '07:39', '20:22');

    expect(resultat).toHaveLength(4); // pas de lever dans cette plage, un seul coucher inséré
    const index = resultat.findIndex((p) => p.jalon === 'coucher');
    expect(index).toBe(2); // entre le point de 20:00 (index 1) et celui de 21:00
    expect(resultat[index - 1].horodatage).toContain('20:00');
    expect(resultat[index + 1].horodatage).toContain('21:00');
    expect(resultat[index].horodatage).toBe('2026-09-19T20:22:00+02:00');
    expect(resultat[index].signe).toBe('coucher');
  });

  it('interpole la température entre les deux points qui encadrent le jalon', () => {
    const points = [point('20:00', undefined, 24), point('21:00', undefined, 20)];
    const resultat = avecJalons(points, '07:39', '20:22'); // 22/60 = 36,7 % de l'intervalle
    const jalon = resultat.find((p) => p.jalon === 'coucher')!;
    expect(jalon.temperatureC).toBe(Math.round(24 + (20 - 24) * (22 / 60)));
  });

  it("n'insère rien quand l'heure du jalon tombe hors de la plage couverte par les points", () => {
    const points = [point('10:00'), point('11:00'), point('12:00')];
    const resultat = avecJalons(points, '07:39', '20:22');
    expect(resultat).toHaveLength(3);
    expect(resultat.some((p) => p.jalon)).toBe(false);
  });

  it('insère lever et coucher indépendamment quand les deux tombent dans la plage', () => {
    const points = [point('07:00'), point('08:00'), point('19:00'), point('20:00'), point('21:00')];
    const resultat = avecJalons(points, '07:39', '20:22');
    expect(resultat.filter((p) => p.jalon === 'lever')).toHaveLength(1);
    expect(resultat.filter((p) => p.jalon === 'coucher')).toHaveLength(1);
    expect(resultat).toHaveLength(7);
    // l'ordre chronologique est préservé
    const horodatages = resultat.map((p) => p.horodatage);
    expect([...horodatages].sort()).toEqual(horodatages);
  });

  it('insère un jalon par date rencontrée dans une série qui couvre plusieurs jours', () => {
    const points = [
      point('19:00', '2026-09-19'),
      point('20:00', '2026-09-19'),
      point('21:00', '2026-09-19'),
      point('19:00', '2026-09-20'),
      point('20:00', '2026-09-20'),
      point('21:00', '2026-09-20'),
    ];
    const resultat = avecJalons(points, '07:39', '20:22');
    expect(resultat.filter((p) => p.jalon === 'coucher')).toHaveLength(2);
  });
});

describe('repères de jour (§domain/frise.ts, phase 5)', () => {
  it('pose le repère sur le premier point d\'une nouvelle date, jamais sur le tout premier point', () => {
    const points = [
      point('23:00', '2026-09-19'),
      point('00:00', '2026-09-20'),
      point('01:00', '2026-09-20'),
    ];
    const resultat = avecSeparateursJour(points);
    expect(resultat[0].sep).toBeUndefined();
    expect(resultat[1].sep).toBe('dim.'); // 2026-09-20 est un dimanche (cf. fixture Cestas, DECISIONS.md)
    expect(resultat[2].sep).toBeUndefined();
  });

  it('ne pose aucun repère quand tous les points partagent la même date', () => {
    const points = [point('10:00'), point('11:00'), point('12:00')];
    expect(avecSeparateursJour(points).every((p) => !p.sep)).toBe(true);
  });
});

describe('construireFrise — composition jalons puis repères de jour', () => {
  it('applique les deux enrichissements et garde la série triée chronologiquement', () => {
    const points = [
      point('23:00', '2026-09-19'),
      point('00:00', '2026-09-20'),
      point('07:00', '2026-09-20'),
      point('08:00', '2026-09-20'),
    ];
    const resultat = construireFrise(points, '07:39', '20:22');
    const horodatages = resultat.map((p) => p.horodatage);
    expect([...horodatages].sort()).toEqual(horodatages);
    expect(resultat.some((p) => p.jalon === 'lever')).toBe(true);
    expect(resultat.find((p) => p.horodatage.startsWith('2026-09-20T00:00'))?.sep).toBe('dim.');
  });
});
