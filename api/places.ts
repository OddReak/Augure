import { enteteCacheControl } from './_lib/cache.js';
import { appellerForeca } from './_lib/foreca-client.js';
import { autoriser } from './_lib/limite.js';
import { ipDe, reponseErreur } from './_lib/route.js';

/**
 * Recherche de lieux (§4, §4.1) : `s-maxage=604800` — « une commune ne bouge
 * pas ». Requête par texte libre, pas par coordonnées : ni grille de cache
 * ni arrondi ici, la clé de repli est le texte de recherche lui-même
 * (`foreca-client.ts`).
 */
export const config = { runtime: 'edge' };

export default async function handler(request: Request): Promise<Response> {
  if (!autoriser(ipDe(request))) {
    return Response.json(
      { erreur: 'Trop de requêtes depuis cette adresse, réessayez dans une minute.' },
      { status: 429 },
    );
  }

  const url = new URL(request.url);
  const recherche = url.searchParams.get('q')?.trim();
  if (!recherche) {
    return Response.json({ erreur: 'Paramètre q (texte de recherche) manquant.' }, { status: 400 });
  }

  try {
    const { corps, degrade } = await appellerForeca({
      endpoint: 'places',
      chemin: `location/search/${encodeURIComponent(recherche)}`,
      params: { lang: 'fr' },
    });
    const entetes = new Headers({ 'Cache-Control': enteteCacheControl('places') });
    if (degrade) entetes.set('x-augure-degrade', degrade);
    return Response.json(corps, { headers: entetes });
  } catch (erreur) {
    return reponseErreur(erreur);
  }
}
