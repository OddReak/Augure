import { createBrowserRouter } from 'react-router-dom';
import { Layout } from './Layout';
import { Accueil } from './Accueil';
import { DetailJour } from './DetailJour';
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
      { path: '/reglages', element: <Reglages /> },
      { path: '/styleguide', element: <Styleguide /> },
    ],
  },
]);
