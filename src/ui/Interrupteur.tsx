import styles from './Interrupteur.module.css';

interface InterrupteurProps {
  actif: boolean;
  onChange: (actif: boolean) => void;
  libelle: string;
}

/** Interrupteur (§6, `.interrupteur`) : angle droit, pas de piste arrondie. */
export function Interrupteur({ actif, onChange, libelle }: InterrupteurProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={actif}
      aria-label={libelle}
      className={styles.interrupteur}
      onClick={() => onChange(!actif)}
    >
      <i className={styles.galet} />
    </button>
  );
}
