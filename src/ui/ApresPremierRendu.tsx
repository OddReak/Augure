import { useEffect, useState, type ReactNode } from 'react';

interface ApresPremierRenduProps {
  children: ReactNode;
}

/**
 * §11 : budget de performance (premier rendu utile sous 1,2 s). Rend `null`
 * le temps du tout premier commit, puis ses enfants dès la frame suivante.
 *
 * Nécessaire même quand les enfants sont eux-mêmes des composants chargés à
 * la demande (`React.lazy`, voir `Accueil.tsx`) : les évaluer dans le
 * *même* rendu que le Héros déclenche leurs imports dynamiques (et le
 * travail de React qui les accompagne) avant que le Héros lui-même n'ait pu
 * être peint — mesuré, pas supposé (le premier rendu utile reculait de
 * ~200 ms sous CPU ralenti en les laissant dans le même commit). Ce
 * composant garantit que le tout premier commit ne contient que ce qui
 * précède ses enfants dans l'arbre.
 */
export function ApresPremierRendu({ children }: ApresPremierRenduProps) {
  const [pret, setPret] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setPret(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return pret ? children : null;
}
