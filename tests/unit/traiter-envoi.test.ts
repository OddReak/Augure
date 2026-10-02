import { describe, expect, it, vi } from 'vitest';
import {
  dateDuJour,
  traiterEnvoi,
  type AppareilANotifier,
  type DependancesEnvoi,
  type MeteoGroupe,
} from '../../supabase/functions/envoi-quotidien/traiter.ts';

// Envoi de 7 h le vendredi 2 octobre 2026 : la prévision envoyée est celle de ce même jour.
const METEO_TYPE: MeteoGroupe = {
  courant: { current: { time: '2026-10-02T07:00:00+02:00', temperature: 12, symbol: 'd000' } },
  horaire: {
    forecast: [
      // Heure déjà passée (réponse horaire servie par le cache CDN) : ignorée.
      { time: '2026-10-02T06:00:00+02:00', temperature: 11, symbol: 'd300' },
      { time: '2026-10-02T08:00:00+02:00', temperature: 15, symbol: 'd000' },
      { time: '2026-10-02T16:00:00+02:00', temperature: 22, symbol: 'd340' },
      // Lendemain : ignoré.
      { time: '2026-10-03T08:00:00+02:00', temperature: 14, symbol: 'd300' },
    ],
  },
  quotidien: {
    forecast: [
      { date: '2026-10-02', minTemp: 14, maxTemp: 31 },
      { date: '2026-10-03', minTemp: 13, maxTemp: 28 },
    ],
  },
};

function appareil(id: string, partiel: Partial<AppareilANotifier> = {}): AppareilANotifier {
  return {
    id,
    endpoint: `https://push.exemple/${id}`,
    p256dh: 'p',
    auth: 'a',
    lat: 44.74,
    lon: -0.68,
    label: 'Cestas',
    ...partiel,
  };
}

function deps(surcharge: Partial<DependancesEnvoi> = {}): DependancesEnvoi {
  return {
    recupererMeteo: vi.fn().mockResolvedValue(METEO_TYPE),
    envoyerPush: vi.fn().mockResolvedValue(undefined),
    supprimerAppareil: vi.fn().mockResolvedValue(undefined),
    ...surcharge,
  };
}

describe('dateDuJour', () => {
  it('donne la date calendaire locale, dans le fuseau porté par l’horodatage — jamais la date UTC', () => {
    expect(dateDuJour('2026-10-02T07:00:00+02:00')).toBe('2026-10-02');
    // 7 h à Tokyo : encore la veille en UTC.
    expect(dateDuJour('2026-10-02T07:00:00+09:00')).toBe('2026-10-02');
    expect(dateDuJour('2026-10-02T07:00:00-05:00')).toBe('2026-10-02');
  });
});

describe('traiterEnvoi (§10)', () => {
  it('un seul appareil : une météo, un envoi, la prévision du jour même avec le bon nom de lieu', async () => {
    const d = deps();
    const resume = await traiterEnvoi([appareil('a1')], d);

    expect(resume).toEqual({ groupes: 1, appelsMeteo: 1, envois: 1, supprimes: 0 });
    expect(d.envoyerPush).toHaveBeenCalledOnce();
    const [appareilEnvoye, titre, texte] = vi.mocked(d.envoyerPush).mock.calls[0]!;
    expect(appareilEnvoye.id).toBe('a1');
    expect(titre).toBe('Aujourd’hui à Cestas');
    // Ni l'heure déjà passée (6 h, pluie) ni le lendemain : soleil dès 8 h, orage à 16 h.
    expect(texte).toBe('Soleil le matin, averses orageuses après 16 h. 14° → 31°.');
  });

  it('position actuelle sans nom (label null) : titre « Aujourd’hui » seul', async () => {
    const d = deps();
    await traiterEnvoi([appareil('a1', { label: null })], d);

    const [, titre] = vi.mocked(d.envoyerPush).mock.calls[0]!;
    expect(titre).toBe('Aujourd’hui');
  });

  it('critère d’acceptation explicite (§10) : 50 appareils dans la même case de grille ne déclenchent qu’un appel météo', async () => {
    const d = deps();
    const appareils = Array.from({ length: 50 }, (_, i) => appareil(`a${i}`));
    const resume = await traiterEnvoi(appareils, d);

    expect(resume.appelsMeteo).toBe(1);
    expect(resume.envois).toBe(50);
    expect(d.recupererMeteo).toHaveBeenCalledOnce();
  });

  it('deux groupes distincts déclenchent deux appels météo, chacun avec ses propres coordonnées', async () => {
    const d = deps();
    await traiterEnvoi([appareil('cestas', { lat: 44.74, lon: -0.68 }), appareil('paris', { lat: 48.85, lon: 2.35 })], d);

    expect(d.recupererMeteo).toHaveBeenCalledTimes(2);
    // toFixed(2) plutôt qu'une égalité stricte : le pas de grille (0,05) n'est pas
    // représentable exactement en binaire (imprécision documentée dans grille.ts).
    const appels = vi.mocked(d.recupererMeteo).mock.calls.map(([lat, lon]) => `${lat.toFixed(2)},${lon.toFixed(2)}`);
    expect(appels.sort()).toEqual(['44.75,-0.70', '48.85,2.35']);
  });

  it('critère d’acceptation explicite (§10) : supprime l’appareil sur un envoi qui échoue en 410', async () => {
    const erreur410 = Object.assign(new Error('gone'), { statusCode: 410 });
    const d = deps({ envoyerPush: vi.fn().mockRejectedValue(erreur410) });
    const resume = await traiterEnvoi([appareil('expire')], d);

    expect(resume).toEqual({ groupes: 1, appelsMeteo: 1, envois: 0, supprimes: 1 });
    expect(d.supprimerAppareil).toHaveBeenCalledWith('expire');
  });

  it('supprime aussi sur 404, mais jamais sur une autre erreur (réseau, 5xx) — retentée au prochain cycle', async () => {
    const erreur404 = Object.assign(new Error('not found'), { statusCode: 404 });
    const erreurReseau = new Error('ECONNRESET');
    const d = deps({
      envoyerPush: vi.fn().mockRejectedValueOnce(erreur404).mockRejectedValueOnce(erreurReseau),
    });
    const resume = await traiterEnvoi([appareil('a1'), appareil('a2')], d);

    expect(resume.supprimes).toBe(1);
    expect(resume.envois).toBe(0);
    expect(d.supprimerAppareil).toHaveBeenCalledOnce();
    expect(d.supprimerAppareil).toHaveBeenCalledWith('a1');
  });

  it('un groupe sans donnée pour le jour même dans la réponse météo n’envoie rien pour ce groupe, sans planter (§7)', async () => {
    const meteoIncomplete: MeteoGroupe = { ...METEO_TYPE, quotidien: { forecast: [METEO_TYPE.quotidien.forecast[1]!] } };
    const d = deps({ recupererMeteo: vi.fn().mockResolvedValue(meteoIncomplete) });
    const resume = await traiterEnvoi([appareil('a1')], d);

    expect(resume.envois).toBe(0);
    expect(d.envoyerPush).not.toHaveBeenCalled();
  });

  it('aucun appareil à notifier : ne fait rien, sans appeler la météo', async () => {
    const d = deps();
    const resume = await traiterEnvoi([], d);

    expect(resume).toEqual({ groupes: 0, appelsMeteo: 0, envois: 0, supprimes: 0 });
    expect(d.recupererMeteo).not.toHaveBeenCalled();
  });
});
