import type { ReactNode } from 'react';
import styles from './Chapeau.module.css';

interface ChapeauProps {
  gauche?: ReactNode;
  titre: ReactNode;
  sousTitre?: string;
  droite?: ReactNode;
  /** Rend le titre lui-même actionnable (§8, ouvre « Mes lieux » depuis l'accueil). */
  onTitreClick?: () => void;
  /** Barre collante en tête d'un écran qui défile (§6, `.chapeau` de l'accueil). */
  collant?: boolean;
}

/**
 * Chapeau (§6, `.chapeau`) : barre supérieure à trois zones, bouton gauche,
 * titre centré (avec sous-titre optionnel), bouton droit. Un côté vide garde
 * son espace réservé (`.espace`, 38 px) pour que le titre reste centré —
 * exactement `<span style="width:38px">` dans le mockup (Réglages, Position
 * refusée).
 */
export function Chapeau({ gauche, titre, sousTitre, droite, onTitreClick, collant = false }: ChapeauProps) {
  const contenuTitre = (
    <span className={styles.lieu}>
      {titre}
      {sousTitre ? <small>{sousTitre}</small> : null}
    </span>
  );

  return (
    <div className={collant ? `${styles.chapeau} ${styles.sticky}` : styles.chapeau}>
      {gauche ?? <span className={styles.espace} aria-hidden="true" />}
      {onTitreClick ? (
        <button type="button" className={styles.lieuBouton} onClick={onTitreClick}>
          {contenuTitre}
        </button>
      ) : (
        contenuTitre
      )}
      {droite ?? <span className={styles.espace} aria-hidden="true" />}
    </div>
  );
}
