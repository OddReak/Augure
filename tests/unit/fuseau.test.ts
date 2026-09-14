import { describe, expect, it } from 'vitest';
import { ageEnTexte, libelleDateLongue, libelleJourCourt, libelleJourLong } from '../../src/domain/fuseau';

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

describe('ageEnTexte (§8bis, bandeau « hors ligne »)', () => {
  it('donne « à l’instant » sous la minute', () => {
    expect(ageEnTexte('2026-09-20T12:00:00+02:00', new Date('2026-09-20T12:00:20+02:00'))).toBe('à l’instant');
  });

  it('donne des minutes sous l’heure', () => {
    expect(ageEnTexte('2026-09-20T12:00:00+02:00', new Date('2026-09-20T12:45:00+02:00'))).toBe('45 min');
  });

  it('donne des heures arrondies au-delà, comme l’exemple du mockup', () => {
    expect(ageEnTexte('2026-09-20T05:02:00+02:00', new Date('2026-09-20T07:10:00+02:00'))).toBe('2 h');
  });

  it('ne descend jamais sous zéro pour un horodatage très légèrement futur (horloges non synchronisées)', () => {
    expect(ageEnTexte('2026-09-20T12:00:10+02:00', new Date('2026-09-20T12:00:00+02:00'))).toBe('à l’instant');
  });
});
