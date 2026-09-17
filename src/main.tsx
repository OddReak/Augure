import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './design/chassis.css';
import './design/jetons.css';
import { App } from './App.tsx';
import { ecouterInstallationDifferee } from './lib/installationNavigateur';
import { useMagasinUi } from './lib/magasin';
import { demanderStockagePersistant } from './lib/stockagePersistant';

const conteneur = document.getElementById('root');
if (!conteneur) {
  throw new Error('Élément racine #root introuvable.');
}

// Capturé avant le rendu : `beforeinstallprompt` peut se déclencher très tôt (§9).
ecouterInstallationDifferee();

// Un lancement de l'application, pas un rendu de composant (§7, §9 : feuille
// d'installation « à la deuxième ou troisième ouverture »).
useMagasinUi.getState().enregistrerOuverture();

// Palier posé sur `<html>` avant le premier rendu, pas dans l'effet de
// `Layout.tsx` : l'écran de lancement (§7, post-livraison) est du ciel plein
// cadre, il ne doit pas peindre en `vigies` puis basculer à la frame suivante.
// Même priorité que `Layout.tsx`, qui reste la source de vérité ensuite —
// `persist` de Zustand réhydrate `localStorage` de façon synchrone, l'état est
// donc déjà le bon ici.
{
  const etatInitial = useMagasinUi.getState();
  document.documentElement.dataset.palier =
    etatInitial.palierForce ?? etatInitial.palierMeteo ?? 'vigies';
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

// Après le rendu, jamais avant (§7 : ne retarde jamais la peinture) — Safari purge
// le stockage d'un site non installé après sept jours d'inactivité (§9).
void demanderStockagePersistant();
