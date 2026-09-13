import type { ReactNode } from 'react';
import styles from './Onglets.module.css';

interface OptionOnglet<T extends string> {
  valeur: T;
  libelle: string;
  glyphe?: ReactNode;
}

interface OngletsProps<T extends string> {
  options: readonly OptionOnglet<T>[];
  valeur: T;
  onChange: (valeur: T) => void;
  colonnes: number;
}

/**
 * Grille d'onglets (§6, `.selecteur .grille` / `.onglet`). Jamais de rail
 * qui déborde : le nombre de colonnes est explicite, jamais déduit d'une
 * troncature (§8bis, « aucune troncature dans un contrôle »).
 */
export function Onglets<T extends string>({ options, valeur, onChange, colonnes }: OngletsProps<T>) {
  return (
    <div
      className={styles.grille}
      style={{ gridTemplateColumns: `repeat(${colonnes}, 1fr)` }}
      role="tablist"
    >
      {options.map((option) => (
        <button
          key={option.valeur}
          type="button"
          role="tab"
          aria-selected={option.valeur === valeur}
          className={styles.onglet}
          onClick={() => onChange(option.valeur)}
        >
          {option.glyphe}
          {option.libelle}
        </button>
      ))}
    </div>
  );
}
