import { versHeureLocale } from '../domain/fuseau';

/**
 * « Le ciel est une marche » (§5.1, règle 3) : le fond du héros est une
 * bande claire posée sur une bande sombre, dont la hauteur suit la course
 * du soleil — haute à midi, basse au crépuscule.
 *
 * Approximation simple par sinus entre lever et coucher (le lever/coucher
 * eux-mêmes viennent du calcul Meeus précis depuis la phase 6,
 * `domain/soleil.ts` ; ce module ne calcule que la position dans la
 * journée à partir de ces deux heures, pas l'astronomie elle-même).
 * `viewBox` du paysage : 390×190 (§6).
 */

const HAUTEUR_MIDI = 30; // marche haute : la bande claire couvre presque tout le ciel
const HAUTEUR_CREPUSCULE = 90; // marche basse : la bande sombre domine
const HAUTEUR_NUIT = 100; // au-delà du lever/coucher : nuit, marche basse par défaut

function versMinutes(heureIso: string): number {
  const [h, m] = heureIso.split(':').map(Number);
  return h * 60 + m;
}

/**
 * 0 au lever, 0,5 à midi, 1 au coucher ; `null` de nuit (hors de cet intervalle).
 *
 * `decalageIso` (ex. `+02:00`) est le fuseau du lieu, **pas** celui du
 * terminal qui exécute le code : lire l'heure de `horodatage` via
 * `Date#getHours()` la donnerait dans le fuseau du serveur (souvent UTC en
 * production), ce qui décale silencieusement toute la marche de ciel dès
 * que le lieu affiché n'est pas dans ce fuseau — même piège que celui
 * verrouillé dans `domain/frise.ts` pour la frise horaire.
 */
export function courseSolaire(
  horodatage: Date,
  leverHhMm: string,
  coucherHhMm: string,
  decalageIso = '',
): number | null {
  const minuteActuelle = versMinutes(versHeureLocale(horodatage, decalageIso));
  const lever = versMinutes(leverHhMm);
  const coucher = versMinutes(coucherHhMm);
  if (minuteActuelle < lever || minuteActuelle > coucher) return null;
  return (minuteActuelle - lever) / Math.max(coucher - lever, 1);
}

/** Hauteur (en unités du viewBox, depuis le haut) où commence la marche d'ombre du ciel. */
export function hauteurMarcheCiel(course: number | null): number {
  if (course === null) return HAUTEUR_NUIT;
  const eleve = Math.sin(Math.PI * Math.min(Math.max(course, 0), 1));
  return HAUTEUR_CREPUSCULE - (HAUTEUR_CREPUSCULE - HAUTEUR_MIDI) * eleve;
}
