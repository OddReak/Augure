/**
 * Quantification (§5.1 règle 5, §5.2) : « la température se lit en cinq
 * bandes franches, jamais en fondu continu ». Chaque métrique de la frise
 * horaire garde le découpage officiel de son indice — pas un découpage
 * maison — et les valeurs hexadécimales sont recopiées telles quelles
 * depuis `ECH_UV`/`ECH_AIR`/`ECH_PLUIE`/`ECH_VENT` de `design/mockup.html`.
 */

export type BandeTemperature = 't1' | 't2' | 't3' | 't4' | 't5';

/** Découpage de l'échelle de température (§5.2) — exclu de la bascule de palier. */
export function bandeTemperature(temperatureC: number): BandeTemperature {
  if (temperatureC <= 5) return 't1';
  if (temperatureC <= 13) return 't2';
  if (temperatureC <= 21) return 't3';
  if (temperatureC <= 29) return 't4';
  return 't5';
}

/** Un palier d'une échelle par colonnes : seuil haut inclusif, couleur, libellé. */
export interface NiveauEchelle {
  seuil: number;
  couleur: string;
  libelle: string;
}

function echelle(valeurs: ReadonlyArray<[number, string, string]>): readonly NiveauEchelle[] {
  return valeurs.map(([seuil, couleur, libelle]) => ({ seuil, couleur, libelle }));
}

// Barème OMS (§5.2).
export const ECH_UV = echelle([
  [2, '#5C9E6E', 'faible'],
  [5, '#E0B93B', 'modéré'],
  [7, '#E08A2E', 'fort'],
  [10, '#D2452F', 'très fort'],
  [99, '#8E3A9E', 'extrême'],
]);

// Barème officiel EPA (§5.2 : « le découpage officiel de son indice ») — Foreca fournit l'AQI
// américain, pas l'EAQI européen que le document maître nomme (écart réel de méthodologie,
// DECISIONS.md) ; six bandes sur les seuils EPA eux-mêmes (0-50 Good … 301-500 Hazardous), la
// seule métrique à ne pas en compter cinq. Reprend `niveau()` directement sur l'AQI brut, plus
// parlant qu'une bande 1-6 sans contexte (§11, post-livraison — signalé par l'utilisateur).
export const ECH_AIR = echelle([
  [50, '#4E9E8F', 'bon'],
  [100, '#8FBF5C', 'moyen'],
  [150, '#E8C84A', 'dégradé'],
  [200, '#E08A4A', 'mauvais'],
  [300, '#D2452F', 'très mauvais'],
  [500, '#8E3A5E', 'extrême'],
]);

export const ECH_PLUIE = echelle([
  [0.2, '#BFD4E0', 'bruine'],
  [1, '#8FB4CC', 'faible'],
  [4, '#5B8FB8', 'modérée'],
  [8, '#3B5F96', 'forte'],
  [99, '#2B2A64', 'très forte'],
]);

export const ECH_VENT = echelle([
  [15, '#8FC0A6', 'calme'],
  [30, '#D9A93B', 'modéré'],
  [50, '#E08A2E', 'soutenu'],
  [80, '#D2452F', 'fort'],
  [199, '#8E3A9E', 'tempête'],
]);

/** Le niveau (seuil, couleur, libellé) qui contient `v` — le premier dont le seuil l'égale ou le dépasse. */
export function niveau(v: number, ech: readonly NiveauEchelle[]): NiveauEchelle {
  return ech.find((n) => v <= n.seuil) ?? ech[ech.length - 1];
}

/**
 * Plafond de l'axe des colonnes (§5.2) : ni le maximum de la série — ce qui
 * ferait bouger l'échelle à chaque rafraîchissement —, ni le maximum
 * théorique de l'indice — ce qui écraserait les colonnes —, mais la borne
 * haute de la bande qui contient le maximum de la série.
 */
export function plafondAxeColonnes(valeurs: readonly number[], ech: readonly NiveauEchelle[]): number {
  const pic = valeurs.length ? Math.max(...valeurs) : 0;
  return Math.max(niveau(pic, ech).seuil, pic, ech[0].seuil);
}

export type IdMetrique = 'temp' | 'ress' | 'pluie' | 'vent' | 'uv' | 'air';

interface MetriqueLigne {
  id: 'temp' | 'ress';
  type: 'ligne';
  libelle: string;
  glyphe: string;
  unite: string;
}

interface MetriqueColonne {
  id: 'pluie' | 'vent' | 'uv' | 'air';
  type: 'colonne';
  libelle: string;
  glyphe: string;
  unite: string;
  echelle: readonly NiveauEchelle[];
  decimales?: number;
}

export type Metrique = MetriqueLigne | MetriqueColonne;

/**
 * Les six métriques de la frise horaire (§5.2), toutes remontées par Foreca.
 * Deux formes de tracé seulement : polyligne pour température/ressenti,
 * colonnes pour les quatre indices — jamais une troisième forme.
 */
export const METRIQUES: Record<IdMetrique, Metrique> = {
  temp: { id: 'temp', type: 'ligne', libelle: 'Température', glyphe: 'thermo', unite: '°C' },
  ress: { id: 'ress', type: 'ligne', libelle: 'Ressenti', glyphe: 'ressenti', unite: '°C' },
  pluie: {
    id: 'pluie',
    type: 'colonne',
    libelle: 'Pluie',
    glyphe: 'pluie',
    unite: 'mm/h',
    echelle: ECH_PLUIE,
    decimales: 1,
  },
  vent: { id: 'vent', type: 'colonne', libelle: 'Vent', glyphe: 'vent', unite: 'km/h', echelle: ECH_VENT },
  uv: { id: 'uv', type: 'colonne', libelle: 'Indice UV', glyphe: 'uv', unite: 'indice OMS', echelle: ECH_UV },
  air: {
    id: 'air',
    type: 'colonne',
    libelle: 'Qualité air',
    glyphe: 'air',
    unite: 'indice AQI',
    echelle: ECH_AIR,
  },
};

export const IDS_METRIQUES = Object.keys(METRIQUES) as IdMetrique[];
