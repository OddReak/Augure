import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { decalageDe } from '../domain/fuseau';
import { CourseSoleil } from '../features/meteo/CourseSoleil';
import { FriseHoraire } from '../features/meteo/FriseHoraire';
import { Hero } from '../features/meteo/Hero';
import { Lune } from '../features/meteo/Lune';
import { SeptJours } from '../features/meteo/SeptJours';
import { useCoordonneesActuelles } from '../features/meteo/useCoordonneesActuelles';
import { usePrevisionLieu } from '../features/meteo/usePrevisionLieu';
import { MenuLieu } from '../features/lieux/MenuLieu';
import { useMagasinUi } from '../lib/magasin';
import { Bande } from '../ui/Bande';
import { Pied } from '../ui/Pied';

/** Écran d'accueil (§6) : barre collante, héros, paysage. */
export function Accueil() {
  const navigate = useNavigate();
  const [menuOuvert, setMenuOuvert] = useState(false);

  const { latitude, longitude, nomLieu } = useCoordonneesActuelles();
  const requete = usePrevisionLieu({ latitude, longitude, nomLieu });
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
        onTitreClick={() => navigate('/mes-lieux')}
        onOuvrirMenu={() => setMenuOuvert(true)}
      />
      <FriseHoraire points={requete.data.horaire} />
      <SeptJours
        jours={requete.data.quotidien}
        aujourdhui={requete.data.quotidien[0]?.date ?? ''}
        onJourClick={(date) => navigate(`/jour/${date}`)}
      />
      <CourseSoleil
        leverSoleil={requete.data.leverSoleil}
        coucherSoleil={requete.data.coucherSoleil}
        decalage={decalageDe(requete.data.courant.horodatage)}
      />
      <Lune />
      <Pied actif="ciel" />
      {menuOuvert ? <MenuLieu lieu={requete.data.lieu} onFermer={() => setMenuOuvert(false)} /> : null}
    </main>
  );
}
