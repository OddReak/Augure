/**
 * Fuseau horaire (partagé par `frise.ts` et `soleil.ts`) : Foreca renvoie
 * chaque horodatage avec son propre décalage ISO (`+02:00` pour Cestas), pas
 * de nom de zone IANA. Astronomie et frise doivent afficher l'heure locale
 * du lieu, jamais celle du terminal qui exécute le code — `Date#getHours()`
 * relit dans le fuseau du terminal, pas dans le décalage encodé.
 */

const MOTIF_DECALAGE = /([+-]\d{2}:\d{2}|Z)$/;

/** Le décalage ISO (`+02:00`, `Z`…) porté par un horodatage, ou `''` s'il n'y en a pas. */
export function decalageDe(horodatage: string): string {
  return MOTIF_DECALAGE.exec(horodatage)?.[1] ?? '';
}

/** Les dix premiers caractères d'un horodatage ISO : sa date calendaire, telle quelle. */
export function dateDe(horodatage: string): string {
  return horodatage.slice(0, 10);
}

function minutesDuDecalage(decalageIso: string): number {
  if (!decalageIso || decalageIso === 'Z') return 0;
  const signe = decalageIso[0] === '-' ? -1 : 1;
  const [h, m] = decalageIso.slice(1).split(':').map(Number);
  return signe * (h * 60 + m);
}

/** Formate un instant UTC en `HH:MM` dans le fuseau porté par `decalageIso` (ex. `+02:00`). */
export function versHeureLocale(instantUtc: Date, decalageIso: string): string {
  const total = instantUtc.getTime() + minutesDuDecalage(decalageIso) * 60_000;
  const local = new Date(total);
  const hh = String(local.getUTCHours()).padStart(2, '0');
  const mm = String(local.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

/**
 * Formate un instant UTC en horodatage ISO complet (`AAAA-MM-JJTHH:MM:SS±HH:MM`),
 * affichant l'heure locale du fuseau `decalageIso` mais représentant le même
 * instant absolu — pour construire un point de série qui reste comparable
 * (via `Date.parse`) aux horodatages voisins.
 */
export function versIsoAvecDecalage(instantUtc: Date, decalageIso: string): string {
  const total = instantUtc.getTime() + minutesDuDecalage(decalageIso) * 60_000;
  const local = new Date(total);
  return `${local.toISOString().slice(0, 19)}${decalageIso || 'Z'}`;
}

// `timeZone: 'UTC'` couplé à un ancrage à midi UTC (voir `libelleJourCourt`) :
// le jour de semaine doit suivre le calendrier local de la date (déjà
// encodée dans ses dix premiers caractères), jamais le fuseau du serveur qui
// exécute ce code — sans quoi minuit dans un fuseau positif se relit comme
// la veille sur un serveur en UTC.
const FORMATTEUR_JOUR = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', timeZone: 'UTC' });

/** Jour de semaine court (« dim. ») d'une date calendaire `AAAA-MM-JJ`, indépendant du fuseau d'exécution. */
export function libelleJourCourt(date: string): string {
  return FORMATTEUR_JOUR.format(new Date(`${date}T12:00:00Z`));
}

const FORMATTEUR_JOUR_LONG = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', timeZone: 'UTC' });
const FORMATTEUR_DATE_LONGUE = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', timeZone: 'UTC' });

/** Jour de semaine en toutes lettres (« dimanche »), casse de phrase (§5.6). */
export function libelleJourLong(date: string): string {
  const texte = FORMATTEUR_JOUR_LONG.format(new Date(`${date}T12:00:00Z`));
  return texte.charAt(0).toUpperCase() + texte.slice(1);
}

/** Date en toutes lettres (« 13 septembre »), pour le sous-titre du chapeau (§6, Détail d'un jour). */
export function libelleDateLongue(date: string): string {
  return FORMATTEUR_DATE_LONGUE.format(new Date(`${date}T12:00:00Z`));
}
