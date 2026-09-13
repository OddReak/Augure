import { describe, expect, it } from 'vitest';
import { libelleDateLongue, libelleJourCourt, libelleJourLong } from '../../src/domain/fuseau';

describe('libellés de date (§8, chapeau du détail d’un jour)', () => {
  it('libelleJourCourt donne le jour abrégé, minuscule', () => {
    expect(libelleJourCourt('2026-09-20')).toBe('dim.');
  });

  it('libelleJourLong donne le jour en toutes lettres, casse de phrase (§5.6)', () => {
    expect(libelleJourLong('2026-09-20')).toBe('Dimanche');
  });

  it('libelleDateLongue donne le quantième et le mois', () => {
    expect(libelleDateLongue('2026-09-20')).toBe('20 septembre');
  });

  it('est indépendant du fuseau d’exécution (ancré à midi UTC)', () => {
    // Une date à minuit dans un fuseau positif ne doit jamais se relire comme la veille.
    expect(libelleJourLong('2026-01-01')).toBe('Jeudi');
  });
});
