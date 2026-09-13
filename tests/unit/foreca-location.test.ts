import { describe, expect, it } from 'vitest';
import { formaterCibleForeca } from '../../api/_lib/foreca-location';

describe('formatage de {location} pour Foreca', () => {
  it('place la longitude avant la latitude, séparées par une virgule (le piège du §4.1)', () => {
    // Cestas, telle qu'affichée dans le mockup : « 44,74 · −0,68 » (latitude, longitude).
    expect(formaterCibleForeca({ type: 'coordonnees', latitude: 44.74, longitude: -0.68 })).toBe(
      '-0.68,44.74',
    );
  });

  it('utilise l\'identifiant de lieu tel quel pour un lieu enregistré', () => {
    expect(formaterCibleForeca({ type: 'identifiant', id: 'fr-cestas-33' })).toBe('fr-cestas-33');
  });
});
