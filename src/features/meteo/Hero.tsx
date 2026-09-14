import { useState } from 'react';
import { Paysage } from '../../design/Paysage';
import { SigneLexique } from '../../design/SigneLexique';
import { hauteurMarcheCiel, courseSolaire } from '../../design/marche-ciel';
import { ageEnTexte, decalageDe, versHeureLocale } from '../../domain/fuseau';
import { SIGNES_METEO } from '../../domain/signes';
import type { ConditionCourante } from '../../domain/types';
import { lancementAJouer } from '../../lib/lancement';
import { partagerLieu } from '../../lib/partager';
import { BandeauHorsLigne } from '../../ui/BandeauHorsLigne';
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
  /** §8bis : bandeau plein écran remplaçant le sous-titre du chapeau, navigateur hors ligne. */
  horsLigne?: boolean;
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
  horsLigne = false,
}: HeroProps) {
  const decalage = decalageDe(condition.horodatage);
  const course = courseSolaire(maintenant, leverSoleil, coucherSoleil, decalage);
  const hauteurCiel = hauteurMarcheCiel(course);
  const titreSigne = SIGNES_METEO[condition.signe].nom;
  // §7 : le mouvement orchestré ne joue qu'une fois, au vrai lancement de
  // l'application — jamais à un remontage du Héros en cours de session
  // (retour d'un écran secondaire, changement de palier). `lancementAJouer()`
  // ne répond `true` qu'à son tout premier appel dans la vie du module.
  const [animerLancement] = useState(lancementAJouer);

  return (
    <>
      <Chapeau
        collant
        gauche={<Pastille icone="partage" libelle="Partager" onClick={() => void partagerLieu(nomLieu)} />}
        titre={nomLieu}
        {...(horsLigne ? { sousTitre: `données d’il y a ${ageEnTexte(condition.horodatage, maintenant)}` } : {})}
        onTitreClick={onTitreClick}
        droite={<Pastille icone="plus" libelle="Menu" onClick={onOuvrirMenu} />}
      />
      {horsLigne ? (
        <BandeauHorsLigne dernierReleveHeure={versHeureLocale(new Date(condition.horodatage), decalage)} />
      ) : null}
      <header className={styles.heros}>
        <div className={styles.marque}>
          <SigneLexique
            nom={condition.signe}
            taille={96}
            titre={titreSigne}
            className={
              animerLancement ? `${styles.grandSigne} ${styles.frapperSigne}` : styles.grandSigne
            }
          />
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
      <Paysage hauteurCiel={hauteurCiel} animerLancement={animerLancement} />
    </>
  );
}
