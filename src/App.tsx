import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { RouterProvider } from 'react-router-dom';
import { clientRequetes, persisteurIndexedDb } from './lib/requetes';
import { routeur } from './app/router';
import { EcranLancement } from './app/EcranLancement';

export function App() {
  return (
    <PersistQueryClientProvider
      client={clientRequetes}
      persistOptions={{ persister: persisteurIndexedDb }}
    >
      <RouterProvider router={routeur} />
      {/* Hors du routeur, après lui : plein écran par-dessus l'accueil qui se
          peint déjà dessous (§7, post-livraison — EcranLancement.tsx). */}
      <EcranLancement />
    </PersistQueryClientProvider>
  );
}
