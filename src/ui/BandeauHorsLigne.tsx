import { Signe } from '../design/Signe';
import styles from './BandeauHorsLigne.module.css';

interface BandeauHorsLigneProps {
  /** Heure locale du lieu affiché, format `HH:MM` (§8bis, `ecranHorsLigne()`). */
  dernierReleveHeure: string;
}

/**
 * Bandeau « hors ligne » (§8bis : « chaque écran a son état hors ligne,
 * dessiné, pas improvisé » ; mockup `ecranHorsLigne()`) : bloc plein encre/
 * papier inversé, entre le chapeau et le héros, jamais un simple texte
 * discret — l'état doit être impossible à manquer.
 */
export function BandeauHorsLigne({ dernierReleveHeure }: BandeauHorsLigneProps) {
  return (
    <div className={styles.bandeau} role="status">
      <Signe nom="hors_ligne" taille={20} />
      Hors ligne. Dernier relevé à {dernierReleveHeure}.
    </div>
  );
}
