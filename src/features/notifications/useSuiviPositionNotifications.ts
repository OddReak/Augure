import { useEffect } from 'react';
import type { LieuAbonnement } from '../../lib/push';
import { POSITION_PAR_DEFAUT } from '../../lib/position';
import { clePositionNotifiee, fuseauNavigateur, positionNotifiee } from '../../lib/positionNotifiee';
import type { EtatPosition } from '../../lib/usePosition';

/**
 * Lieu de la notification quotidienne (§10) : toujours la position actuelle
 * de l'appareil (chaîne du §7), jamais un lieu choisi dans le menu — la
 * prévision de 7 h est celle de l'endroit où l'on se réveille. Sans nom
 * connu (aucun géocodage inverse, §8) : `nomLieu` null, sauf pour le repli
 * par défaut, seul cas où le nom est certain.
 */
export function lieuNotifie(position: EtatPosition | null): LieuAbonnement {
  if (!position) return { ...POSITION_PAR_DEFAUT, nomLieu: 'Cestas' };
  return { ...position.coordonnees, nomLieu: null };
}

/**
 * Tient à jour la position enregistrée pour la notification quotidienne
 * quand l'appareil a changé de case de grille (ou de fuseau) depuis le
 * dernier enregistrement. Lecture seule tant que rien n'a bougé : aucune
 * permission demandée (§9), et `push.ts` (donc `@supabase/supabase-js`)
 * n'est chargé qu'au moment d'une mise à jour réelle, jamais au premier
 * rendu de l'accueil (§11, budget du bundle initial).
 */
export function useSuiviPositionNotifications(position: EtatPosition | null): void {
  const latitude = position?.coordonnees.latitude;
  const longitude = position?.coordonnees.longitude;

  useEffect(() => {
    if (latitude === undefined || longitude === undefined) return;
    if (clePositionNotifiee(latitude, longitude, fuseauNavigateur()) === positionNotifiee()) return;
    if (!navigator.serviceWorker || !window.PushManager) return;

    let annule = false;
    void (async () => {
      try {
        const inscription = await navigator.serviceWorker.getRegistration();
        const abonnement = await inscription?.pushManager.getSubscription();
        if (!abonnement || annule) return;
        const { mettreAJourPositionNotifications } = await import('../../lib/push');
        if (annule) return;
        await mettreAJourPositionNotifications({ latitude, longitude, nomLieu: null });
      } catch {
        // Hors ligne ou Supabase injoignable : la position précédente reste enregistrée,
        // la prochaine ouverture retentera puisque la position mémorisée n'a pas changé.
      }
    })();

    return () => {
      annule = true;
    };
  }, [latitude, longitude]);
}
