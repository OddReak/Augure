import { useEffect, useRef, useState } from 'react';
import { Paysage } from '../../design/Paysage';
import { Signe } from '../../design/Signe';
import { SigneLexique } from '../../design/SigneLexique';
import { hauteurMarcheCiel, courseSolaire } from '../../design/marche-ciel';
import { ageEnTexte, decalageDe, versHeureLocale } from '../../domain/fuseau';
import { SIGNES_METEO } from '../../domain/signes';
import type { ConditionCourante } from '../../domain/types';
import { lancementAJouer } from '../../lib/lancement';
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
  /** Force une nouvelle requête de la prévision, sans attendre le seuil de cinq minutes (§7). */
  onActualiser: () => void;
  actualisationEnCours?: boolean;
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
  onActualiser,
  actualisationEnCours = false,
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

  // §11, demandé : signe + température réapparaissent dans le bandeau une fois
  // ceux du Héros scrollés sous lui, en fondu continu — pas un basculement au
  // seuil, un `avancement` recalculé à chaque frame de défilement (0 tant que
  // le bloc d'origine est visible, 1 une fois entièrement passé dessous).
  const chapeauRef = useRef<HTMLDivElement>(null);
  const marqueRef = useRef<HTMLDivElement>(null);
  const [avancement, setAvancement] = useState(0);

  useEffect(() => {
    let planifie = false;

    function mesurer(): void {
      planifie = false;
      const chapeau = chapeauRef.current;
      const marque = marqueRef.current;
      if (!chapeau || !marque) return;
      const basChapeau = chapeau.getBoundingClientRect().bottom;
      const rectMarque = marque.getBoundingClientRect();
      const brut = rectMarque.height > 0 ? (basChapeau - rectMarque.bottom) / rectMarque.height : 0;
      setAvancement(Math.min(1, Math.max(0, brut)));
    }

    function surDefilement(): void {
      if (planifie) return;
      planifie = true;
      requestAnimationFrame(mesurer);
    }

    mesurer();
    window.addEventListener('scroll', surDefilement, { passive: true });
    window.addEventListener('resize', surDefilement);
    return () => {
      window.removeEventListener('scroll', surDefilement);
      window.removeEventListener('resize', surDefilement);
    };
  }, []);

  return (
    <>
      <Chapeau
        ref={chapeauRef}
        collant
        // §11, post-livraison (demandé) : actualisation manuelle à la place du partage, qui
        // reste accessible depuis le menu du lieu (pastille de droite, `MenuLieu`). Inerte
        // hors ligne : la requête y serait mise en pause par TanStack Query, jamais résolue.
        gauche={
          <Pastille
            icone="actualiser"
            libelle={actualisationEnCours ? 'Actualisation en cours' : 'Actualiser la météo'}
            occupe={actualisationEnCours}
            desactive={horsLigne}
            onClick={onActualiser}
          />
        }
        avantTitre={
          <span className={styles.miniSigne} style={{ opacity: avancement }} aria-hidden="true">
            <Signe nom={condition.signe} taille={22} />
          </span>
        }
        titre={nomLieu}
        {...(horsLigne ? { sousTitre: `données d’il y a ${ageEnTexte(condition.horodatage, maintenant)}` } : {})}
        onTitreClick={onTitreClick}
        apresTitre={
          <span className={styles.miniTemp} style={{ opacity: avancement }} aria-hidden="true">
            {Math.round(condition.temperatureC)}°
          </span>
        }
        droite={<Pastille icone="plus" libelle="Menu" onClick={onOuvrirMenu} />}
      />
      {horsLigne ? (
        <BandeauHorsLigne dernierReleveHeure={versHeureLocale(new Date(condition.horodatage), decalage)} />
      ) : null}
      <header className={styles.heros}>
        <div className={styles.marque} ref={marqueRef}>
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
