import { useEffect } from 'react';
import { decalageDe } from '../domain/fuseau';
import { CourseSoleil } from '../features/meteo/CourseSoleil';
import { FriseHoraire } from '../features/meteo/FriseHoraire';
import { Hero } from '../features/meteo/Hero';
import { Lune } from '../features/meteo/Lune';
import { SeptJours } from '../features/meteo/SeptJours';
import { usePrevisionLieu } from '../features/meteo/usePrevisionLieu';
import { useMagasinUi } from '../lib/magasin';
import { Bande } from '../ui/Bande';

// Position temporaire, en dur : la chaîne de repli du §7 (dernière position
// connue → IP → GPS → recherche manuelle) arrive en phase 7/8. Coordonnées
// de Cestas, identiques à la fixture MSW de la phase 3.
const LIEU_PROVISOIRE = { latitude: 44.74, longitude: -0.68, nomLieu: 'Cestas' };

/** Écran d'accueil (§6) : barre collante, héros, paysage. */
export function Accueil() {
  const requete = usePrevisionLieu(LIEU_PROVISOIRE);
  const definirPalierMeteo = useMagasinUi((etat) => etat.definirPalierMeteo);

  useEffect(() => {
    if (requete.data) {
      definirPalierMeteo(requete.data.courant.palier);
    }
  }, [requete.data, definirPalierMeteo]);

  if (requete.isError) {
    return (
      <main>
        <Bande>
          <p>La météo n&rsquo;a pas pu être chargée. Vérifiez la connexion et réessayez.</p>
          <button type="button" onClick={() => requete.refetch()}>
            Réessayer
          </button>
        </Bande>
      </main>
    );
  }

  if (!requete.data) {
    // Pas de spinner au démarrage (§7) : l'état connu (rien encore) se peint tel quel.
    return <main aria-busy="true" />;
  }

  return (
    <main>
      <Hero
        nomLieu={requete.data.lieu.nom}
        condition={requete.data.courant}
        leverSoleil={requete.data.leverSoleil}
        coucherSoleil={requete.data.coucherSoleil}
      />
      <FriseHoraire points={requete.data.horaire} />
      <SeptJours jours={requete.data.quotidien} aujourdhui={requete.data.quotidien[0]?.date ?? ''} />
      <CourseSoleil
        leverSoleil={requete.data.leverSoleil}
        coucherSoleil={requete.data.coucherSoleil}
        decalage={decalageDe(requete.data.courant.horodatage)}
      />
      <Lune />
    </main>
  );
}
