import { useSyncExternalStore } from 'react';

/**
 * `beforeinstallprompt` (Chrome/Android, §7) : Safari n'expose pas cet
 * événement (iOS a son propre chemin, `feuilleInstallation.ts`). Capturé au
 * niveau module, en dehors de React, parce qu'il peut se déclencher à
 * n'importe quel moment après le chargement — avant même le premier rendu —
 * et que l'objet événement lui-même (porteur de `prompt()`) n'a pas sa place
 * dans le store Zustand persisté (non sérialisable, et il ne doit jamais
 * atteindre `localStorage`).
 */
interface EvenementInstallationDifferee extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let evenementDiffere: EvenementInstallationDifferee | null = null;
const abonnes = new Set<() => void>();

function notifier(): void {
  abonnes.forEach((rappel) => rappel());
}

/** À appeler une fois, tôt (`main.tsx`), avant le premier rendu. */
export function ecouterInstallationDifferee(): void {
  window.addEventListener('beforeinstallprompt', (evenement) => {
    evenement.preventDefault();
    evenementDiffere = evenement as EvenementInstallationDifferee;
    notifier();
  });
  window.addEventListener('appinstalled', () => {
    evenementDiffere = null;
    notifier();
  });
}

/** L'événement différé, ou `null` s'il n'y en a pas (déjà installé, iOS, navigateur non supporté…). */
export function useEvenementInstallationDifferee(): EvenementInstallationDifferee | null {
  return useSyncExternalStore(
    (rappel) => {
      abonnes.add(rappel);
      return () => abonnes.delete(rappel);
    },
    () => evenementDiffere,
    () => null,
  );
}
