/**
 * « Le ciel est une marche » (§5.1, règle 3) : le fond du héros est une
 * bande claire posée sur une bande sombre, dont la hauteur suit la course
 * du soleil — haute à midi, basse au crépuscule.
 *
 * Approximation simple par sinus entre lever et coucher (le calcul solaire
 * précis, Meeus, arrive en phase 6 pour l'arc et les phases de lune ; ce
 * module ne calcule que la position dans la journée, pas l'astronomie).
 * `viewBox` du paysage : 390×190 (§6).
 */

const HAUTEUR_MIDI = 30; // marche haute : la bande claire couvre presque tout le ciel
const HAUTEUR_CREPUSCULE = 90; // marche basse : la bande sombre domine
const HAUTEUR_NUIT = 100; // au-delà du lever/coucher : nuit, marche basse par défaut

function versMinutes(heureIso: string): number {
  const [h, m] = heureIso.split(':').map(Number);
  return h * 60 + m;
}

/** 0 au lever, 0,5 à midi, 1 au coucher ; `null` de nuit (hors de cet intervalle). */
export function courseSolaire(horodatage: Date, leverHhMm: string, coucherHhMm: string): number | null {
  const minuteActuelle = horodatage.getHours() * 60 + horodatage.getMinutes();
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
