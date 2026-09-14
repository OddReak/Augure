import { describe, expect, it } from 'vitest';
import { adapterConditionCourante } from '../../src/api/foreca';
import type { Palier } from '../../src/domain/types';
import { LIEUX_DEMO } from '../../src/mocks/fixtures/demo-lieux';

const PALIER_ATTENDU: Record<string, Palier> = {
  Cestas: 'vigies',
  Rennes: 'ondee',
  Annecy: 'veille',
  Toulouse: 'colere',
  Chamonix: 'cendre',
  Séville: 'fournaise',
};

describe('lieux de démonstration (§8, écran Mes lieux : six paliers distincts)', () => {
  it('les six lieux couvrent bien les six paliers, sans doublon', () => {
    const paliers = new Set(Object.values(PALIER_ATTENDU));
    expect(paliers.size).toBe(6);
  });

  it.each(LIEUX_DEMO)('$lieu.nom retombe sur le palier attendu depuis sa fixture', (demo) => {
    const condition = adapterConditionCourante(demo.courant, '');
    expect(condition.palier).toBe(PALIER_ATTENDU[demo.lieu.nom]);
  });
});
