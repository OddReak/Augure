import { useEffect, useState } from 'react';
import type { CoordonneesGeo } from '../domain/types';
import { positionAffinee, positionInitiale, type SourcePosition } from './position';

export interface EtatPosition {
  coordonnees: CoordonneesGeo;
  source: SourcePosition;
}

/**
 * Position de l'utilisateur, résolue par la chaîne de repli du §7 sans
 * jamais bloquer le premier rendu ni ouvrir de dialogue avant lui.
 * `positionInitiale()` (stockage puis IP) s'exécute tout de suite ;
 * `positionAffinee()` (GPS, seulement si déjà autorisé ou pas encore
 * demandé) est différée à la frame suivante, comme l'exige § 7 : « jamais
 * l'inverse ». `null` tant qu'aucune source n'a répondu — l'appelant garde
 * alors sa position par défaut.
 */
export function usePosition(): EtatPosition | null {
  const [etat, setEtat] = useState<EtatPosition | null>(null);

  useEffect(() => {
    let annule = false;

    positionInitiale().then((resolue) => {
      if (!annule && resolue) setEtat(resolue);
    });

    const idFrame = requestAnimationFrame(() => {
      if (annule) return;
      positionAffinee().then((resolue) => {
        if (!annule && resolue) setEtat(resolue);
      });
    });

    return () => {
      annule = true;
      cancelAnimationFrame(idFrame);
    };
  }, []);

  return etat;
}
