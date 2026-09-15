import type { ReactNode, Ref } from 'react';
import styles from './Chapeau.module.css';

interface ChapeauProps {
  gauche?: ReactNode;
  /** Entre le bouton gauche et le titre (§11, bandeau compact de l'accueil au défilement). */
  avantTitre?: ReactNode;
  titre: ReactNode;
  sousTitre?: string;
  /** Entre le titre et le bouton droit — même usage que `avantTitre`. */
  apresTitre?: ReactNode;
  droite?: ReactNode;
  /** Rend le titre lui-même actionnable (§8, ouvre « Mes lieux » depuis l'accueil). */
  onTitreClick?: () => void;
  /** Barre collante en tête d'un écran qui défile (§6, `.chapeau` de l'accueil). */
  collant?: boolean;
  /** §11 : le Héros mesure sa propre hauteur pour le fondu de `avantTitre`/`apresTitre`. */
  ref?: Ref<HTMLDivElement>;
}

/**
 * Chapeau (§6, `.chapeau`) : barre supérieure à trois zones, bouton gauche,
 * titre centré (avec sous-titre optionnel), bouton droit. Un côté vide garde
 * son espace réservé (`.espace`, 38 px) pour que le titre reste centré —
 * exactement `<span style="width:38px">` dans le mockup (Réglages, Position
 * refusée).
 */
export function Chapeau({
  gauche,
  avantTitre,
  titre,
  sousTitre,
  apresTitre,
  droite,
  onTitreClick,
  collant = false,
  ref,
}: ChapeauProps) {
  const contenuTitre = (
    <span className={styles.lieu}>
      <span>{titre}</span>
      {sousTitre ? <small>{sousTitre}</small> : null}
    </span>
  );

  return (
    <div ref={ref} className={collant ? `${styles.chapeau} ${styles.sticky}` : styles.chapeau}>
      {gauche ?? <span className={styles.espace} aria-hidden="true" />}
      {avantTitre}
      {onTitreClick ? (
        <button type="button" className={styles.lieuBouton} onClick={onTitreClick}>
          {contenuTitre}
        </button>
      ) : (
        contenuTitre
      )}
      {apresTitre}
      {droite ?? <span className={styles.espace} aria-hidden="true" />}
    </div>
  );
}
