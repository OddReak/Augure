import { lazy, Suspense, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { vigilanceMax } from '../api/foreca';
import { decalageDe } from '../domain/fuseau';
import { Hero } from '../features/meteo/Hero';
import { useCoordonneesActuelles } from '../features/meteo/useCoordonneesActuelles';
import { usePrevisionLieu } from '../features/meteo/usePrevisionLieu';
import { MenuLieu } from '../features/lieux/MenuLieu';
import { definirBadgeVigilance } from '../lib/badge';
import { useMagasinUi } from '../lib/magasin';
import { useEnLigne } from '../lib/useEnLigne';
import { ApresPremierRendu } from '../ui/ApresPremierRendu';
import { Bande } from '../ui/Bande';

/*
 * §11 : budget de performance (premier rendu utile sous 1,2 s). Le Héros
 * seul porte le critère d'acceptation final (« on sait déjà qu'il pleut,
 * qu'il fait nuit, ou qu'un orage arrive ») ; le reste de l'écran d'accueil
 * (frise horaire, sept jours, course du soleil, lune — avec tout le calcul
 * Meeus qu'elle entraîne) est donc chargé à la demande, pas au premier
 * rendu. `Suspense` avec un repli `null` : jamais un spinner entre les
 * deux, la seconde vague de contenu suit dans la même seconde, comme entre
 * écrans (`Layout.tsx`, même principe).
 */
const FriseHoraire = lazy(() => import('../features/meteo/FriseHoraire').then((m) => ({ default: m.FriseHoraire })));
const SeptJours = lazy(() => import('../features/meteo/SeptJours').then((m) => ({ default: m.SeptJours })));
const CourseSoleil = lazy(() =>
  import('../features/meteo/CourseSoleil').then((m) => ({ default: m.CourseSoleil })),
);
const Lune = lazy(() => import('../features/meteo/Lune').then((m) => ({ default: m.Lune })));
// §11, post-livraison : détail d'un jour en feuille plutôt qu'un écran séparé (demandé par
// l'utilisateur, « comme le menu de l'app ») — chargé à la demande comme le reste de l'accueil.
/**
 * Durée minimale de l'état « actualisation en cours » : un tour complet du glyphe
 * (`Pastille.module.css`, 720 ms). Une réponse servie en 80 ms ferait sinon clignoter
 * la pastille — l'utilisateur ne saurait pas si son geste a été pris en compte.
 */
const DUREE_MIN_ACTUALISATION_MS = 720;

const DetailJour = lazy(() => import('./DetailJour').then((m) => ({ default: m.DetailJour })));

/** Écran d'accueil (§6) : barre collante, héros, paysage. */
export function Accueil() {
  const navigate = useNavigate();
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [jourOuvert, setJourOuvert] = useState<string | null>(null);
  const [actualisationEnCours, setActualisationEnCours] = useState(false);

  const { latitude, longitude, nomLieu } = useCoordonneesActuelles();
  const requete = usePrevisionLieu({ latitude, longitude, nomLieu });
  const definirPalierMeteo = useMagasinUi((etat) => etat.definirPalierMeteo);
  const enLigne = useEnLigne();

  useEffect(() => {
    if (requete.data) {
      definirPalierMeteo(requete.data.courant.palier);
      // §11 : badge d'application sur vigilance — visible même l'application
      // fermée, contrairement à la notification quotidienne qui ne part
      // qu'une fois par jour (§10).
      definirBadgeVigilance(vigilanceMax(requete.data.avertissements));
    }
  }, [requete.data, definirPalierMeteo]);

  async function actualiser(): Promise<void> {
    setActualisationEnCours(true);
    try {
      // `refetch` ignore `staleTime` : une vraie requête réseau, même dans les cinq
      // minutes qui suivent la précédente (§7).
      await Promise.all([
        requete.refetch(),
        new Promise((resoudre) => setTimeout(resoudre, DUREE_MIN_ACTUALISATION_MS)),
      ]);
    } finally {
      setActualisationEnCours(false);
    }
  }

  // Écran d'erreur seulement sans aucune donnée à montrer : une actualisation (manuelle
  // ou au retour au premier plan) qui échoue ne doit jamais effacer la météo déjà
  // affichée — TanStack Query garde `data` et passe pourtant `isError` à vrai.
  if (requete.isError && !requete.data) {
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
        onTitreClick={() => void navigate('/mes-lieux', { viewTransition: true })}
        onOuvrirMenu={() => setMenuOuvert(true)}
        onActualiser={() => void actualiser()}
        actualisationEnCours={actualisationEnCours}
        horsLigne={!enLigne}
      />
      <ApresPremierRendu>
        <Suspense fallback={null}>
          <FriseHoraire points={requete.data.horaire} />
          <SeptJours
            jours={requete.data.quotidien}
            aujourdhui={requete.data.quotidien[0]?.date ?? ''}
            onJourClick={setJourOuvert}
          />
          <CourseSoleil
            leverSoleil={requete.data.leverSoleil}
            coucherSoleil={requete.data.coucherSoleil}
            decalage={decalageDe(requete.data.courant.horodatage)}
          />
          <Lune />
        </Suspense>
      </ApresPremierRendu>
      {menuOuvert ? <MenuLieu lieu={requete.data.lieu} onFermer={() => setMenuOuvert(false)} /> : null}
      {jourOuvert ? (
        <Suspense fallback={null}>
          <DetailJour date={jourOuvert} onFermer={() => setJourOuvert(null)} />
        </Suspense>
      ) : null}
    </main>
  );
}
