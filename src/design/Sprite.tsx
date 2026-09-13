import spriteSvg from './signes.svg?raw';

/**
 * Injecte une fois le sprite `signes.svg` dans le document. Les composants
 * `<Signe>` y référencent leurs symboles via `<use href="#signe-...">`.
 * Monté une seule fois à la racine de l'application (`app/Layout.tsx`).
 */
export function Sprite() {
  // Contenu statique généré depuis le mockup (build-time), aucune entrée utilisateur.
  return <div style={{ display: 'none' }} aria-hidden="true" dangerouslySetInnerHTML={{ __html: spriteSvg }} />;
}
