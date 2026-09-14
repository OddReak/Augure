import type { CoordonneesGeo } from './types';

/**
 * Lever et coucher du soleil (§6, phase 6) : algorithme Meeus à précision
 * réduite (éléments moyens de l'orbite terrestre, sans VSOP87), le même que
 * celui popularisé par la bibliothèque SunCalc — précision de l'ordre de la
 * minute, largement suffisante pour un affichage météo.
 *
 * Validé numériquement (voir tests) contre trois relevés indépendants
 * (sunrise-sunset.org) pour Cestas (44,74 · −0,68) aux deux solstices et à
 * l'équinoxe de septembre 2026 : écart maximal observé inférieur à quatre
 * minutes.
 */

const RAD = Math.PI / 180;
const J2000 = 2451545;
const J0 = 0.0009;
const OBLIQUITE = RAD * 23.4397;

function versJulien(date: Date): number {
  return date.valueOf() / 86_400_000 - 0.5 + 2_440_588;
}

function depuisJulien(j: number): Date {
  return new Date((j + 0.5 - 2_440_588) * 86_400_000);
}

function versJours(date: Date): number {
  return versJulien(date) - J2000;
}

function anomalieMoyenneSolaire(joursDepuisJ2000: number): number {
  return RAD * (357.5291 + 0.98560028 * joursDepuisJ2000);
}

function longitudeEcliptique(anomalieMoyenne: number): number {
  const equationDuCentre =
    RAD *
    (1.9148 * Math.sin(anomalieMoyenne) +
      0.02 * Math.sin(2 * anomalieMoyenne) +
      0.0003 * Math.sin(3 * anomalieMoyenne));
  const perihelie = RAD * 102.9372;
  return anomalieMoyenne + equationDuCentre + perihelie + Math.PI;
}

function declinaison(longitudeEclip: number): number {
  return Math.asin(Math.sin(longitudeEclip) * Math.sin(OBLIQUITE));
}

function cycleJulien(joursDepuisJ2000: number, longitudeOuest: number): number {
  return Math.round(joursDepuisJ2000 - J0 - longitudeOuest / (2 * Math.PI));
}

function transitApproche(angleHoraire: number, longitudeOuest: number, cycle: number): number {
  return J0 + (angleHoraire + longitudeOuest) / (2 * Math.PI) + cycle;
}

function transitSolaireJulien(joursApproches: number, anomalieMoyenne: number, longitudeEclip: number): number {
  return J2000 + joursApproches + 0.0053 * Math.sin(anomalieMoyenne) - 0.0069 * Math.sin(2 * longitudeEclip);
}

function angleHoraire(altitude: number, latitude: number, decl: number): number {
  return Math.acos(
    (Math.sin(altitude) - Math.sin(latitude) * Math.sin(decl)) / (Math.cos(latitude) * Math.cos(decl)),
  );
}

// Altitude du centre du Soleil au lever/coucher apparent : −0,833° (réfraction
// atmosphérique standard + rayon apparent du disque), la même constante que
// pour toute éphéméride grand public.
const ALTITUDE_LEVER_COUCHER = -0.833 * RAD;

export interface LeverCoucher {
  leverUtc: Date;
  coucherUtc: Date;
}

/**
 * Lever et coucher UTC pour la date calendaire portée par `instant` (peu
 * importe l'heure du jour dans `instant`, seule sa date UTC compte) aux
 * coordonnées données. `null` en jour ou nuit polaire, où l'horizon n'est
 * jamais franchi ce jour-là — hors du périmètre géographique visé par
 * l'application (France, voir §1), gardé pour ne jamais renvoyer un NaN
 * silencieux plutôt que pour être exercé en pratique.
 */
export function leverCoucherUtc(instant: Date, coordonnees: CoordonneesGeo): LeverCoucher | null {
  const longitudeOuest = RAD * -coordonnees.longitude;
  const latitude = RAD * coordonnees.latitude;

  const jours = versJours(instant);
  const cycle = cycleJulien(jours, longitudeOuest);
  const joursApproches = transitApproche(0, longitudeOuest, cycle);

  const anomalieMoyenne = anomalieMoyenneSolaire(joursApproches);
  const longitudeEclip = longitudeEcliptique(anomalieMoyenne);
  const decl = declinaison(longitudeEclip);

  const transitMidi = transitSolaireJulien(joursApproches, anomalieMoyenne, longitudeEclip);

  const angleH = angleHoraire(ALTITUDE_LEVER_COUCHER, latitude, decl);
  if (!Number.isFinite(angleH)) return null; // jour ou nuit polaire

  const joursApprochesCoucher = transitApproche(angleH, longitudeOuest, cycle);
  const transitCoucher = transitSolaireJulien(joursApprochesCoucher, anomalieMoyenne, longitudeEclip);
  const transitLever = transitMidi - (transitCoucher - transitMidi);

  return { leverUtc: depuisJulien(transitLever), coucherUtc: depuisJulien(transitCoucher) };
}
