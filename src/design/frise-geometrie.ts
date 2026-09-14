/**
 * Géométrie de la frise horaire (§6, fonction `horaires()` du mockup) :
 * pas de 58 px, bande de tracé entre y=74 et y=116, hauteur totale 156.
 *
 * Ne dépend jamais de la métrique affichée — seulement du nombre de points
 * et de la présence d'un repère de jour (`sep`) — c'est ce qui garantit que
 * les colonnes ne bougent pas d'un pixel quand on bascule de métrique
 * (phase 5, critère d'acceptation).
 */

export const PAS_COLONNE = 58;
export const LARGEUR_SEPARATEUR = 26;
export const HAUT_TRACE = 74;
export const BAS_TRACE = 116;
export const HAUTEUR = 156;
export const MARGE_DROITE = 22;

/** Centre x de chaque colonne, en tenant compte du décalage introduit par les repères de jour. */
export function positionsColonnes(points: ReadonlyArray<{ sep?: string }>): number[] {
  let decalage = 0;
  return points.map((p, i) => {
    if (p.sep) decalage += LARGEUR_SEPARATEUR;
    return decalage + i * PAS_COLONNE + PAS_COLONNE / 2;
  });
}

/** x du trait de séparation lui-même, pour le point qui porte `sep` (avant le décalage de ce point). */
export function positionSeparateur(points: ReadonlyArray<{ sep?: string }>, index: number): number {
  let decalage = 0;
  for (let i = 0; i < index; i++) {
    if (points[i].sep) decalage += LARGEUR_SEPARATEUR;
  }
  return decalage + index * PAS_COLONNE + 2;
}

/** Largeur totale du SVG défilant, colonnes et repères de jour compris. */
export function largeurFrise(points: ReadonlyArray<{ sep?: string }>): number {
  const decalageTotal = points.filter((p) => p.sep).length * LARGEUR_SEPARATEUR;
  return decalageTotal + points.length * PAS_COLONNE + MARGE_DROITE;
}
