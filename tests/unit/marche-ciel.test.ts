import { describe, expect, it } from 'vitest';
import { courseSolaire, hauteurMarcheCiel } from '../../src/design/marche-ciel';

describe('la marche de ciel suit la course du soleil (§5.1, règle 3)', () => {
  it('la course vaut 0 au lever, 0,5 à midi solaire, 1 au coucher', () => {
    expect(courseSolaire(new Date(2026, 5, 21, 7, 0), '07:00', '21:00')).toBeCloseTo(0, 2);
    expect(courseSolaire(new Date(2026, 5, 21, 14, 0), '07:00', '21:00')).toBeCloseTo(0.5, 2);
    expect(courseSolaire(new Date(2026, 5, 21, 21, 0), '07:00', '21:00')).toBeCloseTo(1, 2);
  });

  it('est nulle (nuit) avant le lever ou après le coucher', () => {
    expect(courseSolaire(new Date(2026, 5, 21, 5, 0), '07:00', '21:00')).toBeNull();
    expect(courseSolaire(new Date(2026, 5, 21, 23, 0), '07:00', '21:00')).toBeNull();
  });

  it('la marche est plus haute (valeur plus petite) à midi qu\'au lever ou au coucher', () => {
    const auLever = hauteurMarcheCiel(0);
    const aMidi = hauteurMarcheCiel(0.5);
    const auCoucher = hauteurMarcheCiel(1);
    expect(aMidi).toBeLessThan(auLever);
    expect(aMidi).toBeLessThan(auCoucher);
  });

  it('la nuit, la marche retombe à sa valeur basse par défaut', () => {
    expect(hauteurMarcheCiel(null)).toBeGreaterThan(hauteurMarcheCiel(0.5));
  });
});
