import { http, HttpResponse } from 'msw';
import { CESTAS_AIR, CESTAS_ALERTES, CESTAS_COURANT, CESTAS_HORAIRE, CESTAS_QUOTIDIEN } from './fixtures/cestas';
import { LIEUX_DEMO, type LieuDemo } from './fixtures/demo-lieux';

/**
 * Intercepte les appels vers `/api/*` (les fonctions Vercel de la phase 7)
 * et sert les fixtures. Actif quand `VITE_MOCK=1` (voir `src/mocks/browser.ts`).
 * `/api/position` n'est pas interceptée : elle ne fait rien d'utile hors de
 * l'infrastructure Vercel (§7) — le mode mock doit exercer la même absence
 * de position IP qu'un environnement de développement réel.
 */

function lieuDemoDe(url: URL): LieuDemo | undefined {
  const lat = Number(url.searchParams.get('lat'));
  const lon = Number(url.searchParams.get('lon'));
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return undefined;
  return LIEUX_DEMO.find(
    (d) => d.lieu.coordonnees.latitude.toFixed(2) === lat.toFixed(2) && d.lieu.coordonnees.longitude.toFixed(2) === lon.toFixed(2),
  );
}

export const handlers = [
  http.get('/api/current', ({ request }) => {
    const demo = lieuDemoDe(new URL(request.url));
    return HttpResponse.json(demo?.courant ?? CESTAS_COURANT);
  }),
  // La frise horaire (48 h) n'a qu'un scénario en mode mock (Cestas) : les lieux de
  // démonstration de l'écran « Mes lieux » n'en ont besoin que pour leur vignette
  // (current + daily), jamais ouverts sur l'accueil complet dans cette phase.
  http.get('/api/hourly', () => HttpResponse.json(CESTAS_HORAIRE)),
  http.get('/api/daily', ({ request }) => {
    const demo = lieuDemoDe(new URL(request.url));
    return HttpResponse.json(demo?.quotidien ?? CESTAS_QUOTIDIEN);
  }),
  http.get('/api/air', () => HttpResponse.json(CESTAS_AIR)),
  http.get('/api/alerts', ({ request }) => {
    const demo = lieuDemoDe(new URL(request.url));
    return HttpResponse.json(demo?.alertes ?? CESTAS_ALERTES);
  }),
  http.get('/api/places', ({ request }) => {
    const recherche = new URL(request.url).searchParams.get('q')?.trim().toLowerCase() ?? '';
    // Recherche par préfixe du nom, insensible à la casse — suffisant pour le mode mock (§3) ;
    // la vraie recherche Foreca (phase 7, `location/search/{query}`) fait bien plus.
    const resultats = recherche
      ? LIEUX_DEMO.filter((d) => d.lieu.nom.toLowerCase().startsWith(recherche))
      : LIEUX_DEMO;
    return HttpResponse.json({
      locations: resultats.map((d, i) => ({
        id: `demo-${i}`,
        name: d.lieu.nom,
        country: 'France',
        adminArea: d.lieu.region,
        lat: d.lieu.coordonnees.latitude,
        lon: d.lieu.coordonnees.longitude,
      })),
    });
  }),
];
