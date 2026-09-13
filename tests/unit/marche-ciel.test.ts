import { describe, expect, it } from 'vitest';
import { courseSolaire, hauteurMarcheCiel } from '../../src/design/marche-ciel';

// Instants construits en UTC explicite (`Date.UTC`), jamais via le constructeur
// local (`new Date(année, mois, …)`) : le résultat ne doit dépendre ni du
// fuseau du poste qui exécute les tests, ni de celui par défaut de `decalageIso`.
function utc(h: number, m = 0): Date {
  return new Date(Date.UTC(2026, 5, 21, h, m));
}

describe('la marche de ciel suit la course du soleil (§5.1, règle 3)', () => {
  it('la course vaut 0 au lever, 0,5 à midi solaire, 1 au coucher (fuseau UTC)', () => {
    expect(courseSolaire(utc(7), '07:00', '21:00')).toBeCloseTo(0, 2);
    expect(courseSolaire(utc(14), '07:00', '21:00')).toBeCloseTo(0.5, 2);
    expect(courseSolaire(utc(21), '07:00', '21:00')).toBeCloseTo(1, 2);
  });

  it('est nulle (nuit) avant le lever ou après le coucher', () => {
    expect(courseSolaire(utc(5), '07:00', '21:00')).toBeNull();
    expect(courseSolaire(utc(23), '07:00', '21:00')).toBeNull();
  });

  it("lit l'heure dans le fuseau du lieu (`decalageIso`), jamais dans celui du terminal qui exécute le code", () => {
    // 07:00 UTC = 09:00 dans un lieu à +02:00 : à l'heure locale du lieu,
    // c'est déjà le milieu de matinée, pas le lever.
    expect(courseSolaire(utc(7), '07:00', '21:00', '+02:00')).toBeCloseTo((9 * 60 - 7 * 60) / (14 * 60), 2);
    // 05:00 UTC = 07:00 à +02:00 : c'est exactement le lever local.
    expect(courseSolaire(utc(5), '07:00', '21:00', '+02:00')).toBeCloseTo(0, 2);
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
