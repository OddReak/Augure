import { useNavigate } from 'react-router-dom';
import { Signe } from '../design/Signe';
import { effacerDonneesLocales } from '../lib/effacer';
import { useMagasinUi } from '../lib/magasin';
import { positionAffinee } from '../lib/position';
import { usePermissionGeolocalisation } from '../lib/usePosition';
import { Chapeau } from '../ui/Chapeau';
import { Interrupteur } from '../ui/Interrupteur';
import { Pastille } from '../ui/Pastille';
import { Segment } from '../ui/Segment';
import styles from './Reglages.module.css';

/**
 * Réglages (§6, `ecranReglages()`) : « court par construction — sans
 * compte, il n'y a ni profil, ni synchronisation, ni confidentialité à
 * paramétrer ». La section Position reflète l'état réel de la permission de
 * géolocalisation (§ « Position refusée », un des trois états limites), pas
 * un interrupteur qui prétendrait pouvoir la révoquer depuis la page — ce
 * que le navigateur n'autorise pas.
 */
export function Reglages() {
  const navigate = useNavigate();
  const permission = usePermissionGeolocalisation();

  const uniteTemperature = useMagasinUi((etat) => etat.uniteTemperature);
  const definirUniteTemperature = useMagasinUi((etat) => etat.definirUniteTemperature);
  const uniteVent = useMagasinUi((etat) => etat.uniteVent);
  const definirUniteVent = useMagasinUi((etat) => etat.definirUniteVent);
  const signesSeuls = useMagasinUi((etat) => etat.signesSeuls);
  const definirSignesSeuls = useMagasinUi((etat) => etat.definirSignesSeuls);
  const notifResume = useMagasinUi((etat) => etat.notifResume);
  const definirNotifResume = useMagasinUi((etat) => etat.definirNotifResume);
  const notifVigilance = useMagasinUi((etat) => etat.notifVigilance);
  const definirNotifVigilance = useMagasinUi((etat) => etat.definirNotifVigilance);
  const lieuxEnregistres = useMagasinUi((etat) => etat.lieuxEnregistres);

  async function exporterMesLieux(): Promise<void> {
    const donnees = btoa(encodeURIComponent(JSON.stringify(lieuxEnregistres)));
    const url = `${window.location.origin}/mes-lieux?import=${donnees}`;
    // `partagerLieu` construit son propre texte à partir d'un nom de lieu ; ici c'est un lien
    // d'export, pas un lieu — appel direct des mêmes API plutôt que détourner cette fonction.
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Mes lieux — AUGURE', url });
        return;
      }
      await navigator.clipboard.writeText(url);
    } catch {
      // Annulé par l'utilisateur, ou aucune des deux API disponible : rien de plus à faire.
    }
  }

  async function effacer(): Promise<void> {
    await effacerDonneesLocales();
    window.location.reload();
  }

  return (
    <main>
      <Chapeau
        gauche={<Pastille icone="retour" libelle="Retour" onClick={() => navigate(-1)} />}
        titre="Réglages"
      />
      <div className={styles.corps}>
        <div className={styles.groupeTitre}>Affichage</div>
        <div className={styles.reglage}>
          <Signe nom="unite" className={styles.gl} />
          <div className={styles.txt}>
            <b>Température</b>
          </div>
          <Segment
            options={[
              { valeur: 'C', libelle: '°C' },
              { valeur: 'F', libelle: '°F' },
            ]}
            valeur={uniteTemperature}
            onChange={definirUniteTemperature}
          />
        </div>
        <div className={styles.reglage}>
          <Signe nom="vent" className={styles.gl} />
          <div className={styles.txt}>
            <b>Vent</b>
          </div>
          <Segment
            options={[
              { valeur: 'kmh', libelle: 'km/h' },
              { valeur: 'ms', libelle: 'm/s' },
              { valeur: 'mph', libelle: 'mph' },
            ]}
            valeur={uniteVent}
            onChange={definirUniteVent}
          />
        </div>
        <div className={styles.reglage}>
          <Signe nom="lexique" className={styles.gl} />
          <div className={styles.txt}>
            <b>Signes seuls</b>
            <span>Masque les libellés des conditions</span>
          </div>
          <Interrupteur actif={signesSeuls} onChange={definirSignesSeuls} libelle="Signes seuls" />
        </div>

        <div className={styles.groupeTitre}>Notifications</div>
        <div className={styles.reglage}>
          <Signe nom="cloche" className={styles.gl} />
          <div className={styles.txt}>
            <b>Résumé du lendemain</b>
            <span>Une notification par jour</span>
          </div>
          <Interrupteur actif={notifResume} onChange={definirNotifResume} libelle="Résumé du lendemain" />
        </div>
        <div className={styles.reglage}>
          <Signe nom="horloge" className={styles.gl} />
          <div className={styles.txt}>
            <b>Heure d&rsquo;envoi</b>
          </div>
          <span className={styles.val}>7:00</span>
        </div>
        <div className={styles.reglage}>
          <Signe nom="alerte" className={styles.gl} />
          <div className={styles.txt}>
            <b>Vigilance</b>
            <span>Orage, canicule, neige</span>
          </div>
          <Interrupteur actif={notifVigilance} onChange={definirNotifVigilance} libelle="Vigilance" />
        </div>

        <div className={styles.groupeTitre}>Position</div>
        {permission === 'denied' ? (
          <>
            <div className={styles.reglage}>
              <Signe nom="position" className={styles.gl} />
              <div className={styles.txt}>
                <b>Position en direct</b>
                <span>Refusée. Augure affiche la météo déduite de votre connexion.</span>
              </div>
            </div>
            <p className={styles.note}>Pour l&rsquo;activer : Réglages iOS → Augure → Position → Lorsque l&rsquo;app est active.</p>
          </>
        ) : null}
        {permission === 'granted' ? (
          <div className={styles.reglage}>
            <Signe nom="position" className={styles.gl} />
            <div className={styles.txt}>
              <b>Position en direct</b>
              <span>Autorisée</span>
            </div>
            <Interrupteur actif={true} onChange={() => void positionAffinee()} libelle="Position en direct" />
          </div>
        ) : null}
        {permission === 'prompt' || permission === 'indisponible' ? (
          <div className={styles.reglage}>
            <Signe nom="position" className={styles.gl} />
            <div className={styles.txt}>
              <b>Position en direct</b>
              <span>Non autorisée pour l&rsquo;instant</span>
            </div>
            <Interrupteur actif={false} onChange={() => void positionAffinee()} libelle="Position en direct" />
          </div>
        ) : null}

        <div className={styles.groupeTitre}>Données</div>
        <div className={styles.reglage}>
          <Signe nom="info" className={styles.gl} />
          <div className={styles.txt}>
            <b>Source</b>
            <span>Météo fournie par Foreca</span>
          </div>
        </div>
        <button type="button" className={styles.reglage} onClick={() => void exporterMesLieux()}>
          <Signe nom="partage" className={styles.gl} />
          <div className={styles.txt}>
            <b>Exporter mes lieux</b>
            <span>Un lien à ouvrir sur un autre appareil</span>
          </div>
        </button>
        <button type="button" className={styles.reglage} onClick={() => void effacer()}>
          <Signe nom="corbeille" className={styles.gl} />
          <div className={styles.txt}>
            <b>Effacer les données locales</b>
          </div>
        </button>
      </div>
    </main>
  );
}
