import { useNavigate, useParams } from 'react-router-dom';
import { Signe } from '../design/Signe';
import { FICHES_SIGNES } from '../domain/lexique';
import { SIGNES_METEO } from '../domain/signes';
import { estSigneMeteoConnu } from '../domain/symboles';
import { partagerLieu } from '../lib/partager';
import { Chapeau } from '../ui/Chapeau';
import { Pastille } from '../ui/Pastille';
import styles from './FicheSigne.module.css';

/**
 * Fiche d'un signe (§6, `ficheSigne()`) : décomposition et seuils de
 * déclenchement, ouverte depuis le Lexique (§5.4, règle d'accessibilité :
 * « un signe qu'on ne sait pas lire est un bug »).
 */
export function FicheSigne() {
  const navigate = useNavigate();
  const { signe: idParam = '' } = useParams<{ signe: string }>();

  if (!estSigneMeteoConnu(idParam)) {
    return (
      <main>
        <Chapeau gauche={<Pastille icone="retour" libelle="Retour" onClick={() => navigate(-1)} />} titre="Signe" />
        <p className={styles.fiche}>Ce signe n&rsquo;existe pas. Retournez au Lexique.</p>
      </main>
    );
  }

  const signe = SIGNES_METEO[idParam];
  const fiche = FICHES_SIGNES[idParam];

  return (
    <main>
      <Chapeau
        gauche={<Pastille icone="retour" libelle="Retour" onClick={() => navigate(-1)} />}
        titre="Signe"
        droite={<Pastille icone="partage" libelle="Partager" onClick={() => void partagerLieu(signe.nom)} />}
      />
      <div className={styles.fiche}>
        <Signe nom={idParam} titre={signe.nom} />
        <h3>{signe.nom}</h3>
        <div className={styles.translit}>{signe.translit}</div>
        {signe.composeDe ? (
          <div className={styles.decompo}>
            <Signe nom={signe.composeDe[0]} titre={SIGNES_METEO[signe.composeDe[0]].nom} />
            <span className={styles.op}>+</span>
            <Signe nom={signe.composeDe[1]} titre={SIGNES_METEO[signe.composeDe[1]].nom} />
            <span className={styles.op}>=</span>
            <Signe nom={idParam} titre={signe.nom} />
          </div>
        ) : null}
        <p>{fiche.description}</p>
        <ul className={styles.seuils}>
          {fiche.seuils.map(([label, valeur]) => (
            <li key={label}>
              <span>{label}</span>
              <b>{valeur}</b>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
