/**
 * Géométrie du disque lunaire (§6, `disqueLune()` du mockup). Le terminateur
 * (la limite jour/nuit sur le disque) est une demi-ellipse dont le demi-axe
 * horizontal `a` vaut `R × (1 − 2f)` : il vaut R au premier jour (f=0,
 * ellipse = cercle plein côté nuit), 0 au quartier (f=0,5, terminateur =
 * droite), −R à la pleine lune (f=1).
 *
 * **Le piège classique de ce composant** (§6) : le drapeau de sens du grand
 * arc SVG doit s'inverser quand `a` change de signe — sans quoi le
 * terminateur se peint du mauvais côté après le premier quartier.
 */

export const RAYON_DISQUE = 46;

export interface GeometrieDisqueLune {
  /** Demi-axe horizontal du terminateur — son signe pilote `sens`. */
  demiAxe: number;
  /** Drapeau `sweep-flag` du grand arc SVG du terminateur. */
  sens: 0 | 1;
  epaisseurTrait: 2 | 3;
  pasTrame: 3 | 4;
}

export function geometrieDisqueLune(fraction: number, taille: number): GeometrieDisqueLune {
  const demiAxe = RAYON_DISQUE * (1 - 2 * fraction);
  return {
    demiAxe,
    sens: demiAxe > 0 ? 0 : 1,
    epaisseurTrait: taille > 40 ? 3 : 2,
    pasTrame: taille > 40 ? 4 : 3,
  };
}
