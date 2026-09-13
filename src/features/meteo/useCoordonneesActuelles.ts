import { useMagasinUi } from '../../lib/magasin';
import { POSITION_PAR_DEFAUT } from '../../lib/position';
import { usePosition } from '../../lib/usePosition';

// Aucune recherche inverse coordonnées → nom de lieu tant qu'un géocodage
// inverse n'est pas câblé (§8, décision, voir DECISIONS.md) : « Cestas »
// n'est correct que pour le repli par défaut, un nom générique le reste
// tant que la position vient d'une source réelle (IP ou GPS).
function nomLieuPour(source: 'defaut' | 'stockage' | 'ip' | 'gps'): string {
  return source === 'defaut' ? 'Cestas' : 'Votre position';
}

/**
 * Coordonnées et nom du lieu affiché, partagés par tous les écrans qui
 * interrogent la prévision (Accueil, Détail d'un jour, §8) : `lieuActif`
 * (choisi explicitement, menu de lieu) prime sur la position résolue par la
 * chaîne du §7, elle-même repliée sur Cestas tant que rien n'a répondu.
 * Une seule source de vérité — la même clé de requête TanStack Query partout,
 * donc pas de second appel réseau pour ouvrir le détail d'un jour déjà chargé.
 */
export function useCoordonneesActuelles() {
  const position = usePosition();
  const lieuActif = useMagasinUi((etat) => etat.lieuActif);
  const coordonnees = lieuActif?.coordonnees ?? position?.coordonnees ?? POSITION_PAR_DEFAUT;
  const nomLieu = lieuActif?.nom ?? nomLieuPour(position?.source ?? 'defaut');
  return { latitude: coordonnees.latitude, longitude: coordonnees.longitude, nomLieu };
}
