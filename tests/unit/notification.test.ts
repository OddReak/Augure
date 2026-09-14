import { describe, expect, it } from 'vitest';
import { composerNotification, type PointHoraireNotification } from '../../src/domain/notification';

/** Un point horaire de demain, décalage +02:00 (Cestas) sauf indication contraire. */
function point(heure: string, signe: PointHoraireNotification['signe'], temperatureC = 20): PointHoraireNotification {
  return { horodatage: `2026-09-20T${heure}:00+02:00`, signe, temperatureC };
}

const JOURNEE_SOLEIL = Array.from({ length: 24 }, (_, h) => point(String(h).padStart(2, '0'), 'soleil'));

describe('composerNotification (§10 : huit scénarios)', () => {
  it('1. journée simple sans bascule, écart positif', () => {
    const { titre, texte } = composerNotification({
      nomLieu: 'Rennes',
      demain: { temperatureMinC: 10, temperatureMaxC: 22 },
      aujourdhui: { temperatureMaxC: 19 },
      horairesDemain: JOURNEE_SOLEIL,
    });
    expect(titre).toBe('Demain à Rennes');
    expect(texte).toBe('Soleil toute la journée. 10° → 22°, trois de plus qu’aujourd’hui.');
  });

  it('2. bascule l’après-midi — verrouillé sur l’exemple exact du document maître (Cestas)', () => {
    const horaires = Array.from({ length: 24 }, (_, h) =>
      point(String(h).padStart(2, '0'), h < 16 ? 'soleil' : 'orage'),
    );
    const { titre, texte } = composerNotification({
      nomLieu: 'Cestas',
      demain: { temperatureMinC: 14, temperatureMaxC: 31 },
      aujourdhui: { temperatureMaxC: 28 },
      horairesDemain: horaires,
    });
    expect(titre).toBe('Demain à Cestas');
    expect(texte).toBe('Soleil le matin, averses orageuses après 16 h. 14° → 31°, trois de plus qu’aujourd’hui.');
  });

  it('3. journée sans bascule — même condition à chaque heure, jamais « après Xh »', () => {
    const { texte } = composerNotification({
      nomLieu: 'Toulouse',
      demain: { temperatureMinC: 15, temperatureMaxC: 25 },
      aujourdhui: { temperatureMaxC: 20 },
      horairesDemain: JOURNEE_SOLEIL.map((h) => ({ ...h, signe: 'couvert' })),
    });
    expect(texte).toBe('Ciel couvert toute la journée. 15° → 25°, cinq de plus qu’aujourd’hui.');
    expect(texte).not.toContain('après');
  });

  it('4. écart nul', () => {
    const { texte } = composerNotification({
      nomLieu: 'Annecy',
      demain: { temperatureMinC: 8, temperatureMaxC: 18 },
      aujourdhui: { temperatureMaxC: 18 },
      horairesDemain: JOURNEE_SOLEIL,
    });
    expect(texte).toBe('Soleil toute la journée. 8° → 18°, comme aujourd’hui.');
  });

  it('5. écart négatif — journée plus fraîche qu’aujourd’hui', () => {
    const { texte } = composerNotification({
      nomLieu: 'Chamonix',
      demain: { temperatureMinC: -2, temperatureMaxC: 6 },
      aujourdhui: { temperatureMaxC: 10 },
      horairesDemain: JOURNEE_SOLEIL,
    });
    expect(texte).toBe('Soleil toute la journée. -2° → 6°, quatre de moins qu’aujourd’hui.');
  });

  it('6. canicule — le seuil de température prime sur le symbole Foreca (comme la vignette de Mes lieux)', () => {
    const { texte } = composerNotification({
      nomLieu: 'Séville',
      demain: { temperatureMinC: 24, temperatureMaxC: 39 },
      aujourdhui: { temperatureMaxC: 35 },
      horairesDemain: JOURNEE_SOLEIL.map((h) => ({ ...h, temperatureC: 36 })),
    });
    expect(texte).toContain('Chaleur intense toute la journée.');
  });

  it('7. gel', () => {
    const { texte } = composerNotification({
      nomLieu: 'Chamonix',
      demain: { temperatureMinC: -8, temperatureMaxC: -1 },
      aujourdhui: { temperatureMaxC: 2 },
      horairesDemain: JOURNEE_SOLEIL.map((h) => ({ ...h, temperatureC: -3 })),
    });
    expect(texte).toContain('Gel toute la journée.');
  });

  it('8. plusieurs bascules dans la journée — seule la première est rapportée', () => {
    const horaires = JOURNEE_SOLEIL.map((h, i) => {
      if (i >= 12 && i < 18) return point(String(i).padStart(2, '0'), 'pluie');
      if (i >= 18) return point(String(i).padStart(2, '0'), 'orage');
      return h;
    });
    const { texte } = composerNotification({
      nomLieu: 'Bordeaux',
      demain: { temperatureMinC: 12, temperatureMaxC: 20 },
      aujourdhui: { temperatureMaxC: 20 },
      horairesDemain: horaires,
    });
    expect(texte).toContain('le matin, pluie après 12 h.');
    expect(texte).not.toContain('orage');
  });

  it('n’utilise jamais d’exhortation ni de point d’exclamation (§9, interdits)', () => {
    const { texte } = composerNotification({
      nomLieu: 'Rennes',
      demain: { temperatureMinC: 10, temperatureMaxC: 22 },
      aujourdhui: { temperatureMaxC: 19 },
      horairesDemain: JOURNEE_SOLEIL,
    });
    expect(texte).not.toContain('!');
    expect(texte).not.toMatch(/\b(pensez|prenez|n'oubliez|munissez)\b/i);
  });
});
