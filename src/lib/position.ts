import type { CoordonneesGeo } from '../domain/types';

/**
 * Chaîne de repli de position (§7) : dernière position connue persistée →
 * géolocalisation IP → `getCurrentPosition()` si la permission est déjà
 * accordée → recherche manuelle. Ne bloque jamais le premier rendu :
 * `positionInitiale` ne fait que lire le stockage puis, si vide, interroger
 * `/api/position` (IP) — jamais `getCurrentPosition()`, qui ouvrirait le
 * dialogue système avant que l'application n'ait eu le temps de se peindre
 * (§7 : « jamais l'inverse »). La localisation GPS est une étape séparée,
 * différée à la frame suivante par l'appelant (`usePosition.ts`).
 */

export type SourcePosition = 'stockage' | 'ip' | 'gps';

// Repli tant qu'aucune source de la chaîne du §7 n'a répondu — le tout premier
// appel, avant toute persistance et hors de l'infrastructure Vercel (`/api/position`
// répond 204 en local). Coordonnées de Cestas, identiques à la fixture MSW de la
// phase 3, pour que le mode mock continue de fonctionner sans dépendre d'une vraie
// position. Partagé entre l'accueil et « Mes lieux » (§8) : les deux écrans doivent
// s'accorder sur ce qu'est « la position actuelle » quand rien n'est encore résolu.
export const POSITION_PAR_DEFAUT: CoordonneesGeo = { latitude: 44.74, longitude: -0.68 };

export interface PositionResolue {
  coordonnees: CoordonneesGeo;
  source: SourcePosition;
}

const CLE_STOCKAGE = 'augure:derniere-position';

export function positionStockee(): CoordonneesGeo | null {
  try {
    const brut = localStorage.getItem(CLE_STOCKAGE);
    if (!brut) return null;
    const valeur = JSON.parse(brut) as Partial<CoordonneesGeo>;
    if (typeof valeur.latitude !== 'number' || typeof valeur.longitude !== 'number') return null;
    return { latitude: valeur.latitude, longitude: valeur.longitude };
  } catch {
    // Stockage indisponible (navigation privée, quota dépassé) : pas de position stockée,
    // la chaîne continue avec l'étape suivante plutôt que d'échouer.
    return null;
  }
}

export function memoriserPosition(coordonnees: CoordonneesGeo): void {
  try {
    localStorage.setItem(CLE_STOCKAGE, JSON.stringify(coordonnees));
  } catch {
    // Non bloquant : la position reste utilisable pour la session en cours.
  }
}

export async function positionParIp(): Promise<CoordonneesGeo | null> {
  try {
    const reponse = await fetch('/api/position');
    if (reponse.status === 204 || !reponse.ok) return null;
    const corps = (await reponse.json()) as Partial<CoordonneesGeo>;
    if (typeof corps.latitude !== 'number' || typeof corps.longitude !== 'number') return null;
    return { latitude: corps.latitude, longitude: corps.longitude };
  } catch {
    return null;
  }
}

export type EtatPermissionGeolocalisation = 'granted' | 'denied' | 'prompt' | 'indisponible';

export async function etatPermissionGeolocalisation(): Promise<EtatPermissionGeolocalisation> {
  if (!('permissions' in navigator)) return 'indisponible';
  try {
    const statut = await navigator.permissions.query({ name: 'geolocation' });
    return statut.state;
  } catch {
    return 'indisponible';
  }
}

/** Options de géolocalisation (§7) : la grille de cache fait 5 km de côté, la haute précision ne gagne rien. */
const OPTIONS_GEOLOCALISATION: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 8000,
  maximumAge: 300_000,
};

export function positionNavigateur(): Promise<CoordonneesGeo | null> {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
      () => resolve(null),
      OPTIONS_GEOLOCALISATION,
    );
  });
}

/**
 * Première étape, non bloquante : dernière position connue, sinon IP.
 * N'appelle jamais `getCurrentPosition()` — ce serait ouvrir le dialogue
 * système avant le premier rendu (§7).
 */
export async function positionInitiale(): Promise<PositionResolue | null> {
  const stockee = positionStockee();
  if (stockee) return { coordonnees: stockee, source: 'stockage' };

  const ip = await positionParIp();
  if (ip) return { coordonnees: ip, source: 'ip' };

  return null;
}

/**
 * Deuxième étape, différée à la frame suivante par l'appelant : demande la
 * position GPS seulement si la permission est déjà accordée (§7 : « en état
 * denied, n'appelle plus getCurrentPosition() ») — sur la première visite,
 * l'état est `prompt` et cet appel affiche le dialogue système, exactement
 * l'effet recherché puisque l'application est déjà peinte derrière lui.
 */
export async function positionAffinee(): Promise<PositionResolue | null> {
  const permission = await etatPermissionGeolocalisation();
  if (permission === 'denied') return null;

  const gps = await positionNavigateur();
  if (!gps) return null;

  memoriserPosition(gps);
  return { coordonnees: gps, source: 'gps' };
}
