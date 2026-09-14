/** `navigator.standalone` (iOS uniquement) — absent du DOM standard. */
interface NavigateurIos extends Navigator {
  standalone?: boolean;
}

/** L'application tourne installée (PWA), pas dans un onglet de navigateur (§7, §9, §10). */
export function estAutonome(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as NavigateurIos).standalone === true;
}

/** iPhone/iPad, quel que soit le navigateur (Safari, Chrome iOS, Firefox iOS partagent tous WebKit). */
export function estIosDispositif(): boolean {
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/** iOS et spécifiquement Safari (pas Chrome/Firefox/Edge iOS, qui partagent WebKit mais pas ce chemin d'installation). */
export function estIosSafari(): boolean {
  const ua = navigator.userAgent;
  const estSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  return estIosDispositif() && estSafari;
}
