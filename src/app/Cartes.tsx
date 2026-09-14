import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CarteSVG } from '../design/CarteSVG';
import { useCoordonneesActuelles } from '../features/meteo/useCoordonneesActuelles';
import { Chapeau } from '../ui/Chapeau';
import { Pastille } from '../ui/Pastille';
import { Pied } from '../ui/Pied';
import { Segment } from '../ui/Segment';
import styles from './Cartes.module.css';

const PLUIE_HEX = ['#BFD4E0', '#8FB4CC', '#5B8FB8', '#3B5F96', '#2B2A64'];

type Couche = 'pluie' | 'vent' | 'temperature';

/**
 * Cartes (§6, `ecranCartes()`) : précipitations quantifiées en cinq aplats.
 * Illustratif (voir `CarteSVG.tsx`) tant qu'aucune clé Foreca Maps n'est
 * disponible — le sélecteur de couche reste réel (état persistant, trois
 * options), mais affiche la même carte tant que seule la couche pluie a des
 * données de démonstration ; les deux autres l'indiquent explicitement
 * plutôt que de laisser croire à une carte différente.
 */
export function Cartes() {
  const navigate = useNavigate();
  const { nomLieu } = useCoordonneesActuelles();
  const [couche, setCouche] = useState<Couche>('pluie');

  return (
    <main>
      <Chapeau
        gauche={<Pastille icone="retour" libelle="Retour" onClick={() => navigate(-1)} />}
        titre={nomLieu}
        droite={<Pastille icone="position" libelle="Me localiser" onClick={() => navigate('/')} />}
      />
      <CarteSVG />
      <div>
        <div className={styles.couches}>
          <Segment
            options={[
              { valeur: 'pluie', libelle: 'Pluie' },
              { valeur: 'vent', libelle: 'Vent' },
              { valeur: 'temperature', libelle: 'Température' },
            ]}
            valeur={couche}
            onChange={setCouche}
          />
        </div>
        {couche === 'pluie' ? (
          <>
            <div className={styles.legende}>
              {PLUIE_HEX.map((c) => (
                <i key={c} style={{ background: c }} />
              ))}
            </div>
            <div className={styles.legendeTxt}>
              <span>bruine</span>
              <span>très forte</span>
            </div>
          </>
        ) : (
          <p className={styles.note}>
            Carte {couche === 'vent' ? 'du vent' : 'de température'} non disponible sans clé Foreca Maps — voir
            ACTIONS.md.
          </p>
        )}
      </div>
      <Pied actif="cartes" />
    </main>
  );
}
