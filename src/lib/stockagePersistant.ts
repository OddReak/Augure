/**
 * `navigator.storage.persist()` au premier lancement (§7) : Safari purge le
 * stockage d'un site non installé après sept jours d'inactivité, et sans
 * compte une purge de `localStorage`/IndexedDB est une perte définitive
 * (lieux enregistrés, cache météo). Idempotent côté navigateur — un appareil
 * déjà `persisted()` ne redemande rien — mais gardé une seule fois par
 * session ici pour ne pas relancer l'appel à chaque montage.
 */
export async function demanderStockagePersistant(): Promise<boolean> {
  if (!navigator.storage?.persist) return false;

  const dejaPersistant = (await navigator.storage.persisted?.()) ?? false;
  if (dejaPersistant) return true;

  return navigator.storage.persist();
}
