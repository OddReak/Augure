import type { ReactNode } from 'react';
import styles from './Etiquette.module.css';

interface EtiquetteProps {
  glyphe: ReactNode;
  titre: string;
  note?: string;
}

/** Étiquette de bande (§6, `.etiquette`) : cartouche plein + titre casse de phrase. */
export function Etiquette({ glyphe, titre, note }: EtiquetteProps) {
  return (
    <div className={styles.etiquette}>
      <span className={styles.cartouche} aria-hidden="true">
        {glyphe}
      </span>
      <h3 className={styles.titre}>{titre}</h3>
      {note ? <span className={styles.note}>{note}</span> : null}
    </div>
  );
}
