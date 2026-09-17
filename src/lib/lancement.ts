import { useSyncExternalStore } from 'react';

/**
 * Séquence orchestrée du lancement (§7 : « un seul moment orchestré, au
 * lancement, sur 600 ms »). Drapeau de module, pas d'état React ni persisté :
 * l'animation ne doit jouer qu'une seule fois par exécution de l'application
 * (le vrai « lancement »), jamais à un remontage interne du Héros (retour
 * depuis un écran secondaire, re-render après un changement de palier).
 *
 * `lancementAJouer()` renvoie `true` la toute première fois qu'elle est
 * appelée dans la vie du module, `false` ensuite — au composant appelant de
 * ne l'interroger qu'une fois, dans un `useState` d'initialisation.
 */
let joue = false;

export function lancementAJouer(): boolean {
  if (joue) {
    return false;
  }
  joue = true;
  return true;
}

/**
 * Deuxième signal du lancement (§7, post-livraison — écran de lancement) :
 * « les données de l'accueil sont arrivées ». L'écran de lancement
 * (`app/EcranLancement.tsx`) vit au-dessus du routeur, hors de l'arbre de
 * l'accueil : il ne peut pas lire `usePrevisionLieu` lui-même, et la clé de
 * requête dépend d'une position qui n'est pas encore résolue au tout premier
 * rendu.
 *
 * Un magasin externe minimal plutôt qu'un second magasin Zustand (§3 : « un
 * seul store ») : ce drapeau n'est pas un état d'interface persistable, il
 * meurt avec l'exécution — le persister le relèverait déjà vrai au lancement
 * suivant, et l'écran ne s'afficherait plus jamais.
 */
const abonnes = new Set<() => void>();
let donneesPretes = false;

/** Appelé par l'accueil dès que la prévision est là — ou définitivement en échec. */
export function signalerDonneesPretes(): void {
  if (donneesPretes) return;
  donneesPretes = true;
  for (const notifier of abonnes) notifier();
}

function abonner(notifier: () => void): () => void {
  abonnes.add(notifier);
  return () => {
    abonnes.delete(notifier);
  };
}

export function useDonneesPretes(): boolean {
  return useSyncExternalStore(abonner, () => donneesPretes, () => true);
}
