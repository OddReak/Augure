import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './design/jetons.css';
import { App } from './App.tsx';

const conteneur = document.getElementById('root');
if (!conteneur) {
  throw new Error('Élément racine #root introuvable.');
}

createRoot(conteneur).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
