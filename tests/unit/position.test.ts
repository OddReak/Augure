import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  etatPermissionGeolocalisation,
  memoriserPosition,
  positionAffinee,
  positionInitiale,
  positionNavigateur,
  positionParIp,
  positionStockee,
} from '../../src/lib/position';

function stubGeolocalisation(impl: Pick<Geolocation, 'getCurrentPosition'>): void {
  Object.defineProperty(navigator, 'geolocation', { value: impl, configurable: true });
}

function stubPermissions(etat: PermissionState | 'indisponible'): void {
  if (etat === 'indisponible') {
    Object.defineProperty(navigator, 'permissions', { value: undefined, configurable: true });
    return;
  }
  Object.defineProperty(navigator, 'permissions', {
    value: { query: vi.fn().mockResolvedValue({ state: etat }) },
    configurable: true,
  });
}

describe('chaîne de repli de position (§7 : stockage → IP → GPS)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('mémorise puis relit une position depuis le stockage', () => {
    expect(positionStockee()).toBeNull();
    memoriserPosition({ latitude: 44.74, longitude: -0.68 });
    expect(positionStockee()).toEqual({ latitude: 44.74, longitude: -0.68 });
  });

  it('ignore un contenu de stockage corrompu plutôt que de planter', () => {
    localStorage.setItem('augure:derniere-position', '{ pas du json valide');
    expect(positionStockee()).toBeNull();
  });

  it("positionParIp lit /api/position et renvoie null sur 204 (hors Vercel)", async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
    expect(await positionParIp()).toBeNull();
  });

  it('positionParIp renvoie les coordonnées sur une réponse 200 valide', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(Response.json({ latitude: 48.85, longitude: 2.35, ville: 'Paris' })),
    );
    expect(await positionParIp()).toEqual({ latitude: 48.85, longitude: 2.35 });
  });

  it('positionParIp renvoie null si la requête échoue', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('hors ligne')));
    expect(await positionParIp()).toBeNull();
  });

  it("etatPermissionGeolocalisation renvoie 'indisponible' sans l'API Permissions", async () => {
    stubPermissions('indisponible');
    expect(await etatPermissionGeolocalisation()).toBe('indisponible');
  });

  it('etatPermissionGeolocalisation relaie l’état rapporté par le navigateur', async () => {
    stubPermissions('denied');
    expect(await etatPermissionGeolocalisation()).toBe('denied');
  });

  it('positionNavigateur résout avec les coordonnées en cas de succès', async () => {
    stubGeolocalisation({
      getCurrentPosition: (succes) => {
        (succes as PositionCallback)({ coords: { latitude: 44.74, longitude: -0.68 } } as GeolocationPosition);
      },
    });
    expect(await positionNavigateur()).toEqual({ latitude: 44.74, longitude: -0.68 });
  });

  it('positionNavigateur résout à null en cas de refus', async () => {
    stubGeolocalisation({
      getCurrentPosition: (_succes, echec) => {
        (echec as PositionErrorCallback)({ code: 1 } as GeolocationPositionError);
      },
    });
    expect(await positionNavigateur()).toBeNull();
  });

  it('positionInitiale privilégie le stockage sur la géolocalisation IP', async () => {
    memoriserPosition({ latitude: 1, longitude: 2 });
    vi.stubGlobal('fetch', vi.fn());
    const resolue = await positionInitiale();
    expect(resolue).toEqual({ coordonnees: { latitude: 1, longitude: 2 }, source: 'stockage' });
  });

  it("positionInitiale retombe sur l'IP si rien n'est stocké", async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ latitude: 48.85, longitude: 2.35 })));
    const resolue = await positionInitiale();
    expect(resolue).toEqual({ coordonnees: { latitude: 48.85, longitude: 2.35 }, source: 'ip' });
  });

  it("positionInitiale renvoie null si ni le stockage ni l'IP ne répondent", async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
    expect(await positionInitiale()).toBeNull();
  });

  it("positionAffinee n'appelle jamais getCurrentPosition en état denied", async () => {
    stubPermissions('denied');
    const getCurrentPosition = vi.fn();
    stubGeolocalisation({ getCurrentPosition });
    expect(await positionAffinee()).toBeNull();
    expect(getCurrentPosition).not.toHaveBeenCalled();
  });

  it('positionAffinee interroge et mémorise la position quand la permission le permet', async () => {
    stubPermissions('granted');
    stubGeolocalisation({
      getCurrentPosition: (succes) => {
        (succes as PositionCallback)({ coords: { latitude: 44.74, longitude: -0.68 } } as GeolocationPosition);
      },
    });
    const resolue = await positionAffinee();
    expect(resolue).toEqual({ coordonnees: { latitude: 44.74, longitude: -0.68 }, source: 'gps' });
    expect(positionStockee()).toEqual({ latitude: 44.74, longitude: -0.68 });
  });
});
