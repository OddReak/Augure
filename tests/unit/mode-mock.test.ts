import { afterAll, beforeAll, afterEach, describe, expect, it } from 'vitest';
import { setupServer } from 'msw/node';
import { handlers } from '../../src/mocks/handlers';
import { CESTAS_COURANT } from '../../src/mocks/fixtures/cestas';

/**
 * VITE_MOCK=1 (phase 3) : l'application doit pouvoir tourner entièrement
 * contre les fixtures, sans réseau. Ce test vérifie le mécanisme
 * d'interception lui-même — celui que `src/mocks/browser.ts` active dans
 * le navigateur — indépendamment de l'écran qui le consommera (phase 4+).
 */
const serveur = setupServer(...handlers);

beforeAll(() => serveur.listen({ onUnhandledRequest: 'error' }));
afterEach(() => serveur.resetHandlers());
afterAll(() => serveur.close());

describe('mode mock (sans réseau)', () => {
  it('/api/current répond avec la fixture Cestas, sans appel réseau réel', async () => {
    const reponse = await fetch('/api/current');
    expect(reponse.ok).toBe(true);
    await expect(reponse.json()).resolves.toEqual(CESTAS_COURANT);
  });
});
