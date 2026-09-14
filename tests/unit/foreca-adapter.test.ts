import { describe, expect, it } from 'vitest';
import {
  adapterConditionCourante,
  adapterHoraire,
  adapterQualiteAirDetail,
  adapterQuotidien,
} from '../../src/api/foreca';
import {
  CESTAS_AIR,
  CESTAS_COURANT,
  CESTAS_HORAIRE,
  CESTAS_PHRASE,
  CESTAS_QUOTIDIEN,
} from '../../src/mocks/fixtures/cestas';

describe('adaptateur Foreca → domaine (contrat, fixture Cestas enregistrée)', () => {
  it('adapte la condition courante', () => {
    const condition = adapterConditionCourante(CESTAS_COURANT, CESTAS_PHRASE);
    expect(condition).toMatchObject({
      temperatureC: 28,
      ressentiC: 28,
      signe: 'soleil',
      symboleBrut: 'd000',
      palier: 'vigies',
      phrase: CESTAS_PHRASE,
      pointDeRoseeC: 15,
      visibiliteM: 25000,
    });
  });

  it('adapte les 22 points horaires du mockup, jour et nuit', () => {
    const horaire = adapterHoraire(CESTAS_HORAIRE);
    expect(horaire).toHaveLength(22);
    expect(horaire[0]).toMatchObject({ temperatureC: 28, signe: 'soleil' });
    const pointDeNuit = horaire.find((p) => p.symboleBrut.startsWith('n'));
    expect(pointDeNuit).toMatchObject({ signe: 'lune' });
  });

  it('adapte les 7 jours du mockup', () => {
    const quotidien = adapterQuotidien(CESTAS_QUOTIDIEN);
    expect(quotidien).toHaveLength(7);
    expect(quotidien[0]).toMatchObject({ temperatureMinC: 13, temperatureMaxC: 28, signe: 'soleil' });
  });

  it('adapte le détail de qualité de l’air (§11, post-livraison — vue détaillée)', () => {
    const detail = adapterQualiteAirDetail(CESTAS_AIR);
    expect(detail).toHaveLength(22);
    // Premier point : jour (14h), polluant dominant = ozone, AQI = 30 → EAQI 1 (bon).
    expect(detail[0]).toMatchObject({
      aqi: 30,
      eaqi: 1,
      polluantDominant: 'ozone',
      sousIndices: { o3: 30 },
    });
    // AQI composite toujours égal au maximum des six sous-indices — jamais une valeur incohérente
    // avec son propre détail (ce que l'écran affiche côte à côte, `src/app/QualiteAir.tsx`).
    for (const point of detail) {
      const maxSousIndice = Math.max(...Object.values(point.sousIndices));
      expect(point.aqi).toBe(maxSousIndice);
    }
  });
});
