/**
 * Types de domaine. Étoffé en phase 3 (adaptateur Foreca) — pour l'instant,
 * seul `Palier` existe, nécessaire au système de design de la phase 1.
 */

/** Les six régimes visuels de l'application (§5.2), par priorité décroissante. */
export type Palier = 'colere' | 'fournaise' | 'cendre' | 'ondee' | 'veille' | 'vigies';

export const PALIERS: readonly Palier[] = [
  'colere',
  'fournaise',
  'cendre',
  'ondee',
  'veille',
  'vigies',
];
