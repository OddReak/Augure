import { Signe } from '../../design/Signe';
import { SIGNES_METEO } from '../../domain/signes';
import { signeAffiche } from '../../domain/symboles';
import type { Lieu, Palier } from '../../domain/types';
import { useResumeLieu } from './useResumeLieu';
import styles from './VignetteLieu.module.css';

interface VignetteLieuProps {
  lieu: Lieu;
  sousTitre?: string;
  estPosition?: boolean;
  onChoisir: () => void;
  /** Présentes seulement en mode réorganisation (§8, décision : pas de glisser-déposer). */
  reorganisation?: {
    onMonter?: () => void;
    onDescendre?: () => void;
    onSupprimer: () => void;
  };
}

/**
 * Vignette de lieu (§6, `.vignette`) : peinte dans le palier de sa propre
 * météo (§5.2, sélecteur `[data-palier=...]`, pas `html[data-palier=...]`) —
 * c'est ce qui permet à plusieurs paliers de coexister sur un même écran.
 */
export function VignetteLieu({ lieu, sousTitre, estPosition = false, onChoisir, reorganisation }: VignetteLieuProps) {
  const resume = useResumeLieu(lieu.coordonnees);
  // Pas de spinner (§7) : le palier par défaut se peint tel quel pendant le chargement,
  // remplacé sans transition brusque dès que la vraie condition arrive.
  const palier: Palier = resume.data?.palier ?? 'vigies';
  const signe = resume.data ? signeAffiche(resume.data.signe, resume.data.temperatureC) : 'soleil';
  const nomSigne = SIGNES_METEO[signe].nom;

  return (
    <div className={styles.enveloppe} data-palier={palier}>
      <button type="button" className={styles.vignette} onClick={onChoisir}>
        <div>
          <div className={styles.nom}>
            {estPosition ? <Signe nom="position" titre="Votre position" /> : null}
            {lieu.nom}
          </div>
          {sousTitre ? <div className={styles.sous}>{sousTitre}</div> : null}
        </div>
        <div className={styles.temp}>{resume.data ? Math.round(resume.data.temperatureC) : '--'}°</div>
        <div className={styles.bas}>
          <Signe nom={signe} />
          <span>{nomSigne}</span>
        </div>
        <div className={styles.mm}>
          {resume.data?.minC !== undefined ? Math.round(resume.data.minC) : '--'}° /{' '}
          {resume.data?.maxC !== undefined ? Math.round(resume.data.maxC) : '--'}°
        </div>
      </button>
      {reorganisation ? (
        <div className={styles.actions}>
          <button type="button" onClick={reorganisation.onMonter} disabled={!reorganisation.onMonter}>
            Monter
          </button>
          <button type="button" onClick={reorganisation.onDescendre} disabled={!reorganisation.onDescendre}>
            Descendre
          </button>
          <button type="button" onClick={reorganisation.onSupprimer}>
            Retirer
          </button>
        </div>
      ) : null}
    </div>
  );
}
