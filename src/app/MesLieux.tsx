import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Signe } from '../design/Signe';
import type { Lieu } from '../domain/types';
import { VignetteLieu } from '../features/lieux/VignetteLieu';
import { cleLieu, useMagasinUi } from '../lib/magasin';
import { POSITION_PAR_DEFAUT } from '../lib/position';
import { usePosition } from '../lib/usePosition';
import { Chapeau } from '../ui/Chapeau';
import { Pastille } from '../ui/Pastille';
import styles from './MesLieux.module.css';

/**
 * Mes lieux (§6, `ecranLieux()`) : « chaque vignette est peinte dans le
 * palier de sa météo réelle ». La position live vient toujours en tête,
 * suivie des lieux enregistrés (persistés, survivent à un rechargement).
 *
 * Réorganisation sans glisser-déposer (§8, décision, voir DECISIONS.md) :
 * la pastille « Réorganiser » du chapeau bascule un mode dans lequel chaque
 * vignette expose Monter / Descendre / Retirer plutôt que de naviguer.
 *
 * Chapeau réagencé (§11, post-livraison — retrait de la barre de navigation
 * basse, DECISIONS.md) : « Retour » prend la place gauche qu'occupait
 * « Réorganiser » (déplacée à droite), la pastille « Ajouter » est retirée —
 * le bouton « Ajouter un lieu » en bas de liste reste l'unique entrée,
 * comme demandé par l'utilisateur pour la recherche.
 */
export function MesLieux() {
  const navigate = useNavigate();
  const position = usePosition();
  const lieuxEnregistres = useMagasinUi((etat) => etat.lieuxEnregistres);
  const deplacerLieu = useMagasinUi((etat) => etat.deplacerLieu);
  const retirerLieu = useMagasinUi((etat) => etat.retirerLieu);
  const definirLieuActif = useMagasinUi((etat) => etat.definirLieuActif);
  const [enReorganisation, setEnReorganisation] = useState(false);

  const lieuPosition: Lieu = {
    nom: position ? 'Votre position' : 'Cestas',
    coordonnees: position?.coordonnees ?? POSITION_PAR_DEFAUT,
  };

  function choisir(lieu: Lieu | null): void {
    definirLieuActif(lieu);
    navigate('/');
  }

  return (
    <main>
      <Chapeau
        gauche={<Pastille icone="retour" libelle="Retour" onClick={() => navigate(-1)} />}
        titre="Mes lieux"
        droite={
          <Pastille
            icone="poignee"
            libelle={enReorganisation ? 'Terminer la réorganisation' : 'Réorganiser'}
            plein={enReorganisation}
            onClick={() => setEnReorganisation((v) => !v)}
          />
        }
      />
      <div className={styles.liste}>
        <VignetteLieu
          lieu={lieuPosition}
          estPosition
          onChoisir={() => choisir(null)}
          {...(!position ? { sousTitre: 'position par défaut' } : {})}
        />
        {lieuxEnregistres.map((lieu, index) => (
          <VignetteLieu
            key={cleLieu(lieu)}
            lieu={lieu}
            onChoisir={() => choisir(lieu)}
            {...(lieu.region ? { sousTitre: lieu.region } : {})}
            {...(enReorganisation
              ? {
                  reorganisation: {
                    ...(index > 0 ? { onMonter: () => deplacerLieu(index, -1) } : {}),
                    ...(index < lieuxEnregistres.length - 1 ? { onDescendre: () => deplacerLieu(index, 1) } : {}),
                    onSupprimer: () => retirerLieu(cleLieu(lieu)),
                  },
                }
              : {})}
          />
        ))}
      </div>
      <button type="button" className={styles.ajouter} onClick={() => navigate('/recherche')}>
        <Signe nom="ajout" />
        Ajouter un lieu
      </button>
    </main>
  );
}
