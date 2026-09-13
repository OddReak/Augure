import { Signe } from '../design/Signe';
import styles from './Pastille.module.css';

interface PastilleProps {
  /** Identifiant d'icône d'interface dans `signes.svg` (§5.4), jamais un signe météo. */
  icone: string;
  /** Nom accessible du bouton — le glyphe lui-même reste décoratif. */
  libelle: string;
  plein?: boolean;
  onClick?: () => void;
}

/** Pastille (§6, `.pastille`) : bouton-icône carré, contour plein, jamais de coin arrondi. */
export function Pastille({ icone, libelle, plein = false, onClick }: PastilleProps) {
  return (
    <button
      type="button"
      className={plein ? `${styles.pastille} ${styles.plein}` : styles.pastille}
      aria-label={libelle}
      onClick={onClick}
    >
      <Signe nom={icone} taille={20} />
    </button>
  );
}
