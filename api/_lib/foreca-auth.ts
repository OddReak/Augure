/**
 * Authentification Foreca (§4.1), pilotée par `FORECA_MODE=direct|rapidapi`
 * pour que changer de voie d'accès ne touche qu'un fichier.
 *
 * Vérifié contre developer.foreca.com au moment d'écrire ce module :
 * l'API attend `Authorization: Bearer <jeton>` (voie directe) — le jeton est
 * un secret statique généré dans le tableau de bord « My API », il n'existe
 * pas de flux de connexion programmatique par identifiant/mot de passe.
 * `FORECA_USER`/`FORECA_PASSWORD` (§2) servent donc seulement à toi,
 * humain, pour te connecter au tableau de bord et y récupérer le jeton —
 * jamais envoyés à l'API. Si la phase 7, contre un compte réel, révèle un
 * jeton à durée de vie limitée plutôt qu'un secret statique, seule la
 * fonction `obtenirJetonDirect` ci-dessous change : le cache et sa marge de
 * 60 secondes sont déjà en place.
 */

export type ModeForeca = 'direct' | 'rapidapi';

interface JetonMemorise {
  valeur: string;
  expireLe: number;
}

const MARGE_EXPIRATION_MS = 60_000;

let jetonCache: JetonMemorise | null = null;

/** Exposé pour les tests uniquement : un module Vercel vit le temps d'une invocation, pas le cache. */
export function reinitialiserCacheJeton(): void {
  jetonCache = null;
}

function modeConfigure(): ModeForeca {
  const mode = process.env.FORECA_MODE;
  if (mode === 'rapidapi') return 'rapidapi';
  return 'direct';
}

async function obtenirJetonDirect(horloge: () => number = Date.now): Promise<string> {
  const maintenant = horloge();
  if (jetonCache && jetonCache.expireLe - MARGE_EXPIRATION_MS > maintenant) {
    return jetonCache.valeur;
  }

  const jeton = process.env.FORECA_TOKEN;
  if (!jeton) {
    throw new Error(
      "FORECA_TOKEN manquant. L'API Foreca directe s'authentifie par un jeton statique généré " +
        'dans My API (developer.foreca.com) — FORECA_USER/FORECA_PASSWORD servent seulement à ' +
        's\'y connecter, ils ne sont jamais envoyés à l\'API.',
    );
  }

  // Le jeton généré depuis le tableau de bord est un secret statique, sans expiration connue :
  // on le met en cache avec une échéance longue plutôt que de le redemander à chaque requête.
  jetonCache = { valeur: jeton, expireLe: maintenant + 24 * 3600 * 1000 };
  return jetonCache.valeur;
}

export async function enteteAutorisationForeca(
  horloge: () => number = Date.now,
): Promise<Record<string, string>> {
  const mode = modeConfigure();

  if (mode === 'rapidapi') {
    const cle = process.env.FORECA_RAPIDAPI_KEY;
    if (!cle) {
      throw new Error('FORECA_RAPIDAPI_KEY manquant alors que FORECA_MODE=rapidapi.');
    }
    return { 'X-RapidAPI-Key': cle };
  }

  const jeton = await obtenirJetonDirect(horloge);
  return { Authorization: `Bearer ${jeton}` };
}
