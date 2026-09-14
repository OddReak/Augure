import { ArcSolaire } from '../../design/ArcSolaire';
import { Signe } from '../../design/Signe';
import { courseSolaire } from '../../design/marche-ciel';
import { versHeureLocale } from '../../domain/fuseau';
import { Bande } from '../../ui/Bande';
import { Etiquette } from '../../ui/Etiquette';
import styles from './CourseSoleil.module.css';

interface CourseSoleilProps {
  leverSoleil: string;
  coucherSoleil: string;
  /** Fuseau du lieu (ex. `+02:00`, voir `domain/fuseau.ts`) — jamais celui du terminal qui exécute le code. */
  decalage: string;
  maintenant?: Date;
}

/**
 * Course du soleil (§6, `arcSoleil()` du mockup). La position sur l'arc
 * réutilise `courseSolaire` (déjà câblée pour la marche de ciel du héros,
 * phase 4) — `null` la nuit, qu'on épingle alors à l'extrémité de l'arc la
 * plus proche (avant le lever ou après le coucher, comparaison lexicale sur
 * `HH:MM`, valide car les deux heures sont à zéro rempli) plutôt que de ne
 * rien afficher.
 */
export function CourseSoleil({ leverSoleil, coucherSoleil, decalage, maintenant = new Date() }: CourseSoleilProps) {
  const course = courseSolaire(maintenant, leverSoleil, coucherSoleil, decalage);
  const heureLocale = versHeureLocale(maintenant, decalage);
  const position = course ?? (heureLocale < leverSoleil ? 0 : 1);

  return (
    <Bande>
      <Etiquette glyphe={<Signe nom="soleil" taille={17} />} titre="Course du soleil" />
      <div className={styles.astre}>
        <ArcSolaire position={position} />
        <div className={styles.pieds}>
          <div>
            <b>{leverSoleil}</b>
            <span>lever</span>
          </div>
          <div>
            <b>{coucherSoleil}</b>
            <span>coucher</span>
          </div>
        </div>
      </div>
    </Bande>
  );
}
