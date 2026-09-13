import { http, HttpResponse } from 'msw';
import {
  CESTAS_AIR,
  CESTAS_ALERTES,
  CESTAS_COURANT,
  CESTAS_HORAIRE,
  CESTAS_QUOTIDIEN,
  CESTAS_RECHERCHE,
} from './fixtures/cestas';

/**
 * Intercepte les appels vers `/api/*` (les fonctions Vercel de la phase 7)
 * et sert les fixtures Cestas. Actif quand `VITE_MOCK=1` (voir
 * `src/mocks/browser.ts`). `/api/position` n'est pas interceptée : elle ne
 * fait rien d'utile hors de l'infrastructure Vercel (§7, en-têtes
 * `x-vercel-ip-*`) — le mode mock doit exercer la même absence de position
 * IP qu'un environnement de développement réel.
 */
export const handlers = [
  http.get('/api/current', () => HttpResponse.json(CESTAS_COURANT)),
  http.get('/api/hourly', () => HttpResponse.json(CESTAS_HORAIRE)),
  http.get('/api/daily', () => HttpResponse.json(CESTAS_QUOTIDIEN)),
  http.get('/api/air', () => HttpResponse.json(CESTAS_AIR)),
  http.get('/api/alerts', () => HttpResponse.json(CESTAS_ALERTES)),
  http.get('/api/places', () => HttpResponse.json(CESTAS_RECHERCHE)),
];
