import { Signe } from '../design/Signe';
import styles from './Pastille.module.css';

interface PastilleProps {
  /** Identifiant d'icône d'interface dans `signes.svg` (§5.4), jamais un signe météo. */
  icone: string;
  /** Nom accessible du bouton — le glyphe lui-même reste décoratif. */
  libelle: string;
  plein?: boolean;
  /** Action en cours (actualisation de l'accueil) : bouton inerte, glyphe en rotation. */
  occupe?: boolean;
  desactive?: boolean;
  onClick?: () => void;
}

/** Pastille (§6, `.pastille`) : bouton-icône carré, contour plein, jamais de coin arrondi. */
export function Pastille({ icone, libelle, plein = false, occupe = false, desactive = false, onClick }: PastilleProps) {
  const classes = [styles.pastille, plein ? styles.plein : '', occupe ? styles.occupe : ''].join(' ').trim();
  return (
    <button
      type="button"
      className={classes}
      aria-label={libelle}
      aria-busy={occupe || undefined}
      disabled={occupe || desactive}
      onClick={onClick}
    >
      <Signe nom={icone} taille={20} />
    </button>
  );
}
