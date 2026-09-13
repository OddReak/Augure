import { Signe } from '../../design/Signe';
import { Paysage } from '../../design/Paysage';
import { hauteurMarcheCiel, courseSolaire } from '../../design/marche-ciel';
import { decalageDe } from '../../domain/fuseau';
import { SIGNES_METEO } from '../../domain/signes';
import type { ConditionCourante } from '../../domain/types';
import { partagerLieu } from '../../lib/partager';
import { Chapeau } from '../../ui/Chapeau';
import { Pastille } from '../../ui/Pastille';
import styles from './Hero.module.css';

interface HeroProps {
  nomLieu: string;
  condition: ConditionCourante;
  leverSoleil: string;
  coucherSoleil: string;
  onTitreClick: () => void;
  onOuvrirMenu: () => void;
  maintenant?: Date;
}

/**
 * Héros (§6, `.chapeau` + `.heros` + `paysage()`) : barre supérieure
 * collante, bloc de température, phrase, paysage. La marche de ciel suit
 * la course du soleil (§5.1, règle 3). Le titre du chapeau ouvre « Mes
 * lieux » (§8, décision : le nom du lieu est le point d'entrée vers la
 * liste, la pastille « Menu » ouvre les actions du lieu courant — voir
 * DECISIONS.md).
 */
export function Hero({
  nomLieu,
  condition,
  leverSoleil,
  coucherSoleil,
  onTitreClick,
  onOuvrirMenu,
  maintenant = new Date(),
}: HeroProps) {
  const course = courseSolaire(maintenant, leverSoleil, coucherSoleil, decalageDe(condition.horodatage));
  const hauteurCiel = hauteurMarcheCiel(course);
  const titreSigne = SIGNES_METEO[condition.signe].nom;

  return (
    <>
      <Chapeau
        collant
        gauche={<Pastille icone="partage" libelle="Partager" onClick={() => void partagerLieu(nomLieu)} />}
        titre={nomLieu}
        onTitreClick={onTitreClick}
        droite={<Pastille icone="plus" libelle="Menu" onClick={onOuvrirMenu} />}
      />
      <header className={styles.heros}>
        <div className={styles.marque}>
          <Signe nom={condition.signe} taille={96} titre={titreSigne} className={styles.grandSigne} />
          <div>
            <p className={styles.temp}>
              {Math.round(condition.temperatureC)}
              <sup>°</sup>
            </p>
            <p className={styles.ressenti}>ressenti {Math.round(condition.ressentiC)}°</p>
          </div>
        </div>
        <p className={styles.phrase}>{condition.phrase}</p>
      </header>
      <Paysage hauteurCiel={hauteurCiel} />
    </>
  );
}
