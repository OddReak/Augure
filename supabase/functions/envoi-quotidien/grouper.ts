import { arrondirSurGrille, cleGrille } from '../../../api/_lib/grille.ts';

export interface AppareilGroupable {
  lat: number;
  lon: number;
}

export interface GroupeAppareils<T extends AppareilGroupable> {
  cle: string;
  latitude: number;
  longitude: number;
  appareils: T[];
}

/**
 * Regroupe les appareils par case de grille de 0,05° (§10 : « regroupe par
 * coordonnées arrondies sur la grille de 0,05° avant d'appeler le
 * fournisseur — mille abonnés dans la même ville, c'est une requête météo
 * et mille notifications »). Réutilise `arrondirSurGrille`/`cleGrille`
 * (`api/_lib/grille.ts`, phase 7) — le même arrondi que le cache CDN des
 * fonctions `/api/*`, pas un second calcul de grille à tenir synchronisé.
 *
 * Module pur (aucune dépendance Deno), partagé tel quel entre l'Edge
 * Function et ses tests Vitest (`tests/unit/grouper.test.ts`) — voir
 * DECISIONS.md pour pourquoi ce fichier porte l'extension `.ts` sur son
 * import, comme `src/domain/notification.ts`.
 */
export function grouperParGrille<T extends AppareilGroupable>(appareils: T[]): GroupeAppareils<T>[] {
  const groupes = new Map<string, GroupeAppareils<T>>();
  for (const appareil of appareils) {
    const cle = cleGrille(appareil.lat, appareil.lon);
    let groupe = groupes.get(cle);
    if (!groupe) {
      groupe = { cle, latitude: arrondirSurGrille(appareil.lat), longitude: arrondirSurGrille(appareil.lon), appareils: [] };
      groupes.set(cle, groupe);
    }
    groupe.appareils.push(appareil);
  }
  return [...groupes.values()];
}
