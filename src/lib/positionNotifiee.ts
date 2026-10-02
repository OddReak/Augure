/**
 * Dernière position (case de grille de 0,05°, fuseau) enregistrée pour la
 * notification quotidienne (§10) — de quoi savoir, à chaque ouverture, si
 * la ligne `devices` doit être mise à jour sans appeler Supabase pour rien.
 * Module léger, sans `@supabase/supabase-js` : l'accueil l'importe
 * statiquement, `push.ts` seulement à la demande (budget du bundle initial,
 * §11, voir `router.tsx`).
 */

const CLE_STOCKAGE = 'augure:position-notifiee';
const PAS_GRILLE = 0.05;

// Même arrondi que `api/_lib/grille.ts` (regroupement des envois) : un déplacement à
// l'intérieur d'une case ne change pas la prévision envoyée, inutile de réenregistrer.
function surGrille(valeur: number): string {
  return (Math.round(valeur / PAS_GRILLE) * PAS_GRILLE).toFixed(2);
}

export function fuseauNavigateur(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function clePositionNotifiee(latitude: number, longitude: number, fuseau: string): string {
  return `${surGrille(latitude)},${surGrille(longitude)}|${fuseau}`;
}

export function positionNotifiee(): string | null {
  try {
    return localStorage.getItem(CLE_STOCKAGE);
  } catch {
    return null;
  }
}

export function memoriserPositionNotifiee(cle: string): void {
  try {
    localStorage.setItem(CLE_STOCKAGE, cle);
  } catch {
    // Non bloquant : la prochaine ouverture réenregistrera simplement la même position.
  }
}

export function oublierPositionNotifiee(): void {
  try {
    localStorage.removeItem(CLE_STOCKAGE);
  } catch {
    // idem.
  }
}
