import { RouterProvider } from 'react-router-dom';
import { routeur } from './app/router';

export function App() {
  return <RouterProvider router={routeur} />;
}
