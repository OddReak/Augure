import { Suspense, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useMagasinUi } from '../lib/magasin';
import { Sprite } from '../design/Sprite';
import { FeuilleInstallation } from '../features/installation/FeuilleInstallation';
import { RegistreurPwa } from '../pwa/RegistreurPwa';

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
      {/* §11 : les écrans secondaires sont chargés à la demande (router.tsx) — repli `null`,
          jamais un spinner, y compris entre écrans (§9). */}
      <Suspense fallback={null}>
        <Outlet />
      </Suspense>
      <FeuilleInstallation />
      {/* Jamais sous VITE_MOCK=1 (§9, DECISIONS.md) : le service worker MSW (phase 3)
          doit rester le seul à contrôler la page dans les tests et en développement mocké. */}
      {import.meta.env.VITE_MOCK !== '1' ? <RegistreurPwa /> : null}
    </>
  );
}
