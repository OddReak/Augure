import type { EndpointCache } from './cache';
import { enteteCacheControl } from './cache';
import { appellerForeca, ErreurForeca, type RequeteForeca } from './foreca-client';
import { formaterCibleForeca } from './foreca-location';
import { coordonneesSurGrille } from './grille';
import { autoriser } from './limite';

/**
 * Squelette commun aux fonctions `/api/*` centrées sur des coordonnées
 * (current, hourly, daily, air, alerts — `places` fait une recherche
 * textuelle, pas une requête par coordonnées, et a son propre handler) :
 * limite de débit, arrondi sur la grille de cache, appel Foreca avec repli,
 * en-têtes de réponse (§4, §4.1).
 */

export function ipDe(request: Request): string {
  const transmise = request.headers.get('x-forwarded-for');
  if (transmise) return transmise.split(',')[0]?.trim() || 'inconnue';
  return request.headers.get('x-real-ip') ?? 'inconnue';
}

export function reponseErreur(erreur: unknown): Response {
  const message = erreur instanceof ErreurForeca ? erreur.message : 'Erreur inattendue côté serveur.';
  return Response.json({ erreur: message }, { status: 502 });
}

export function creerGestionnaireCoordonnees(
  endpoint: EndpointCache,
  chemin: (location: string) => string,
  paramsSupplementaires: Record<string, string> = {},
) {
  return async function handler(request: Request): Promise<Response> {
    if (!autoriser(ipDe(request))) {
      return Response.json(
        { erreur: 'Trop de requêtes depuis cette adresse, réessayez dans une minute.' },
        { status: 429 },
      );
    }

    const url = new URL(request.url);
    const lat = Number(url.searchParams.get('lat'));
    const lon = Number(url.searchParams.get('lon'));
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return Response.json({ erreur: 'Paramètres lat et lon manquants ou invalides.' }, { status: 400 });
    }

    const { latitude, longitude } = coordonneesSurGrille(lat, lon);
    const location = formaterCibleForeca({ type: 'coordonnees', latitude, longitude });

    const requete: RequeteForeca = {
      endpoint,
      chemin: chemin(location),
      params: { lang: 'fr', ...paramsSupplementaires },
    };

    try {
      const { corps, degrade } = await appellerForeca(requete);
      const entetes = new Headers({ 'Cache-Control': enteteCacheControl(endpoint) });
      if (degrade) entetes.set('x-augure-degrade', degrade);
      return Response.json(corps, { headers: entetes });
    } catch (erreur) {
      return reponseErreur(erreur);
    }
  };
}
