import { Link } from 'react-router-dom';
import { Signe } from '../design/Signe';
import styles from './Pied.module.css';

export type OngletPied = 'ciel' | 'cartes' | 'lexique' | '';

interface PiedProps {
  /** Onglet courant, ou `''` si aucun des trois ne correspond (§6, `nav('')` de la recherche). */
  actif: OngletPied;
}

/**
 * Navigation basse (§6, `nav()`) : trois destinations seulement — Ciel,
 * Cartes, Lexique — plus un accès direct à la recherche. « Mes lieux » et
 * « Réglages » ne sont pas des onglets : on y accède depuis le chapeau de
 * l'accueil (§8, décision documentée dans DECISIONS.md).
 */
export function Pied({ actif }: PiedProps) {
  return (
    <nav className={styles.pied}>
      <Link to="/" aria-current={actif === 'ciel' ? 'page' : undefined}>
        <Signe nom="ciel" />
        Ciel
      </Link>
      <Link to="/cartes" aria-current={actif === 'cartes' ? 'page' : undefined}>
        <Signe nom="carte" />
        Cartes
      </Link>
      <Link to="/lexique" aria-current={actif === 'lexique' ? 'page' : undefined}>
        <Signe nom="lexique" />
        Lexique
      </Link>
      <Link to="/recherche" aria-label="Rechercher">
        <Signe nom="loupe" />
      </Link>
    </nav>
  );
}
