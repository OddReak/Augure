interface SigneProps {
  /** Identifiant du symbole dans `signes.svg` (sans le préfixe `signe-`). */
  nom: string;
  taille?: number;
  /** Glyphe purement décoratif (aria-hidden) ou porteur de sens (rôle image + libellé). */
  titre?: string;
  className?: string;
}

/**
 * Signe (§5.4) : quatre primitives (disque, barre, chevron, point), monochrome
 * en `currentColor`. Référence le sprite `signes.svg` sans jamais redessiner
 * les tracés. Un signe sans `titre` est décoratif ; un signe porteur de sens
 * fournit `titre` et devient identifiable par les technologies d'assistance —
 * l'appui long qui ouvre sa fiche dans le Lexique arrive en phase 8.
 */
export function Signe({ nom, taille = 24, titre, className }: SigneProps) {
  return (
    <svg
      width={taille}
      height={taille}
      viewBox="0 0 24 24"
      className={className}
      role={titre ? 'img' : undefined}
      aria-label={titre}
      aria-hidden={titre ? undefined : 'true'}
    >
      <use href={`#signe-${nom}`} />
    </svg>
  );
}
