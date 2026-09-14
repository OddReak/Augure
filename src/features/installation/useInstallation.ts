import { useEvenementInstallationDifferee } from '../../lib/installationNavigateur';
import { useMagasinUi } from '../../lib/magasin';
import { estAutonome, estIosSafari } from '../../lib/plateforme';

interface EtatInstallation {
  /** `null` : rien à proposer (déjà installé, ni iOS Safari ni `beforeinstallprompt`, ou trop tôt). */
  plateforme: 'ios' | 'android' | null;
  /** Android/Chrome seulement : déclenche le dialogue natif. */
  installer: () => Promise<void>;
  /** `definitif` : « J'ai compris », ne plus jamais proposer. Sinon « Plus tard », revient à la prochaine ouverture qualifiante. */
  fermer: (definitif: boolean) => void;
}

/**
 * Feuille d'installation (§7, §9, mockup `feuilleInstall()`) : jamais à la
 * première ouverture, jamais si déjà installé. iOS n'expose pas
 * `beforeinstallprompt` — seul un guide manuel (Partager → Sur l'écran
 * d'accueil) est possible ; Chrome/Android expose l'événement et son propre
 * dialogue natif. `installationForcee` (§10) : Réglages → Alerte
 * quotidienne l'ouvre aussi hors de la fenêtre des deux/trois premières
 * ouvertures, quand le Web Push exige d'abord l'installation.
 */
export function useInstallation(): EtatInstallation {
  const evenementDiffere = useEvenementInstallationDifferee();
  const ouvertures = useMagasinUi((etat) => etat.ouvertures);
  const acquittee = useMagasinUi((etat) => etat.installationAcquittee);
  const acquitterInstallation = useMagasinUi((etat) => etat.acquitterInstallation);
  const installationForcee = useMagasinUi((etat) => etat.installationForcee);
  const relacherInstallationForcee = useMagasinUi((etat) => etat.relacherInstallationForcee);

  const qualifie = (ouvertures >= 2 || installationForcee) && !acquittee && !estAutonome();
  const plateforme = !qualifie ? null : evenementDiffere ? 'android' : estIosSafari() ? 'ios' : null;

  return {
    plateforme,
    installer: async () => {
      if (!evenementDiffere) return;
      await evenementDiffere.prompt();
      const { outcome } = await evenementDiffere.userChoice;
      if (outcome === 'accepted') acquitterInstallation();
    },
    fermer: (definitif) => {
      if (definitif) acquitterInstallation();
      relacherInstallationForcee();
    },
  };
}
