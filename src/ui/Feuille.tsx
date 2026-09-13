import type { ReactNode } from 'react';
import styles from './Feuille.module.css';

interface FeuilleProps {
  titre: string;
  description?: string;
  children?: ReactNode;
  onFermer: () => void;
}

/**
 * Feuille (§6, `.feuille`) : panneau ancré en bas, voile en trame dense
 * (§5.5, « un scrim en demi-teinte plutôt qu'un noir translucide »).
 */
export function Feuille({ titre, description, children, onFermer }: FeuilleProps) {
  return (
    <div role="dialog" aria-modal="true" aria-label={titre}>
      <div className={`${styles.voile} trame`} onClick={onFermer} aria-hidden="true" />
      <div className={styles.feuille}>
        <h4>{titre}</h4>
        {description ? <p>{description}</p> : null}
        {children}
      </div>
    </div>
  );
}
