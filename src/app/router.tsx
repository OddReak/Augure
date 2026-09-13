import { createBrowserRouter } from 'react-router-dom';
import { Layout } from './Layout';
import { Accueil } from './Accueil';
import { Cartes } from './Cartes';
import { DetailJour } from './DetailJour';
import { FicheSigne } from './FicheSigne';
import { Lexique } from './Lexique';
import { MesLieux } from './MesLieux';
import { Recherche } from './Recherche';
import { Reglages } from './Reglages';
import { Styleguide } from './Styleguide';

export const routeur = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Accueil /> },
      { path: '/mes-lieux', element: <MesLieux /> },
      { path: '/recherche', element: <Recherche /> },
      { path: '/jour/:date', element: <DetailJour /> },
      { path: '/cartes', element: <Cartes /> },
      { path: '/lexique', element: <Lexique /> },
      { path: '/lexique/:signe', element: <FicheSigne /> },
      { path: '/reglages', element: <Reglages /> },
      { path: '/styleguide', element: <Styleguide /> },
    ],
  },
]);
