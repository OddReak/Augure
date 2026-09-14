import type { IdSigneMeteo } from './signes.ts';

/**
 * Types de domaine. Toutes les unités sont en SI (§4.1, « unités toujours
 * stockées en SI, converties à l'affichage »).
 *
 * Import relatif en `.ts` (voir `notification.ts`) : importé tel quel par
 * l'Edge Function `envoi-quotidien` (Deno, phase 10).
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

export interface CoordonneesGeo {
  latitude: number;
  longitude: number;
}

export interface Lieu {
  nom: string;
  region?: string;
  coordonnees: CoordonneesGeo;
  /** Identifiant de lieu Foreca, pour les lieux enregistrés (§4.1). */
  idForeca?: string;
}

export interface ConditionCourante {
  horodatage: string;
  temperatureC: number;
  ressentiC: number;
  signe: IdSigneMeteo;
  /** Code brut Foreca (ex. `d421`), conservé pour audit et pour recalculer le palier. */
  symboleBrut: string;
  palier: Palier;
  /** Phrase d'accroche (§5.6) : une affirmation, jamais une exhortation. */
  phrase: string;
  ventKmh: number;
  humiditePourcent: number;
  pressionHpa: number;
  indiceUv: number;
  /** Point de rosée (§11, post-livraison — écran Détail d'un jour, jour courant seulement). */
  pointDeRoseeC: number;
  /** Visibilité en mètres (§11, idem). */
  visibiliteM: number;
}

export interface PointHoraire {
  horodatage: string;
  temperatureC: number;
  ressentiC: number;
  signe: IdSigneMeteo;
  symboleBrut: string;
  indiceUv: number;
  ventKmh: number;
  pluieMm: number;
  /** Qualité de l'air (indice EAQI), absente tant que l'endpoint `/air` n'est pas câblé (phase 7). */
  qualiteAirEaqi?: number;
  /** Un jalon lever/coucher inséré à son heure exacte (phase 5) — jamais fourni par Foreca. */
  jalon?: 'lever' | 'coucher';
  /** Libellé du jour (« dim. ») posé sur le premier point d'une nouvelle date (phase 5, frise horaire). */
  sep?: string;
}

export interface JourPrevision {
  date: string;
  signe: IdSigneMeteo;
  symboleBrut: string;
  temperatureMinC: number;
  temperatureMaxC: number;
  pluieAccumuleeMm: number;
  ventMaxKmh: number;
}

/** Niveau de vigilance officielle (§4.1, endpoint `warning`), priorité croissante. */
export type NiveauVigilance = 'aucune' | 'jaune' | 'orange' | 'rouge';

export interface Avertissement {
  niveau: NiveauVigilance;
  /** Code générique du type d'alerte (vent, orage, inondation…), non traduit (phase 7). */
  type: string;
  depuis: string;
  jusqua: string;
  description?: string;
}

/** Sous-indices par polluant (§11, post-livraison), tous sur le barème EPA 0-500 comme `aqi`. */
export interface SousIndicesPollution {
  o3: number;
  no2: number;
  so2: number;
  co: number;
  pm10: number;
  pm25: number;
}

/**
 * Qualité de l'air détaillée par heure (§11, post-livraison — vue détaillée,
 * `src/app/QualiteAir.tsx`) : au-delà du seul `qualiteAirEaqi` déjà porté
 * par `PointHoraire` pour colorer la frise, le polluant dominant et le
 * détail par polluant.
 */
export interface PointQualiteAir {
  horodatage: string;
  aqi: number;
  eaqi: number;
  polluantDominant: string;
  sousIndices: SousIndicesPollution;
}

export interface PrevisionLieu {
  lieu: Lieu;
  courant: ConditionCourante;
  horaire: PointHoraire[];
  quotidien: JourPrevision[];
  leverSoleil: string;
  coucherSoleil: string;
  /** Avertissements officiels actifs (§4.1) — [] tant qu'aucune vigilance n'est déclarée. */
  avertissements: Avertissement[];
  /** Absent si `/api/air` a échoué (§7, Promise.allSettled) — jamais une valeur inventée. */
  qualiteAirDetail?: PointQualiteAir[];
}
