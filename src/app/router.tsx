import { createBrowserRouter } from 'react-router-dom';
import { Layout } from './Layout';
import { Accueil } from './Accueil';
import { Styleguide } from './Styleguide';

export const routeur = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Accueil /> },
      { path: '/styleguide', element: <Styleguide /> },
    ],
  },
]);
