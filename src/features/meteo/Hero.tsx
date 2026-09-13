import { Signe } from '../../design/Signe';
import { Paysage } from '../../design/Paysage';
import { hauteurMarcheCiel, courseSolaire } from '../../design/marche-ciel';
import { decalageDe } from '../../domain/fuseau';
import { SIGNES_METEO } from '../../domain/signes';
import type { ConditionCourante } from '../../domain/types';
import styles from './Hero.module.css';

interface HeroProps {
  nomLieu: string;
  condition: ConditionCourante;
  leverSoleil: string;
  coucherSoleil: string;
  maintenant?: Date;
}

/**
 * Héros (§6, `.chapeau` + `.heros` + `paysage()`) : barre supérieure
 * collante, bloc de température, phrase, paysage. La marche de ciel suit
 * la course du soleil (§5.1, règle 3).
 */
export function Hero({ nomLieu, condition, leverSoleil, coucherSoleil, maintenant = new Date() }: HeroProps) {
  const course = courseSolaire(maintenant, leverSoleil, coucherSoleil, decalageDe(condition.horodatage));
  const hauteurCiel = hauteurMarcheCiel(course);
  const titreSigne = SIGNES_METEO[condition.signe].nom;

  return (
    <>
      <div className={styles.chapeau}>
        <span className={styles.lieu}>{nomLieu}</span>
      </div>
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
