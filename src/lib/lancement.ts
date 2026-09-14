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
