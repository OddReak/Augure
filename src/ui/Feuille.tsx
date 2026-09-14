import { useState, type ReactNode } from 'react';
import styles from './Feuille.module.css';

/** Doit correspondre à la durée de `@keyframes glisserFeuille` dans `Feuille.module.css`. */
const DUREE_FERMETURE_MS = 220;

interface FeuilleProps {
  titre: string;
  description?: string;
  /**
   * Un nœud simple, ou une fonction recevant `fermerAnime` — à appeler avec
   * l'action réelle de fermeture propre au bouton (§11, post-livraison :
   * chaque fermeture se joue avant de disparaître, pas seulement celle
   * déclenchée par le voile).
   */
  children?: ReactNode | ((fermerAnime: (apres?: () => void) => void) => ReactNode);
  onFermer: () => void;
}

/**
 * Feuille (§6, `.feuille`) : panneau ancré en bas, voile en trame dense
 * (§5.5, « un scrim en demi-teinte plutôt qu'un noir translucide »).
 *
 * Glisse depuis le bas à l'apparition, se réenfonce avant de disparaître
 * (§11, post-livraison — « fluidifier la navigation ») : `fermerAnime` joue
 * l'animation inverse puis appelle la vraie fermeture (`onFermer` par
 * défaut, ou l'action précise passée par l'appelant — « Plus tard » et
 * « J'ai compris », par exemple, ne ferment pas de la même façon). Sous
 * `prefers-reduced-motion: reduce`, la fermeture est immédiate — jamais un
 * délai artificiel quand aucune animation ne le justifie.
 */
export function Feuille({ titre, description, children, onFermer }: FeuilleProps) {
  const [enFermeture, setEnFermeture] = useState(false);

  function fermerAnime(apres: () => void = onFermer): void {
    if (enFermeture) return;
    const reduit = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduit) {
      apres();
      return;
    }
    setEnFermeture(true);
    window.setTimeout(apres, DUREE_FERMETURE_MS);
  }

  const classeVoile = [styles.voile, 'trame', enFermeture ? styles.fermeture : ''].filter(Boolean).join(' ');
  const classeFeuille = [styles.feuille, enFermeture ? styles.fermeture : ''].filter(Boolean).join(' ');

  return (
    <div role="dialog" aria-modal="true" aria-label={titre} className={styles.dialogue}>
      <div className={classeVoile} onClick={() => fermerAnime()} aria-hidden="true" />
      <div className={classeFeuille}>
        <h4>{titre}</h4>
        {description ? <p className="selectionnable">{description}</p> : null}
        {typeof children === 'function' ? children(fermerAnime) : children}
      </div>
    </div>
  );
}
