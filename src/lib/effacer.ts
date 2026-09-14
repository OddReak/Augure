import { del } from 'idb-keyval';

/**
 * Efface toutes les données locales de l'application (§6, Réglages →
 * Données → « Effacer les données locales ») : préférences UI et lieux
 * enregistrés (`localStorage`), dernière position connue (`localStorage`),
 * cache de prévisions (IndexedDB, `src/lib/requetes.ts`). Sans compte, ces
 * trois emplacements sont la totalité de ce que l'application retient.
 */
export async function effacerDonneesLocales(): Promise<void> {
  try {
    localStorage.removeItem('augure-ui');
  } catch {
    // Stockage indisponible : rien à effacer de ce côté.
  }
  try {
    localStorage.removeItem('augure:derniere-position');
  } catch {
    // idem.
  }
  try {
    await del('augure-requetes');
  } catch {
    // IndexedDB indisponible (navigation privée) : les deux localStorage restent effacés.
  }
}
