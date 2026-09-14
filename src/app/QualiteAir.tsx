import { useNavigate } from 'react-router-dom';
import { Signe } from '../design/Signe';
import { ECH_AIR, niveau } from '../domain/quantification';
import type { SousIndicesPollution } from '../domain/types';
import { useCoordonneesActuelles } from '../features/meteo/useCoordonneesActuelles';
import { usePrevisionLieu } from '../features/meteo/usePrevisionLieu';
import { Bande } from '../ui/Bande';
import { Chapeau } from '../ui/Chapeau';
import { Etiquette } from '../ui/Etiquette';
import { Pastille } from '../ui/Pastille';
import styles from './QualiteAir.module.css';

/**
 * Six polluants toujours renvoyés par `air-quality/forecast/hourly` (§11,
 * post-livraison), chacun sur le même barème EPA 0-500 que l'indice
 * composite `AQI` — noms français fixes, Foreca ne les traduit pas
 * individuellement (seul `pollutantPhrase`, le polluant dominant, l'est).
 */
const POLLUANTS: Array<[cle: keyof SousIndicesPollution, libelle: string]> = [
  ['o3', 'Ozone'],
  ['no2', "Dioxyde d'azote"],
  ['so2', 'Dioxyde de soufre'],
  ['co', 'Monoxyde de carbone'],
  ['pm10', 'Particules PM10'],
  ['pm25', 'Particules fines PM2,5'],
];

/**
 * Vue détaillée de la qualité de l'air (§11, post-livraison) : l'AQI brut
 * affiché dans la frise horaire (`FriseHoraire.tsx`) dit déjà « combien »,
 * pas « pourquoi ». Cet écran ajoute le polluant dominant et le détail par
 * polluant, chacun avec sa propre bande — la même échelle `ECH_AIR`
 * (seuils EPA officiels) que la frise, jamais une seconde échelle inventée.
 *
 * Réutilise la requête de l'accueil (même clé TanStack Query que
 * `DetailJour.tsx`) : aucun second appel réseau. Le premier point de
 * `qualiteAirDetail` est le plus proche de maintenant, comme `horaire[0]`.
 */
export function QualiteAir() {
  const navigate = useNavigate();
  const { latitude, longitude, nomLieu } = useCoordonneesActuelles();
  const requete = usePrevisionLieu({ latitude, longitude, nomLieu });

  if (!requete.data) {
    return <main aria-busy="true" />;
  }

  const point = requete.data.qualiteAirDetail?.[0];
  const bandeGlobale = point ? niveau(point.aqi, ECH_AIR) : null;

  return (
    <main>
      {/* §11, post-livraison : n'est atteint que depuis la frise horaire de l'accueil —
          équivalent à `navigate(-1)`, qui n'accepte pas `viewTransition` (React Router ne le
          supporte que sur les navigations push/replace). `replace` reproduit la même pile
          qu'un vrai retour. */}
      <Chapeau
        gauche={
          <Pastille
            icone="retour"
            libelle="Retour"
            onClick={() => void navigate('/', { replace: true, viewTransition: true })}
          />
        }
        titre="Qualité de l’air"
        sousTitre={nomLieu}
      />
      {point && bandeGlobale ? (
        <>
          <header className={styles.entete}>
            <Signe nom="air" taille={56} className={styles.grandSigne} />
            <div>
              <p className={styles.bandeTitre}>
                <span
                  className={styles.pastilleCouleur}
                  style={{ background: bandeGlobale.couleur }}
                  aria-hidden="true"
                />
                Qualité {bandeGlobale.libelle}
              </p>
              <p className={styles.note}>
                Polluant dominant : {point.polluantDominant}. Indice EPA {point.aqi}.
              </p>
            </div>
          </header>

          <Bande>
            <Etiquette glyphe={<Signe nom="air" taille={17} />} titre="Détail par polluant" note="indice EPA" />
            <ul className={styles.polluants}>
              {POLLUANTS.map(([cle, libelle]) => {
                const valeur = point.sousIndices[cle];
                const bande = niveau(valeur, ECH_AIR);
                return (
                  <li key={cle} className={styles.polluant}>
                    <span className={styles.pastilleCouleur} style={{ background: bande.couleur }} aria-hidden="true" />
                    <span className={styles.nom}>{libelle}</span>
                    <span className={styles.valeur}>{valeur}</span>
                    <span className={styles.bandeTxt}>{bande.libelle}</span>
                  </li>
                );
              })}
            </ul>
          </Bande>
        </>
      ) : (
        <Bande>
          <p className={styles.absente}>
            Qualité de l&rsquo;air indisponible pour {nomLieu}. Vérifiez la connexion et réessayez depuis l&rsquo;accueil.
          </p>
        </Bande>
      )}
    </main>
  );
}
