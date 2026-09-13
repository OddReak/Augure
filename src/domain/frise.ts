import type { PointHoraire } from './types';

/**
 * Frise horaire (§5, phase 5, `horaires()` du mockup) : deux enrichissements
 * appliqués à la série reçue de Foreca, ni l'un ni l'autre fournis par le
 * fournisseur — ce sont des insertions applicatives.
 *
 *  - un jalon lever/coucher, inséré à son heure exacte entre les deux
 *    points horaires qui l'encadrent ;
 *  - un repère de jour (« dim. »), posé sur le premier point d'une
 *    nouvelle date, jamais inséré comme point à part (le mockup le porte
 *    directement sur le point horaire existant : `{h:'00', …, sep:'dim.'}`).
 */

const MOTIF_DECALAGE = /([+-]\d{2}:\d{2}|Z)$/;

function decalageDe(horodatage: string): string {
  return MOTIF_DECALAGE.exec(horodatage)?.[1] ?? '';
}

function dateDe(horodatage: string): string {
  return horodatage.slice(0, 10);
}

/**
 * Construit l'horodatage ISO du jalon pour une date donnée, en reprenant le
 * décalage horaire (fuseau) d'un point voisin — Foreca ne renvoie pas de
 * lever/coucher par jour tant que le calcul Meeus n'est pas câblé (phase 6) :
 * une seule heure HH:MM sert pour chaque date rencontrée dans la série.
 */
function horodatageJalon(date: string, heureHhMm: string, decalage: string): string {
  return `${date}T${heureHhMm}:00${decalage}`;
}

function interpole(avant: number, apres: number, fraction: number): number {
  return avant + (apres - avant) * fraction;
}

/**
 * Insère un jalon (lever ou coucher) dans la série, à son heure exacte,
 * une fois par date présente dans les points — sans jamais retirer un point
 * horaire existant. N'insère rien pour une date où l'heure du jalon tombe
 * hors de la plage couverte par les points de ce jour-là.
 */
function inserisJalon(
  points: readonly PointHoraire[],
  heureHhMm: string,
  type: 'lever' | 'coucher',
): PointHoraire[] {
  const resultat = [...points];
  const dates = new Set(points.map((p) => dateDe(p.horodatage)));

  for (const date of dates) {
    const decalage = decalageDe(points.find((p) => dateDe(p.horodatage) === date)?.horodatage ?? '');
    const cible = horodatageJalon(date, heureHhMm, decalage);

    const indexApres = resultat.findIndex((p) => p.horodatage > cible);
    if (indexApres <= 0) continue; // avant le premier point ou après le dernier : hors plage, rien à insérer
    const avant = resultat[indexApres - 1];
    const apres = resultat[indexApres];
    if (cible <= avant.horodatage) continue;

    const duree = Date.parse(apres.horodatage) - Date.parse(avant.horodatage);
    const fraction = duree > 0 ? (Date.parse(cible) - Date.parse(avant.horodatage)) / duree : 0;

    // `exactOptionalPropertyTypes` (tsconfig.app.json) refuse `qualiteAirEaqi: undefined` :
    // la propriété n'est ajoutée que lorsqu'elle est effectivement calculable.
    const qualiteAirEaqi =
      avant.qualiteAirEaqi !== undefined && apres.qualiteAirEaqi !== undefined
        ? Math.round(interpole(avant.qualiteAirEaqi, apres.qualiteAirEaqi, fraction))
        : undefined;

    const jalon: PointHoraire = {
      horodatage: cible,
      temperatureC: Math.round(interpole(avant.temperatureC, apres.temperatureC, fraction)),
      ressentiC: Math.round(interpole(avant.ressentiC, apres.ressentiC, fraction)),
      signe: type,
      symboleBrut: avant.symboleBrut,
      indiceUv: Math.round(interpole(avant.indiceUv, apres.indiceUv, fraction)),
      ventKmh: Math.round(interpole(avant.ventKmh, apres.ventKmh, fraction)),
      pluieMm: Number(interpole(avant.pluieMm, apres.pluieMm, fraction).toFixed(1)),
      jalon: type,
      ...(qualiteAirEaqi !== undefined ? { qualiteAirEaqi } : {}),
    };
    resultat.splice(indexApres, 0, jalon);
  }

  return resultat;
}

/** Insère les jalons lever puis coucher (l'ordre n'affecte pas le résultat, les deux sont indépendants). */
export function avecJalons(
  points: readonly PointHoraire[],
  leverHhMm: string,
  coucherHhMm: string,
): PointHoraire[] {
  return inserisJalon(inserisJalon(points, leverHhMm, 'lever'), coucherHhMm, 'coucher');
}

// `timeZone: 'UTC'` couplé à un ancrage à midi UTC (voir plus bas) : le jour
// de semaine doit suivre le calendrier local du point (déjà encodé dans les
// dix premiers caractères de son horodatage), jamais le fuseau du serveur
// qui exécute ce code — sans quoi minuit dans un fuseau positif se relit
// comme la veille sur un serveur en UTC.
const FORMATTEUR_JOUR = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', timeZone: 'UTC' });

function libelleJour(date: string): string {
  return FORMATTEUR_JOUR.format(new Date(`${date}T12:00:00Z`));
}

/** Pose un repère de jour (« dim. ») sur le premier point de chaque nouvelle date, jamais sur le premier. */
export function avecSeparateursJour(points: readonly PointHoraire[]): PointHoraire[] {
  let dateCourante: string | null = null;
  return points.map((p, i) => {
    const date = dateDe(p.horodatage);
    const nouveauJour = i > 0 && date !== dateCourante;
    dateCourante = date;
    if (!nouveauJour) return p;
    return { ...p, sep: libelleJour(date) };
  });
}

/** Compose les deux enrichissements dans l'ordre attendu par le rendu : jalons, puis repères de jour. */
export function construireFrise(
  points: readonly PointHoraire[],
  leverHhMm: string,
  coucherHhMm: string,
): PointHoraire[] {
  return avecSeparateursJour(avecJalons(points, leverHhMm, coucherHhMm));
}
