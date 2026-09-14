import { useState } from 'react';
import { Signe } from '../../design/Signe';
import { Feuille } from '../../ui/Feuille';
import { useInstallation } from './useInstallation';
import styles from './FeuilleInstallation.module.css';

/**
 * Feuille d'installation (§7, §9, mockup `feuilleInstall()`) : montée une
 * fois à la racine (`Layout.tsx`), pas par écran — elle n'est liée à aucun
 * lieu ni aucune route. `masquee` est un état de session, volontairement pas
 * persisté : « Plus tard » revient à la prochaine ouverture qualifiante,
 * seul « J'ai compris » (`installationAcquittee`, persisté) l'écarte pour de bon.
 */
export function FeuilleInstallation() {
  const { plateforme, installer, fermer } = useInstallation();
  const [masquee, setMasquee] = useState(false);

  if (!plateforme || masquee) return null;

  function fermerEtMasquer(definitif: boolean): void {
    fermer(definitif);
    setMasquee(true);
  }

  return (
    <Feuille
      titre="Installer Augure"
      description="Deux gestes, et Augure s’ouvre depuis votre écran d’accueil, hors ligne et sans barre de navigateur."
      onFermer={() => fermerEtMasquer(false)}
    >
      {(fermerAnime) => (
        <>
          {plateforme === 'ios' ? (
            <ul className={styles.etapes}>
              <li>
                <Signe nom="partage" />
                <div>
                  <b>Touchez Partager</b>
                </div>
              </li>
              <li>
                <Signe nom="ajout" />
                <div>
                  <b>Puis « Sur l&rsquo;écran d&rsquo;accueil »</b>
                </div>
              </li>
            </ul>
          ) : null}

          {plateforme === 'android' ? (
            <button
              type="button"
              className={styles.principal}
              onClick={() => {
                void installer().then(() => fermerAnime(() => fermerEtMasquer(false)));
              }}
            >
              Installer
            </button>
          ) : (
            <button type="button" className={styles.principal} onClick={() => fermerAnime(() => fermerEtMasquer(true))}>
              J&rsquo;ai compris
            </button>
          )}
          <button type="button" className={styles.secondaire} onClick={() => fermerAnime(() => fermerEtMasquer(false))}>
            Plus tard
          </button>
        </>
      )}
    </Feuille>
  );
}
