import { useNavigate } from 'react-router-dom';
import { Signe } from '../../design/Signe';
import type { Lieu } from '../../domain/types';
import { cleLieu, useMagasinUi } from '../../lib/magasin';
import { partagerLieu } from '../../lib/partager';
import { Feuille } from '../../ui/Feuille';
import styles from './MenuLieu.module.css';

interface MenuLieuProps {
  lieu: Lieu;
  onFermer: () => void;
}

/**
 * Menu du lieu (§6, `ecranMenu()`) : feuille basse, pas de menu déroulant.
 * Ouverte depuis la pastille « Menu » du chapeau (§8, décision : le titre du
 * chapeau ouvre « Mes lieux », cette pastille ouvre les actions du lieu
 * affiché — voir DECISIONS.md).
 */
export function MenuLieu({ lieu, onFermer }: MenuLieuProps) {
  const navigate = useNavigate();
  const lieuxEnregistres = useMagasinUi((etat) => etat.lieuxEnregistres);
  const ajouterLieu = useMagasinUi((etat) => etat.ajouterLieu);
  const retirerLieu = useMagasinUi((etat) => etat.retirerLieu);
  const dejaEnregistre = lieuxEnregistres.some((l) => cleLieu(l) === cleLieu(lieu));

  function allerA(chemin: string): void {
    onFermer();
    navigate(chemin);
  }

  return (
    <Feuille
      titre={lieu.nom}
      description={`${lieu.coordonnees.latitude.toFixed(2)} · ${lieu.coordonnees.longitude.toFixed(2)}`}
      onFermer={onFermer}
    >
      <button
        type="button"
        className={styles.item}
        onClick={() => (dejaEnregistre ? retirerLieu(cleLieu(lieu)) : ajouterLieu(lieu))}
      >
        <Signe nom={dejaEnregistre ? 'croix' : 'ajout'} />
        {dejaEnregistre ? 'Retirer de mes lieux' : 'Ajouter à mes lieux'}
      </button>
      <button type="button" className={styles.item} onClick={() => void partagerLieu(lieu.nom)}>
        <Signe nom="partage" />
        Partager ce lieu
      </button>
      {/* §11, post-livraison : le Lexique n'est plus un onglet de la barre de navigation basse,
          retirée à la demande de l'utilisateur (DECISIONS.md) — ce menu en devient l'accès. */}
      <button type="button" className={styles.item} onClick={() => allerA('/lexique')}>
        <Signe nom="lexique" />
        Lexique des signes
      </button>
      <button type="button" className={styles.item} onClick={() => allerA('/reglages')}>
        <Signe nom="unite" />
        Unités
        <span className={styles.apres}>°C · km/h</span>
      </button>
      <button type="button" className={styles.item} onClick={() => allerA('/reglages')}>
        <Signe nom="cloche" />
        Alerte quotidienne
        <span className={styles.apres}>7:00</span>
      </button>
      <button type="button" className={styles.item} onClick={() => allerA('/reglages')}>
        <Signe nom="reglages" />
        Réglages
      </button>
      <button type="button" className={styles.bouton} onClick={onFermer}>
        Fermer
      </button>
    </Feuille>
  );
}
