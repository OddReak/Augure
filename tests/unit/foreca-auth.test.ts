import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { enteteAutorisationForeca, reinitialiserCacheJeton } from '../../api/_lib/foreca-auth';

const ENV_ORIGINAL = { ...process.env };

beforeEach(() => {
  reinitialiserCacheJeton();
});

afterEach(() => {
  process.env = { ...ENV_ORIGINAL };
});

describe('authentification Foreca', () => {
  it('mode rapidapi : pose l\'en-tête X-RapidAPI-Key', async () => {
    process.env.FORECA_MODE = 'rapidapi';
    process.env.FORECA_RAPIDAPI_KEY = 'cle-de-test';
    await expect(enteteAutorisationForeca()).resolves.toEqual({ 'X-RapidAPI-Key': 'cle-de-test' });
  });

  it('mode direct : pose Authorization: Bearer <jeton>', async () => {
    process.env.FORECA_MODE = 'direct';
    process.env.FORECA_TOKEN = 'jeton-de-test';
    await expect(enteteAutorisationForeca()).resolves.toEqual({ Authorization: 'Bearer jeton-de-test' });
  });

  it('mémorise le jeton et ne le redemande pas à chaque appel', async () => {
    process.env.FORECA_MODE = 'direct';
    process.env.FORECA_TOKEN = 'jeton-initial';
    let maintenant = 0;
    const horloge = () => maintenant;

    await enteteAutorisationForeca(horloge);
    // Le jeton d'environnement change, mais le cache doit encore servir l'ancienne valeur.
    process.env.FORECA_TOKEN = 'jeton-modifie';
    maintenant = 1000; // bien avant l'échéance (24h) moins la marge de 60s
    const entete = await enteteAutorisationForeca(horloge);
    expect(entete).toEqual({ Authorization: 'Bearer jeton-initial' });
  });

  it('redemande un jeton une fois la marge de 60 secondes avant expiration atteinte', async () => {
    process.env.FORECA_MODE = 'direct';
    process.env.FORECA_TOKEN = 'jeton-initial';
    let maintenant = 0;
    const horloge = () => maintenant;
    await enteteAutorisationForeca(horloge);

    process.env.FORECA_TOKEN = 'jeton-renouvele';
    maintenant = 24 * 3600 * 1000 - 30_000; // à 30s de l'échéance : dans la marge de 60s
    const entete = await enteteAutorisationForeca(horloge);
    expect(entete).toEqual({ Authorization: 'Bearer jeton-renouvele' });
  });

  it('échoue clairement si FORECA_TOKEN manque en mode direct', async () => {
    process.env.FORECA_MODE = 'direct';
    delete process.env.FORECA_TOKEN;
    await expect(enteteAutorisationForeca()).rejects.toThrow(/FORECA_TOKEN/);
  });
});
