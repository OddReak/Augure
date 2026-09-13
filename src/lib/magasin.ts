import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Lieu, Palier } from '../domain/types';

/** Identité stable d'un lieu enregistré : deux lieux à la même case de grille sont le même lieu (§4.1). */
export function cleLieu(lieu: Lieu): string {
  return `${lieu.coordonnees.latitude.toFixed(2)},${lieu.coordonnees.longitude.toFixed(2)}`;
}

interface EtatUi {
  palierForce: Palier | null;
  forcerPalier: (palier: Palier | null) => void;
  /** Palier dérivé de la dernière condition météo reçue (phase 4+). */
  palierMeteo: Palier | null;
  definirPalierMeteo: (palier: Palier | null) => void;

  /** Lieux enregistrés par l'utilisateur (§6, écran « Mes lieux »), persistés — survivent à un rechargement. */
  lieuxEnregistres: Lieu[];
  ajouterLieu: (lieu: Lieu) => void;
  retirerLieu: (cle: string) => void;
  deplacerLieu: (index: number, direction: -1 | 1) => void;

  /**
   * Lieu explicitement choisi par l'utilisateur (menu de lieu, phase 8) —
   * prime sur la position résolue par la chaîne du §7. `null` : l'accueil
   * suit la position live.
   */
  lieuActif: Lieu | null;
  definirLieuActif: (lieu: Lieu | null) => void;
}

/**
 * État UI, un seul store (§3). Ne contient que des préférences d'interface et
 * les lieux favoris (petites listes, à leur place dans `localStorage` — les
 * données météo elles-mêmes vivent dans le cache IndexedDB de TanStack Query).
 */
export const useMagasinUi = create<EtatUi>()(
  persist(
    (set) => ({
      palierForce: null,
      forcerPalier: (palier) => set({ palierForce: palier }),
      palierMeteo: null,
      definirPalierMeteo: (palier) => set({ palierMeteo: palier }),

      lieuxEnregistres: [],
      ajouterLieu: (lieu) =>
        set((etat) =>
          etat.lieuxEnregistres.some((l) => cleLieu(l) === cleLieu(lieu))
            ? etat
            : { lieuxEnregistres: [...etat.lieuxEnregistres, lieu] },
        ),
      retirerLieu: (cle) =>
        set((etat) => ({ lieuxEnregistres: etat.lieuxEnregistres.filter((l) => cleLieu(l) !== cle) })),
      deplacerLieu: (index, direction) =>
        set((etat) => {
          const cible = index + direction;
          if (cible < 0 || cible >= etat.lieuxEnregistres.length) return etat;
          const copie = [...etat.lieuxEnregistres];
          const tmp = copie[index]!;
          copie[index] = copie[cible]!;
          copie[cible] = tmp;
          return { lieuxEnregistres: copie };
        }),

      lieuActif: null,
      definirLieuActif: (lieu) => set({ lieuActif: lieu }),
    }),
    { name: 'augure-ui' },
  ),
);
