/**
 * Construction du paramètre `{location}` des endpoints Foreca (§4.1).
 *
 * Le piège à verrouiller : Foreca attend `"longitude,latitude"`, l'inverse
 * de la convention habituelle. Une inversion ne renvoie pas d'erreur — elle
 * renvoie la météo valide d'un autre point du globe, silencieusement. Toute
 * construction de `{location}` doit passer par cette seule fonction.
 */

export type CibleForeca =
  | { type: 'coordonnees'; latitude: number; longitude: number }
  | { type: 'identifiant'; id: string };

export function formaterCibleForeca(cible: CibleForeca): string {
  if (cible.type === 'identifiant') {
    return cible.id;
  }
  // longitude EN PREMIER — c'est le piège.
  return `${cible.longitude},${cible.latitude}`;
}
