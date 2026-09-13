import { useSyncExternalStore } from 'react';

function abonner(rappel: () => void): () => void {
  window.addEventListener('online', rappel);
  window.addEventListener('offline', rappel);
  return () => {
    window.removeEventListener('online', rappel);
    window.removeEventListener('offline', rappel);
  };
}

/**
 * État de connexion du navigateur (§8bis, bandeau « hors ligne »).
 * `navigator.onLine` + les événements `online`/`offline` : un signal du
 * navigateur lui-même, pas une inférence depuis l'état d'une requête
 * (une requête en cache peut réussir hors ligne sans que ça signifie
 * qu'on est en ligne).
 */
export function useEnLigne(): boolean {
  return useSyncExternalStore(
    abonner,
    () => navigator.onLine,
    () => true,
  );
}
