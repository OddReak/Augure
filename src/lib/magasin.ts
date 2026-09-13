import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Palier } from '../domain/types';

interface EtatUi {
  palierForce: Palier | null;
  forcerPalier: (palier: Palier | null) => void;
}

/**
 * État UI, un seul store (§3). Ne contient que des préférences d'interface —
 * les lieux favoris et les données météo vivent ailleurs (localStorage /
 * IndexedDB dédiés). `palierForce` sert uniquement au styleguide pour
 * prévisualiser un palier sans dépendre de la météo réelle.
 */
export const useMagasinUi = create<EtatUi>()(
  persist(
    (set) => ({
      palierForce: null,
      forcerPalier: (palier) => set({ palierForce: palier }),
    }),
    { name: 'augure-ui' },
  ),
);
