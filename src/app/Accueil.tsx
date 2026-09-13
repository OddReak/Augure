import { useEffect } from 'react';
import { decalageDe } from '../domain/fuseau';
import { CourseSoleil } from '../features/meteo/CourseSoleil';
import { FriseHoraire } from '../features/meteo/FriseHoraire';
import { Hero } from '../features/meteo/Hero';
import { Lune } from '../features/meteo/Lune';
import { SeptJours } from '../features/meteo/SeptJours';
import { usePrevisionLieu } from '../features/meteo/usePrevisionLieu';
import { useMagasinUi } from '../lib/magasin';
import { usePosition } from '../lib/usePosition';
import { Bande } from '../ui/Bande';

// Repli tant qu'aucune source de la chaîne du §7 (stockage → IP → GPS) n'a
// répondu — le tout premier appel, avant toute persistance et hors de
// l'infrastructure Vercel (§7 : `/api/position` répond 204 en local).
// Coordonnées de Cestas, identiques à la fixture MSW de la phase 3, pour que
// le mode mock continue de fonctionner sans dépendre d'une vraie position.
const POSITION_PAR_DEFAUT = { latitude: 44.74, longitude: -0.68 };

// Aucune recherche inverse coordonnées → nom de lieu tant que l'écran de
// recherche (phase 8) n'existe pas : « Cestas » n'est correct que pour le
// repli par défaut, un nom générique le reste tant que la position vient
// d'une source réelle (IP ou GPS). Voir DECISIONS.md.
function nomLieuPour(source: 'defaut' | 'stockage' | 'ip' | 'gps'): string {
  return source === 'defaut' ? 'Cestas' : 'Votre position';
}

/** Écran d'accueil (§6) : barre collante, héros, paysage. */
export function Accueil() {
  const position = usePosition();
  const requete = usePrevisionLieu({
    latitude: position?.coordonnees.latitude ?? POSITION_PAR_DEFAUT.latitude,
    longitude: position?.coordonnees.longitude ?? POSITION_PAR_DEFAUT.longitude,
    nomLieu: nomLieuPour(position?.source ?? 'defaut'),
  });
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
