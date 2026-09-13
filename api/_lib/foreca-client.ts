import { enteteAutorisationForeca, HOTE_RAPIDAPI } from './foreca-auth';
import type { EndpointCache } from './cache';
import { derniereReponseConnue, enregistrerAppel, memoriserDerniereReponse, quotaDegrade } from './quota';

/**
 * Appelant Foreca partagé par les fonctions `/api/*` (§4.1). Deux bases
 * d'URL selon `FORECA_MODE` :
 * - `direct` : `weatherapi.foreca.net/api/v1`, chemins documentés tels quels
 *   (`current/{location}`, `forecast/hourly/{location}`…), vérifiés contre
 *   corporate.foreca.com/en/api-technical-details (recherche web, phase 7).
 * - `rapidapi` : hôte `foreca-weather.p.rapidapi.com`, **sans** le préfixe
 *   `/api/v1` — vérifié contre le code source du client open-source
 *   mr-ransel/ha-foreca-weather, qui interroge directement `/current/{id}`,
 *   `/forecast/hourly/{id}`, etc. Les deux voies restent alignées sur les
 *   mêmes segments de chemin, seule la base change : un seul appelant, pas
 *   une réécriture de chemin par mode.
 */

export type ModeForeca = 'direct' | 'rapidapi';

function modeConfigure(): ModeForeca {
  return process.env.FORECA_MODE === 'rapidapi' ? 'rapidapi' : 'direct';
}

function urlBase(): string {
  return modeConfigure() === 'rapidapi' ? `https://${HOTE_RAPIDAPI}` : 'https://weatherapi.foreca.net/api/v1';
}

export interface RequeteForeca {
  /** Pour l'en-tête `Cache-Control` (§4) et la clé de repli en cas de dégradation. */
  endpoint: EndpointCache;
  /** Chemin après la base, sans slash initial — ex. `forecast/hourly/-0.68,44.74`. */
  chemin: string;
  params?: Record<string, string>;
}

export type RaisonDegradation = 'quota' | 'echec';

export interface ReponseForeca<T> {
  corps: T;
  /** `null` si la réponse vient d'un appel réussi à l'instant, sinon la raison du repli. */
  degrade: RaisonDegradation | null;
}

export class ErreurForeca extends Error {}

function cleRepli(requete: RequeteForeca): string {
  const params = new URLSearchParams(requete.params ?? {});
  params.sort();
  return `${requete.endpoint}:${requete.chemin}?${params.toString()}`;
}

/**
 * Appelle Foreca pour la requête donnée. Sous 85 % du budget quotidien et
 * sans panne, appelle réellement et mémorise la réponse. Au-delà du seuil de
 * quota (`quota.ts`) ou en cas de panne réseau/HTTP, sert la dernière
 * réponse connue pour cette même requête si elle existe (§4.1 : « une
 * application qui affiche une donnée d'il y a deux heures est utilisable »),
 * et ne lève une erreur que si aucun repli n'est disponible.
 */
export async function appellerForeca<T>(
  requete: RequeteForeca,
  horloge: () => number = Date.now,
): Promise<ReponseForeca<T>> {
  const cle = cleRepli(requete);

  if (quotaDegrade(horloge)) {
    const derniere = derniereReponseConnue<T>(cle);
    if (derniere !== undefined) {
      return { corps: derniere, degrade: 'quota' };
    }
    // Pas de repli en mémoire pour cette requête précise : mieux vaut tenter l'appel réel
    // qu'échouer d'office (§4.1 : « une application qui renvoie 429 ne l'est pas »).
  }

  const params = new URLSearchParams(requete.params ?? {});
  const chaineParams = params.toString();
  const url = `${urlBase()}/${requete.chemin}${chaineParams ? `?${chaineParams}` : ''}`;

  let reponseHttp: Response;
  try {
    const entetes = await enteteAutorisationForeca(horloge);
    reponseHttp = await fetch(url, { headers: entetes });
  } catch (erreur) {
    const derniere = derniereReponseConnue<T>(cle);
    if (derniere !== undefined) return { corps: derniere, degrade: 'echec' };
    throw new ErreurForeca(
      `Foreca est injoignable pour ${requete.chemin} et aucune donnée précédente n'est en mémoire : ${String(erreur)}`,
    );
  }

  if (!reponseHttp.ok) {
    const derniere = derniereReponseConnue<T>(cle);
    if (derniere !== undefined) return { corps: derniere, degrade: 'echec' };
    throw new ErreurForeca(
      `Foreca a répondu ${reponseHttp.status} pour ${requete.chemin} et aucune donnée précédente n'est en mémoire.`,
    );
  }

  enregistrerAppel(horloge);
  const corps = (await reponseHttp.json()) as T;
  memoriserDerniereReponse(cle, corps);
  return { corps, degrade: null };
}
