import { useNavigate } from 'react-router-dom';
import { Signe } from '../design/Signe';
import { IDS_SIGNES_METEO, SIGNES_METEO } from '../domain/signes';
import { Chapeau } from '../ui/Chapeau';
import { Etiquette } from '../ui/Etiquette';
import { Pastille } from '../ui/Pastille';
import styles from './Lexique.module.css';

/**
 * Lexique (§6, `ecranLexique()`) : « le carnet du joueur ». Les seize
 * signes météo, chacun menant à sa fiche (§5.4, règle d'accessibilité non
 * négociable). Le filtre par primitive de tracé du mockup (Disque / Barre /
 * Chevron / Point) n'est pas repris : le document maître ne classe aucun
 * des seize signes par primitive, et en inventer une classification serait
 * moins honnête que de l'omettre (§0, décision documentée dans
 * DECISIONS.md) — la liste complète reste browsable et cherchable telle quelle.
 *
 * Ouvert depuis le menu du lieu (§11, post-livraison — la barre de
 * navigation basse a été retirée à la demande de l'utilisateur, voir
 * DECISIONS.md) : son propre bouton retour remplace ce que la barre offrait.
 */
export function Lexique() {
  const navigate = useNavigate();

  return (
    <main>
      <Chapeau gauche={<Pastille icone="retour" libelle="Retour" onClick={() => navigate(-1)} />} titre="Lexique" />
      <div>
        <Etiquette
          glyphe={<Signe nom="lexique" taille={17} />}
          titre="Signes météo"
          note={String(IDS_SIGNES_METEO.length)}
        />
        <div className={styles.grille}>
          {IDS_SIGNES_METEO.map((id) => {
            const signe = SIGNES_METEO[id];
            return (
              <button type="button" key={id} className={styles.signe} onClick={() => navigate(`/lexique/${id}`)}>
                <Signe nom={id} />
                <b>{signe.nom}</b>
                <span>{signe.translit}</span>
              </button>
            );
          })}
        </div>
      </div>
    </main>
  );
}
