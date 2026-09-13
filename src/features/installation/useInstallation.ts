import { useEvenementInstallationDifferee } from '../../lib/installationNavigateur';
import { useMagasinUi } from '../../lib/magasin';

/** `navigator.standalone` (iOS uniquement) — absent du DOM standard. */
interface NavigateurIos extends Navigator {
  standalone?: boolean;
}

function estAutonome(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as NavigateurIos).standalone === true;
}

/** iOS/iPadOS, hors les navigateurs qui empruntent WebKit sans être Safari (Chrome/Firefox iOS, §7). */
function estIosSafari(): boolean {
  const ua = navigator.userAgent;
  const estIos = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const estSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  return estIos && estSafari;
}

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
 * dialogue natif.
 */
export function useInstallation(): EtatInstallation {
  const evenementDiffere = useEvenementInstallationDifferee();
  const ouvertures = useMagasinUi((etat) => etat.ouvertures);
  const acquittee = useMagasinUi((etat) => etat.installationAcquittee);
  const acquitterInstallation = useMagasinUi((etat) => etat.acquitterInstallation);

  const qualifie = ouvertures >= 2 && !acquittee && !estAutonome();
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
    },
  };
}
