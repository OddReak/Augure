import { describe, expect, it } from 'vitest';
import { adapterConditionCourante, adapterHoraire, adapterQuotidien } from '../../src/api/foreca';
import {
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
});
