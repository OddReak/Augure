import { useRegisterSW } from 'virtual:pwa-register/react';
import styles from './RegistreurPwa.module.css';

/**
 * Service worker (§3, §9) : enregistré ici, depuis React, jamais par un
 * script auto-injecté dans `index.html` (`injectRegister: false`, voir
 * `vite.config.ts`) — pour garantir qu'il ne s'enregistre qu'après le
 * démarrage de MSW en mode `VITE_MOCK` (voir DECISIONS.md, « deux service
 * workers, un seul actif »).
 *
 * `registerType: 'prompt'` (§3, §9 : jamais de `skipWaiting()` inconditionnel) :
 * une nouvelle version reste `waiting` tant que l'utilisateur n'a pas
 * explicitement cliqué « Mettre à jour ». Sans ce bandeau, une mise à jour
 * `prompt` resterait installée sans jamais prendre effet — l'exigence des
 * interdits (§9) ne vaut que si ce déclencheur existe quelque part.
 */
export function RegistreurPwa() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div className={styles.bandeau} role="status">
      <span>Nouvelle version d&rsquo;Augure disponible.</span>
      <button type="button" className={styles.bouton} onClick={() => void updateServiceWorker(true)}>
        Mettre à jour
      </button>
    </div>
  );
}
