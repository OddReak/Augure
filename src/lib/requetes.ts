import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { get, set, del } from 'idb-keyval';

/**
 * État serveur : TanStack Query, persisté dans IndexedDB via `idb-keyval`
 * (§3). Permet à l'écran d'accueil de se peindre depuis le cache avant
 * même la première réponse réseau (§7, « pas de spinner au démarrage »).
 */
export const clientRequetes = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // aligné sur le seuil de rafraîchissement au retour au premier plan (§7)
      gcTime: 24 * 3600 * 1000,
      retry: 1,
    },
  },
});

export const persisteurIndexedDb = createAsyncStoragePersister({
  key: 'augure-requetes',
  storage: {
    getItem: (cle: string) => get(cle),
    setItem: (cle: string, valeur: string) => set(cle, valeur),
    removeItem: (cle: string) => del(cle),
  },
});
