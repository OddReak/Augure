import { dateDe, decalageDe, libelleJourCourt, versIsoAvecDecalage } from './fuseau';
import { leverCoucherUtc } from './soleil';
import type { CoordonneesGeo, PointHoraire } from './types';

/**
 * Frise horaire (§5/§6, `horaires()` du mockup) : deux enrichissements
 * appliqués à la série reçue de Foreca, ni l'un ni l'autre fournis par le
 * fournisseur — ce sont des insertions applicatives.
 *
 *  - un jalon lever/coucher, inséré à son heure exacte entre les deux
 *    points horaires qui l'encadrent, une fois par date rencontrée dans la
 *    série (lever/coucher réels, calcul Meeus — `domain/soleil.ts`,
 *    phase 6) ;
 *  - un repère de jour (« dim. »), posé sur le premier point d'une
 *    nouvelle date, jamais inséré comme point à part (le mockup le porte
 *    directement sur le point horaire existant : `{h:'00', …, sep:'dim.'}`).
 */

function interpole(avant: number, apres: number, fraction: number): number {
  return avant + (apres - avant) * fraction;
}

/**
 * Insère un jalon (lever ou coucher) dans la série, à son heure exacte,
 * une fois par date présente dans les points — sans jamais retirer un point
 * horaire existant. N'insère rien pour une date où l'heure du jalon tombe
 * hors de la plage couverte par les points de ce jour-là, ou en jour/nuit
 * polaire (`leverCoucherUtc` renvoie alors `null` pour cette date).
 */
function inserisJalon(
  points: readonly PointHoraire[],
  coordonnees: CoordonneesGeo,
  type: 'lever' | 'coucher',
): PointHoraire[] {
  const resultat = [...points];
  const dates = new Set(points.map((p) => dateDe(p.horodatage)));

  for (const date of dates) {
    const decalage = decalageDe(points.find((p) => dateDe(p.horodatage) === date)?.horodatage ?? '');
    const instants = leverCoucherUtc(new Date(`${date}T12:00:00Z`), coordonnees);
    if (!instants) continue; // jour ou nuit polaire ce jour-là : rien à insérer

    const instantUtc = type === 'lever' ? instants.leverUtc : instants.coucherUtc;
    const cible = versIsoAvecDecalage(instantUtc, decalage);

    const indexApres = resultat.findIndex((p) => Date.parse(p.horodatage) > Date.parse(cible));
    if (indexApres <= 0) continue; // avant le premier point ou après le dernier : hors plage, rien à insérer
    const avant = resultat[indexApres - 1];
    const apres = resultat[indexApres];
    if (Date.parse(cible) <= Date.parse(avant.horodatage)) continue;

    const duree = Date.parse(apres.horodatage) - Date.parse(avant.horodatage);
    const fraction = duree > 0 ? (Date.parse(cible) - Date.parse(avant.horodatage)) / duree : 0;

    // `exactOptionalPropertyTypes` (tsconfig.app.json) refuse `qualiteAirIndice: undefined` :
    // la propriété n'est ajoutée que lorsqu'elle est effectivement calculable.
    const qualiteAirIndice =
      avant.qualiteAirIndice !== undefined && apres.qualiteAirIndice !== undefined
        ? Math.round(interpole(avant.qualiteAirIndice, apres.qualiteAirIndice, fraction))
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
      ...(qualiteAirIndice !== undefined ? { qualiteAirIndice } : {}),
    };
    resultat.splice(indexApres, 0, jalon);
  }

  return resultat;
}

/** Insère les jalons lever puis coucher (l'ordre n'affecte pas le résultat, les deux sont indépendants). */
export function avecJalons(points: readonly PointHoraire[], coordonnees: CoordonneesGeo): PointHoraire[] {
  return inserisJalon(inserisJalon(points, coordonnees, 'lever'), coordonnees, 'coucher');
}

/** Pose un repère de jour (« dim. ») sur le premier point de chaque nouvelle date, jamais sur le premier. */
export function avecSeparateursJour(points: readonly PointHoraire[]): PointHoraire[] {
  let dateCourante: string | null = null;
  return points.map((p, i) => {
    const date = dateDe(p.horodatage);
    const nouveauJour = i > 0 && date !== dateCourante;
    dateCourante = date;
    if (!nouveauJour) return p;
    return { ...p, sep: libelleJourCourt(date) };
  });
}

/** Compose les deux enrichissements dans l'ordre attendu par le rendu : jalons, puis repères de jour. */
export function construireFrise(points: readonly PointHoraire[], coordonnees: CoordonneesGeo): PointHoraire[] {
  return avecSeparateursJour(avecJalons(points, coordonnees));
}
