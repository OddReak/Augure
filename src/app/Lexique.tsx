import { useNavigate } from 'react-router-dom';
import { Signe } from '../design/Signe';
import { IDS_SIGNES_METEO, SIGNES_METEO } from '../domain/signes';
import { Etiquette } from '../ui/Etiquette';
import { Pied } from '../ui/Pied';
import styles from './Lexique.module.css';

/**
 * Lexique (§6, `ecranLexique()`) : « le carnet du joueur ». Les seize
 * signes météo, chacun menant à sa fiche (§5.4, règle d'accessibilité non
 * négociable). Le filtre par primitive de tracé du mockup (Disque / Barre /
 * Chevron / Point) n'est pas repris : le document maître ne classe aucun
 * des seize signes par primitive, et en inventer une classification serait
 * moins honnête que de l'omettre (§0, décision documentée dans
 * DECISIONS.md) — la liste complète reste browsable et cherchable telle quelle.
 */
export function Lexique() {
  const navigate = useNavigate();

  return (
    <main>
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
      <Pied actif="lexique" />
    </main>
  );
}
