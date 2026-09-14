/**
 * Arrondi des coordonnées sur une grille de 0,05° (~5 km) avant construction
 * de la clé de cache (§4.1). Sans cet arrondi, chaque utilisateur produit
 * une clé unique et le taux de succès du cache CDN est nul — c'est le seul
 * levier qui décide si le service tient dans le quota Foreca. La même
 * fonction sert au regroupement des envois push (phase 10).
 */

const PAS_GRILLE = 0.05;

export function arrondirSurGrille(valeur: number): number {
  return Math.round(valeur / PAS_GRILLE) * PAS_GRILLE;
}

export interface CoordonneesArrondies {
  latitude: number;
  longitude: number;
}

export function coordonneesSurGrille(latitude: number, longitude: number): CoordonneesArrondies {
  return { latitude: arrondirSurGrille(latitude), longitude: arrondirSurGrille(longitude) };
}

/** Clé de cache stable pour un couple de coordonnées, après arrondi sur la grille. */
export function cleGrille(latitude: number, longitude: number): string {
  const { latitude: lat, longitude: lon } = coordonneesSurGrille(latitude, longitude);
  // toFixed(2) : le pas de 0,05 ne produit jamais plus de deux décimales significatives ;
  // fixe la représentation pour que deux arrondis à la même case produisent la même chaîne
  // malgré les imprécisions binaires de la division flottante (ex. 0,15000000000000002).
  return `${lat.toFixed(2)},${lon.toFixed(2)}`;
}
