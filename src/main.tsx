import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './design/jetons.css';
import { App } from './App.tsx';

const conteneur = document.getElementById('root');
if (!conteneur) {
  throw new Error('Élément racine #root introuvable.');
}

// VITE_MOCK=1 fait tourner l'application entièrement contre les fixtures Foreca,
// sans réseau (phase 3) : utile en développement et le temps qu'une clé Foreca arrive.
if (import.meta.env.VITE_MOCK === '1') {
  const { worker } = await import('./mocks/browser');
  await worker.start({ onUnhandledRequest: 'bypass' });
}

createRoot(conteneur).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
