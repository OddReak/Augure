import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from './Layout';
import { Accueil } from './Accueil';

/**
 * §11 : budget de performance (bundle initial < 180 Ko compressé, premier
 * rendu utile < 1,2 s en 4G simulé). L'accueil (route `/`) reste un import
 * statique — c'est le tout premier écran peint, il ne doit jamais attendre
 * un second aller-retour réseau. Tous les écrans secondaires sont chargés à
 * la demande : ils ne coûtent rien au premier rendu, et `Reglages` en
 * particulier entraîne `@supabase/supabase-js` (phase 10, abonnement aux
 * notifications) — la dépendance la plus lourde du projet, qu'un visiteur
 * qui ne fait que consulter la météo n'a jamais besoin de télécharger.
 * `Layout.tsx` porte le seul `<Suspense>` (autour de l'`<Outlet>`), avec un
 * repli `null` : jamais de spinner de chargement, y compris entre écrans
 * (§9 — la règle vise le lancement, mais rien dans l'esprit du document ne
 * justifie un spinner ailleurs).
 */
const MesLieux = lazy(() => import('./MesLieux').then((m) => ({ default: m.MesLieux })));
const Recherche = lazy(() => import('./Recherche').then((m) => ({ default: m.Recherche })));
const DetailJour = lazy(() => import('./DetailJour').then((m) => ({ default: m.DetailJour })));
const Lexique = lazy(() => import('./Lexique').then((m) => ({ default: m.Lexique })));
const FicheSigne = lazy(() => import('./FicheSigne').then((m) => ({ default: m.FicheSigne })));
const Reglages = lazy(() => import('./Reglages').then((m) => ({ default: m.Reglages })));
const QualiteAir = lazy(() => import('./QualiteAir').then((m) => ({ default: m.QualiteAir })));
const Styleguide = lazy(() => import('./Styleguide').then((m) => ({ default: m.Styleguide })));

export const routeur = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Accueil /> },
      { path: '/mes-lieux', element: <MesLieux /> },
      { path: '/recherche', element: <Recherche /> },
      { path: '/jour/:date', element: <DetailJour /> },
      { path: '/lexique', element: <Lexique /> },
      { path: '/lexique/:signe', element: <FicheSigne /> },
      { path: '/reglages', element: <Reglages /> },
      { path: '/qualite-air', element: <QualiteAir /> },
      { path: '/styleguide', element: <Styleguide /> },
      // §11, post-livraison : /cartes menait quelque part avant son retrait (DECISIONS.md) —
      // un vieux lien ou signet ne doit jamais tomber sur une erreur de routeur non gérée,
      // seulement revenir à l'accueil (§0 : tous les états existent, y compris celui-ci).
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
