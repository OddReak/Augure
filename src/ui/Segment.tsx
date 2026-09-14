import styles from './Segment.module.css';

interface OptionSegment<T extends string> {
  valeur: T;
  libelle: string;
}

interface SegmentProps<T extends string> {
  options: readonly OptionSegment<T>[];
  valeur: T;
  onChange: (valeur: T) => void;
}

/** Segment (§6, `.segment`) : rail de boutons jointifs à deux ou trois options. */
export function Segment<T extends string>({ options, valeur, onChange }: SegmentProps<T>) {
  return (
    <div className={styles.segment} role="group">
      {options.map((option) => (
        <button
          key={option.valeur}
          type="button"
          aria-pressed={option.valeur === valeur}
          onClick={() => onChange(option.valeur)}
        >
          {option.libelle}
        </button>
      ))}
    </div>
  );
}
