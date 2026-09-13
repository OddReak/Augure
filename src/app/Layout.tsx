import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useMagasinUi } from '../lib/magasin';

/**
 * Pose `data-palier` sur la racine du document (§5.2 : « un seul attribut
 * data-palier sur la racine pilote tout »). En phase 1, seul le palier forcé
 * par le styleguide existe ; le palier dérivé de la météo réelle arrive en
 * phase 4.
 */
export function Layout() {
  const palierForce = useMagasinUi((etat) => etat.palierForce);

  useEffect(() => {
    document.documentElement.dataset.palier = palierForce ?? 'vigies';
  }, [palierForce]);

  return <Outlet />;
}
