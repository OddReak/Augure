import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useMagasinUi } from '../lib/magasin';
import { Sprite } from '../design/Sprite';

/**
 * Pose `data-palier` sur la racine du document (§5.2 : « un seul attribut
 * data-palier sur la racine pilote tout »). Priorité : le palier forcé par
 * le styleguide, puis le dernier palier météo connu (persisté, peint
 * immédiatement au démarrage sans attendre le réseau — §7), puis `vigies`
 * par défaut.
 */
export function Layout() {
  const palierForce = useMagasinUi((etat) => etat.palierForce);
  const palierMeteo = useMagasinUi((etat) => etat.palierMeteo);

  useEffect(() => {
    document.documentElement.dataset.palier = palierForce ?? palierMeteo ?? 'vigies';
  }, [palierForce, palierMeteo]);

  return (
    <>
      <Sprite />
      <Outlet />
    </>
  );
}
