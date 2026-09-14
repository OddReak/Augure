import { useNavigate, useParams } from 'react-router-dom';
import { hauteurMarcheCiel } from '../design/marche-ciel';
import { Paysage } from '../design/Paysage';
import { Signe } from '../design/Signe';
import { SigneLexique } from '../design/SigneLexique';
import { dateDe, decalageDe, libelleDateLongue, libelleJourLong } from '../domain/fuseau';
import { SIGNES_METEO } from '../domain/signes';
import { CourseSoleil } from '../features/meteo/CourseSoleil';
import { FriseHoraire } from '../features/meteo/FriseHoraire';
import { phrasePlaceholder } from '../features/meteo/phrase';
import { useCoordonneesActuelles } from '../features/meteo/useCoordonneesActuelles';
import { usePrevisionLieu } from '../features/meteo/usePrevisionLieu';
import { Bande } from '../ui/Bande';
import { Chapeau } from '../ui/Chapeau';
import { Etiquette } from '../ui/Etiquette';
import { Pastille } from '../ui/Pastille';
import { partagerLieu } from '../lib/partager';
import styles from './DetailJour.module.css';

/**
 * Détail d'un jour (§6, `ecranDetail()`) : ouvert depuis une ligne des sept
 * jours. Réutilise la même requête que l'accueil (`useCoordonneesActuelles`,
 * même clé TanStack Query) — aucun second appel réseau.
 *
 * La frise horaire n'existe que pour les jours couverts par `/api/hourly`
 * (48 h, §7) : au-delà, la section est omise plutôt que de fabriquer des
 * heures qui n'existent pas (§0, ne jamais inventer une donnée absente).
 * Les métriques Humidité/Pression/Indice UV ne viennent que de
 * `/api/current` (§4.1, endpoint quotidien sans ces champs) : elles ne
 * s'affichent donc que pour le jour courant, pas les jours suivants — un
 * sous-ensemble honnête plutôt qu'une valeur inventée (voir DECISIONS.md).
 */
export function DetailJour() {
  const navigate = useNavigate();
  const { date = '' } = useParams<{ date: string }>();
  const { latitude, longitude, nomLieu } = useCoordonneesActuelles();
  const requete = usePrevisionLieu({ latitude, longitude, nomLieu });

  if (!requete.data) {
    return <main aria-busy="true" />;
  }

  const jour = requete.data.quotidien.find((j) => j.date === date);
  if (!jour) {
    return (
      <main>
        <Chapeau gauche={<Pastille icone="retour" libelle="Retour" onClick={() => navigate(-1)} />} titre="Jour" />
        <Bande>
          <p className={styles.absente}>Ce jour n&rsquo;est plus dans la prévision. Retournez à l&rsquo;accueil.</p>
        </Bande>
      </main>
    );
  }

  const estAujourdhui = date === dateDe(requete.data.courant.horodatage);
  const pointsDuJour = requete.data.horaire.filter((p) => dateDe(p.horodatage) === date);
  const titreSigne = SIGNES_METEO[jour.signe].nom;

  return (
    <main>
      <Chapeau
        gauche={<Pastille icone="retour" libelle="Retour" onClick={() => navigate(-1)} />}
        titre={libelleJourLong(date)}
        sousTitre={libelleDateLongue(date)}
        droite={<Pastille icone="partage" libelle="Partager" onClick={() => void partagerLieu(nomLieu)} />}
      />
      <header className={styles.heros}>
        <div className={styles.marque}>
          <SigneLexique nom={jour.signe} taille={96} titre={titreSigne} className={styles.grandSigne} />
          <div>
            <p className={styles.temp}>
              {Math.round(jour.temperatureMaxC)}
              <sup>°</sup>
            </p>
            <p className={styles.minimum}>minimum {Math.round(jour.temperatureMinC)}°</p>
          </div>
        </div>
        <p className={styles.phrase}>{phrasePlaceholder(jour.signe)}</p>
      </header>
      <Paysage hauteurCiel={hauteurMarcheCiel(0.5)} />

      {pointsDuJour.length > 0 ? (
        <FriseHoraire points={pointsDuJour} />
      ) : (
        <Bande>
          <p className={styles.absente}>Détail horaire non disponible au-delà de 48 h.</p>
        </Bande>
      )}

      <Bande>
        <Etiquette glyphe={<Signe nom="reglages" taille={17} />} titre="Conditions" />
        <div className={styles.metriques}>
          {estAujourdhui ? (
            <div className={styles.metrique}>
              <Signe nom="vent" />
              <div>
                <div className={styles.lab}>Vent</div>
                <div className={styles.val}>
                  {Math.round(requete.data.courant.ventKmh)} <em>km/h</em>
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.metrique}>
              <Signe nom="vent" />
              <div>
                <div className={styles.lab}>Vent maximum</div>
                <div className={styles.val}>
                  {Math.round(jour.ventMaxKmh)} <em>km/h</em>
                </div>
              </div>
            </div>
          )}
          <div className={styles.metrique}>
            <Signe nom="pluie" />
            <div>
              <div className={styles.lab}>Cumul</div>
              <div className={styles.val}>
                {jour.pluieAccumuleeMm.toFixed(1)} <em>mm</em>
              </div>
            </div>
          </div>
          {estAujourdhui ? (
            <div className={styles.metrique}>
              <Signe nom="humidite" />
              <div>
                <div className={styles.lab}>Humidité</div>
                <div className={styles.val}>
                  {Math.round(requete.data.courant.humiditePourcent)} <em>%</em>
                </div>
              </div>
            </div>
          ) : null}
          {estAujourdhui ? (
            <div className={styles.metrique}>
              <Signe nom="pression" />
              <div>
                <div className={styles.lab}>Pression</div>
                <div className={styles.val}>
                  {Math.round(requete.data.courant.pressionHpa)} <em>hPa</em>
                </div>
              </div>
            </div>
          ) : null}
          {estAujourdhui ? (
            <div className={styles.metrique}>
              <Signe nom="uv" />
              <div>
                <div className={styles.lab}>Indice UV</div>
                <div className={styles.val}>{Math.round(requete.data.courant.indiceUv)}</div>
              </div>
            </div>
          ) : null}
          <div className={styles.metrique}>
            <Signe nom="thermo" />
            <div>
              <div className={styles.lab}>Amplitude</div>
              <div className={styles.val}>
                {Math.round(jour.temperatureMaxC - jour.temperatureMinC)} <em>°C</em>
              </div>
            </div>
          </div>
        </div>
      </Bande>

      {estAujourdhui ? (
        <CourseSoleil
          leverSoleil={requete.data.leverSoleil}
          coucherSoleil={requete.data.coucherSoleil}
          decalage={decalageDe(requete.data.courant.horodatage)}
        />
      ) : null}
    </main>
  );
}
