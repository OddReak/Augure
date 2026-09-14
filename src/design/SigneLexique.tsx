import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { estSigneMeteoConnu } from '../domain/symboles';
import { Signe } from './Signe';
import styles from './SigneLexique.module.css';

const DUREE_APPUI_LONG_MS = 500;

interface SigneLexiqueProps {
  nom: string;
  taille?: number;
  titre: string;
  className?: string;
}

/**
 * Signe porteur de sens dont l'appui long ouvre sa fiche dans le Lexique
 * (§5.4, règle d'accessibilité non négociable : « un signe qu'on ne sait pas
 * lire est un bug. Chaque glyphe porteur de sens est un bouton »).
 *
 * Réservé aux emplacements qui ne sont pas déjà eux-mêmes un élément
 * interactif : le glyphe du héros et celui du détail d'un jour, tous deux
 * autonomes. Les glyphes déjà imbriqués dans une ligne cliquable (sept
 * jours, vignettes de « Mes lieux », résultats de recherche) gardent un
 * `<Signe>` simple — un bouton dans un bouton casserait leur propre geste de
 * tap, voir DECISIONS.md.
 */
export function SigneLexique({ nom, taille = 24, titre, className }: SigneLexiqueProps) {
  const navigate = useNavigate();
  const minuteur = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (!estSigneMeteoConnu(nom)) {
    return <Signe nom={nom} taille={taille} titre={titre} {...(className ? { className } : {})} />;
  }

  function demarrer(): void {
    minuteur.current = setTimeout(
      () => void navigate(`/lexique/${nom}`, { viewTransition: true }),
      DUREE_APPUI_LONG_MS,
    );
  }

  function annuler(): void {
    if (minuteur.current) clearTimeout(minuteur.current);
  }

  return (
    <button
      type="button"
      className={styles.bouton}
      aria-label={`${titre} — appui long pour la fiche du Lexique`}
      onPointerDown={demarrer}
      onPointerUp={annuler}
      onPointerLeave={annuler}
      onContextMenu={(e) => e.preventDefault()}
    >
      <Signe nom={nom} taille={taille} titre={titre} {...(className ? { className } : {})} />
    </button>
  );
}
