import { Signe } from '../../design/Signe';
import type { Lieu } from '../../domain/types';
import { useTemperatureActuelle } from './useTemperatureActuelle';
import styles from '../../app/Recherche.module.css';

interface ResultatRechercheProps {
  lieu: Lieu;
  onChoisir: () => void;
}

/** Une ligne de résultat (§6, `.resultat`) : température déjà affichée, lève l'ambiguïté des homonymes. */
export function ResultatRecherche({ lieu, onChoisir }: ResultatRechercheProps) {
  const temperature = useTemperatureActuelle(lieu.coordonnees);

  return (
    <button type="button" className={styles.resultat} onClick={onChoisir}>
      <div>
        <div className={styles.nom}>{lieu.nom}</div>
        {lieu.region ? <div className={styles.region}>{lieu.region}</div> : null}
      </div>
      {temperature.data ? <Signe nom={temperature.data.signe} taille={24} /> : <span />}
      <span className={styles.temp}>{temperature.data ? `${Math.round(temperature.data.temperatureC)}°` : '--'}</span>
    </button>
  );
}
