import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { RouterProvider } from 'react-router-dom';
import { clientRequetes, persisteurIndexedDb } from './lib/requetes';
import { routeur } from './app/router';

export function App() {
  return (
    <PersistQueryClientProvider
      client={clientRequetes}
      persistOptions={{ persister: persisteurIndexedDb }}
    >
      <RouterProvider router={routeur} />
    </PersistQueryClientProvider>
  );
}
