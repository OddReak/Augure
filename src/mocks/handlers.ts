import { http, HttpResponse } from 'msw';
import { CESTAS_COURANT, CESTAS_HORAIRE, CESTAS_QUOTIDIEN } from './fixtures/cestas';

/**
 * Intercepte les appels vers `/api/*` (les fonctions Vercel de la phase 7,
 * pas encore construites) et sert les fixtures Cestas. Actif quand
 * `VITE_MOCK=1` (voir `src/mocks/browser.ts`).
 */
export const handlers = [
  http.get('/api/current', () => HttpResponse.json(CESTAS_COURANT)),
  http.get('/api/hourly', () => HttpResponse.json(CESTAS_HORAIRE)),
  http.get('/api/daily', () => HttpResponse.json(CESTAS_QUOTIDIEN)),
];
