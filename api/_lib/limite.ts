/**
 * Limite de débit par IP (§4.1) : « généreuse, uniquement pour couper un
 * script » — les endpoints sont ouverts, il n'y a pas d'authentification.
 * Fenêtre glissante en mémoire d'instance : réinitialisée à chaque
 * redémarrage de fonction, non partagée entre instances chaudes. C'est un
 * filet best-effort, pas une garantie exacte multi-instance (même réserve
 * que `quota.ts`, voir DECISIONS.md) — suffisant pour son seul objectif,
 * couper une boucle de script, pas pour un budget qui doit être exact.
 */

const FENETRE_MS = 60_000;
const PLAFOND_PAR_FENETRE = 60;

const compteurs = new Map<string, number[]>();

export function reinitialiserLimite(): void {
  compteurs.clear();
}

export function autoriser(ip: string, horloge: () => number = Date.now): boolean {
  const maintenant = horloge();
  const horodatages = (compteurs.get(ip) ?? []).filter((t) => maintenant - t < FENETRE_MS);
  if (horodatages.length >= PLAFOND_PAR_FENETRE) {
    compteurs.set(ip, horodatages);
    return false;
  }
  horodatages.push(maintenant);
  compteurs.set(ip, horodatages);
  return true;
}
