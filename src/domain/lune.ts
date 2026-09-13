/**
 * Lune (§6, phase 6) : fraction illuminée du disque, nom de la phase en
 * cours, et date des quatre prochaines phases primaires — nouvelle lune,
 * premier quartier, pleine lune, dernier quartier.
 *
 * Deux algorithmes de précision différente, chacun choisi pour ce qu'il
 * doit produire :
 *
 *  - la fraction illuminée (`fractionIlluminee`) suit l'âge de la lune
 *    depuis une nouvelle lune de référence connue, rapporté à une
 *    sinusoïde — une approximation classique, à quelques % près, largement
 *    suffisante pour la valeur continue affichée à l'écran (§6, `luneFrac`) ;
 *  - la date des prochaines phases (`prochainesPhases`) utilise l'algorithme
 *    complet de Meeus (*Astronomical Algorithms*, chapitre 49 : JDE moyen
 *    + termes périodiques de correction en M, M′, F, Ω), nécessaire ici
 *    parce qu'une date affichée qui tombe du mauvais côté de minuit est un
 *    bug visible, pas une imprécision tolérable.
 *
 * Les deux ont été validés numériquement (voir `tests/unit/lune.test.ts`)
 * contre les quatre phases primaires réelles de septembre-octobre 2026
 * (source : recherche web, timeanddate.com/theskylive.com — voir
 * DECISIONS.md) : nouvelle lune 11 sept. 03:27 UTC, premier quartier
 * 18 sept. 20:46 UTC, pleine lune 26 sept. 16:51 UTC, dernier quartier
 * 3 oct. 13:27 UTC, nouvelle lune 10 oct. 15:52 UTC — la formule complète de
 * Meeus retombe sur ces cinq instants à moins de deux minutes près.
 */

const RAD = Math.PI / 180;
const MOIS_SYNODIQUE = 29.530588861; // jours
// Nouvelle lune de référence bien connue : 2000-01-06 ~18:14 UTC (JD 2451550.1),
// la même que l'épisode k=0 de Meeus ch. 49.
const JD_NOUVELLE_LUNE_REF = 2451550.1;

function versJulien(date: Date): number {
  return date.valueOf() / 86_400_000 + 2_440_587.5;
}

function depuisJulien(j: number): Date {
  return new Date((j - 2_440_587.5) * 86_400_000);
}

/** Âge de la lune en jours depuis la dernière nouvelle lune, dans [0, MOIS_SYNODIQUE[. */
function age(date: Date): number {
  const brut = (versJulien(date) - JD_NOUVELLE_LUNE_REF) % MOIS_SYNODIQUE;
  return brut < 0 ? brut + MOIS_SYNODIQUE : brut;
}

/** 0 à la nouvelle lune, 1 à la pleine lune — jamais négatif, jamais au-delà de 1. */
export function fractionIlluminee(date: Date): number {
  return (1 - Math.cos((2 * Math.PI * age(date)) / MOIS_SYNODIQUE)) / 2;
}

const NOMS_PHASES = [
  'Nouvelle lune',
  'Premier croissant',
  'Premier quartier',
  'Gibbeuse croissante',
  'Pleine lune',
  'Gibbeuse décroissante',
  'Dernier quartier',
  'Dernier croissant',
] as const;

export type NomPhaseLune = (typeof NOMS_PHASES)[number];

/** Un des huit noms de phase (§6), par tranche de 1/8 de mois synodique centrée sur les quatre phases primaires. */
export function nomPhase(date: Date): NomPhaseLune {
  const r = age(date) / MOIS_SYNODIQUE;
  const indice = Math.floor(((r + 1 / 16) % 1) * 8);
  return NOMS_PHASES[indice];
}

type PhasePrimaire = 0 | 0.25 | 0.5 | 0.75;

const NOMS_PHASES_PRIMAIRES: Record<PhasePrimaire, string> = {
  0: 'Nouvelle lune',
  0.25: 'Premier quartier',
  0.5: 'Pleine lune',
  0.75: 'Dernier quartier',
};

function anneeDecimale(date: Date): number {
  const annee = date.getUTCFullYear();
  const debut = Date.UTC(annee, 0, 1);
  const fin = Date.UTC(annee + 1, 0, 1);
  return annee + (date.valueOf() - debut) / (fin - debut);
}

/** k approché (Meeus 49.1) : k entier ≈ une nouvelle lune, autour de la date donnée. */
function kApproche(date: Date): number {
  return (anneeDecimale(date) - 2000) * 12.3685;
}

function s(deg: number): number {
  return Math.sin(deg * RAD);
}
function c(deg: number): number {
  return Math.cos(deg * RAD);
}

/** JDE de la phase primaire `phase` du cycle `kEntier` (Meeus ch. 49, JDE moyen + corrections périodiques). */
function jdePhasePrimaire(kEntier: number, phase: PhasePrimaire): number {
  const k = kEntier + phase;
  const T = k / 1236.85;

  let jde =
    2_451_550.09766 +
    29.530588861 * k +
    0.00015437 * T ** 2 -
    0.00000015 * T ** 3 +
    0.00000000073 * T ** 4;

  // Éléments moyens (degrés) — Meeus 49.1, mêmes formules quelle que soit la phase visée.
  const E = 1 - 0.002516 * T - 0.0000074 * T ** 2;
  const M = 2.5534 + 29.1053567 * k - 0.0000218 * T ** 2 - 0.00000011 * T ** 3; // anomalie moyenne du Soleil
  const Mp = 201.5643 + 385.81693528 * k + 0.0107582 * T ** 2 + 0.00001238 * T ** 3 - 0.000000058 * T ** 4; // de la Lune
  const F = 160.7108 + 390.67050284 * k - 0.0016118 * T ** 2 - 0.00000227 * T ** 3 + 0.000000011 * T ** 4; // argument de latitude
  const Om = 124.7746 - 1.56375588 * k + 0.0020672 * T ** 2 + 0.00000215 * T ** 3; // nœud ascendant

  if (phase === 0 || phase === 0.5) {
    // Nouvelle/pleine lune : mêmes termes, seul le terme dominant diffère (signe ET amplitude, Meeus 49.2).
    jde +=
      (phase === 0 ? -0.4072 : -0.40614) * s(Mp) +
      0.17241 * E * s(M) +
      0.01608 * s(2 * Mp) +
      0.01039 * s(2 * F) +
      0.00739 * E * s(Mp - M) -
      0.00514 * E * s(Mp + M) +
      0.00208 * E ** 2 * s(2 * M) -
      0.00111 * s(Mp - 2 * F) -
      0.00057 * s(Mp + 2 * F) +
      0.00056 * E * s(2 * Mp + M) -
      0.00042 * s(3 * Mp) +
      0.00042 * E * s(M + 2 * F) +
      0.00038 * E * s(M - 2 * F) -
      0.00024 * E * s(2 * Mp - M) -
      0.00017 * s(Om) -
      0.00007 * s(Mp + 2 * M) +
      0.00004 * s(2 * Mp - 2 * F) +
      0.00004 * s(3 * M) +
      0.00003 * s(Mp + M - 2 * F) +
      0.00003 * s(2 * Mp + 2 * F) -
      0.00003 * s(Mp + M + 2 * F) +
      0.00003 * s(Mp - M + 2 * F) -
      0.00002 * s(Mp - M - 2 * F) -
      0.00002 * s(3 * Mp + M) +
      0.00002 * s(4 * Mp);
  } else {
    jde +=
      -0.62801 * s(Mp) +
      0.17172 * E * s(M) -
      0.01183 * E * s(Mp + M) +
      0.00862 * s(2 * Mp) +
      0.00804 * s(2 * F) +
      0.00454 * E * s(Mp - M) +
      0.00204 * E ** 2 * s(2 * M) -
      0.0018 * s(Mp - 2 * F) -
      0.0007 * s(Mp + 2 * F) -
      0.0004 * s(3 * Mp) -
      0.00034 * E * s(2 * Mp - M) +
      0.00032 * E * s(M + 2 * F) +
      0.00032 * E * s(M - 2 * F) -
      0.00028 * E ** 2 * s(2 * M + Mp) +
      0.00027 * E * s(2 * Mp + M) -
      0.00017 * s(Om) -
      0.00005 * s(Mp - M - 2 * F) +
      0.00004 * s(2 * Mp + 2 * F) -
      0.00004 * s(Mp + M + 2 * F) +
      0.00004 * s(Mp - 2 * M) +
      0.00003 * s(Mp + M - 2 * F) +
      0.00003 * s(3 * M) +
      0.00002 * s(2 * Mp - 2 * F) +
      0.00002 * s(Mp - M + 2 * F) -
      0.00002 * s(3 * Mp + M);

    const W = 0.00306 - 0.00038 * E * c(M) + 0.00026 * c(Mp) - 0.00002 * c(Mp - M) + 0.00002 * c(Mp + M) + 0.00002 * c(2 * F);
    jde += phase === 0.25 ? W : -W;
  }

  return jde;
}

export interface ProchainePhase {
  nom: string;
  dateUtc: Date;
}

const PHASES_PRIMAIRES: readonly PhasePrimaire[] = [0, 0.25, 0.5, 0.75];

/** Les quatre prochaines phases primaires (nouvelle, premier quartier, pleine, dernier quartier), triées chronologiquement. */
export function prochainesPhases(date: Date): ProchainePhase[] {
  const kBase = Math.floor(kApproche(date));

  return PHASES_PRIMAIRES.map((phase) => {
    // Cherche, dans une fenêtre large autour de k, le plus proche instant qui suit `date`.
    let prochaine: Date | null = null;
    for (let k = kBase - 2; k <= kBase + 3; k++) {
      const candidate = depuisJulien(jdePhasePrimaire(k, phase));
      if (candidate.getTime() >= date.getTime() && (!prochaine || candidate < prochaine)) {
        prochaine = candidate;
      }
    }
    // `prochaine` est toujours défini : la fenêtre de six cycles (≈ 177 jours) couvre
    // largement le pire délai possible avant la prochaine occurrence d'une phase (≤ 1 mois synodique).
    return { nom: NOMS_PHASES_PRIMAIRES[phase], dateUtc: prochaine! };
  }).sort((a, b) => a.dateUtc.getTime() - b.dateUtc.getTime());
}
