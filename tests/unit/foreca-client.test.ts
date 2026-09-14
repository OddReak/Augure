import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { appellerForeca, ErreurForeca } from '../../api/_lib/foreca-client';
import { reinitialiserCacheJeton } from '../../api/_lib/foreca-auth';
import { enregistrerAppel, reinitialiserQuota } from '../../api/_lib/quota';

const ENV_ORIGINAL = { ...process.env };

function reponseJson(corps: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: () => Promise.resolve(corps),
  } as Response;
}

describe("appelant Foreca partagé (§4.1, acceptation phase 7 : échec fournisseur → dernière donnée connue)", () => {
  beforeEach(() => {
    reinitialiserQuota();
    reinitialiserCacheJeton();
    process.env.FORECA_MODE = 'direct';
    process.env.FORECA_TOKEN = 'jeton-de-test';
  });

  afterEach(() => {
    process.env = { ...ENV_ORIGINAL };
    vi.unstubAllGlobals();
  });

  it('appelle réellement Foreca et mémorise la réponse en cas de succès', async () => {
    const fetchSimule = vi.fn().mockResolvedValue(reponseJson({ temperature: 28 }));
    vi.stubGlobal('fetch', fetchSimule);

    const resultat = await appellerForeca<{ temperature: number }>({
      endpoint: 'current',
      chemin: 'current/-0.68,44.74',
    });

    expect(resultat).toEqual({ corps: { temperature: 28 }, degrade: null });
    expect(fetchSimule).toHaveBeenCalledTimes(1);
    const [urlAppelee] = fetchSimule.mock.calls[0] as [string];
    expect(urlAppelee).toBe('https://weatherapi.foreca.net/api/v1/current/-0.68,44.74');
  });

  it('sert la dernière réponse connue quand le fournisseur échoue en réseau', async () => {
    const fetchReussi = vi.fn().mockResolvedValue(reponseJson({ temperature: 28 }));
    vi.stubGlobal('fetch', fetchReussi);
    await appellerForeca({ endpoint: 'current', chemin: 'current/-0.68,44.74' });

    const fetchEnPanne = vi.fn().mockRejectedValue(new Error('réseau coupé'));
    vi.stubGlobal('fetch', fetchEnPanne);
    const resultat = await appellerForeca<{ temperature: number }>({
      endpoint: 'current',
      chemin: 'current/-0.68,44.74',
    });

    expect(resultat).toEqual({ corps: { temperature: 28 }, degrade: 'echec' });
  });

  it('sert la dernière réponse connue quand le fournisseur répond en erreur HTTP', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reponseJson({ temperature: 28 })));
    await appellerForeca({ endpoint: 'current', chemin: 'current/-0.68,44.74' });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reponseJson(null, false, 500)));
    const resultat = await appellerForeca<{ temperature: number }>({
      endpoint: 'current',
      chemin: 'current/-0.68,44.74',
    });

    expect(resultat.degrade).toBe('echec');
  });

  it("échoue clairement quand le fournisseur est en panne et qu'aucun repli n'existe", async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('réseau coupé')));
    await expect(
      appellerForeca({ endpoint: 'current', chemin: 'current/jamais-appele-avant' }),
    ).rejects.toThrow(ErreurForeca);
  });

  it('sous le seuil de dégradation, sert la dernière réponse sans appeler Foreca', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reponseJson({ temperature: 28 })));
    await appellerForeca({ endpoint: 'current', chemin: 'current/-0.68,44.74' });

    for (let i = 0; i < 1700; i += 1) enregistrerAppel();
    const fetchNonAppele = vi.fn();
    vi.stubGlobal('fetch', fetchNonAppele);

    const resultat = await appellerForeca<{ temperature: number }>({
      endpoint: 'current',
      chemin: 'current/-0.68,44.74',
    });

    expect(resultat).toEqual({ corps: { temperature: 28 }, degrade: 'quota' });
    expect(fetchNonAppele).not.toHaveBeenCalled();
  });

  it("au-delà du seuil sans repli disponible, appelle quand même plutôt que d'échouer d'office", async () => {
    for (let i = 0; i < 1700; i += 1) enregistrerAppel();
    const fetchAppele = vi.fn().mockResolvedValue(reponseJson({ temperature: 12 }));
    vi.stubGlobal('fetch', fetchAppele);

    const resultat = await appellerForeca<{ temperature: number }>({
      endpoint: 'current',
      chemin: 'current/jamais-appele-avant-2',
    });

    expect(fetchAppele).toHaveBeenCalledTimes(1);
    expect(resultat).toEqual({ corps: { temperature: 12 }, degrade: null });
  });

  it('bascule sur la base RapidAPI en mode rapidapi, sans préfixe /api/v1', async () => {
    process.env.FORECA_MODE = 'rapidapi';
    process.env.FORECA_RAPIDAPI_KEY = 'cle-rapidapi';
    const fetchSimule = vi.fn().mockResolvedValue(reponseJson({ temperature: 28 }));
    vi.stubGlobal('fetch', fetchSimule);

    await appellerForeca({ endpoint: 'current', chemin: 'current/-0.68,44.74' });

    const [urlAppelee, options] = fetchSimule.mock.calls[0] as [string, RequestInit];
    expect(urlAppelee).toBe('https://foreca-weather.p.rapidapi.com/current/-0.68,44.74');
    expect(options.headers).toEqual({
      'X-RapidAPI-Key': 'cle-rapidapi',
      'X-RapidAPI-Host': 'foreca-weather.p.rapidapi.com',
    });
  });
});
