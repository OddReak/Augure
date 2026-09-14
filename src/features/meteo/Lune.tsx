import { DisqueLune } from '../../design/DisqueLune';
import { Signe } from '../../design/Signe';
import { fractionIlluminee, nomPhase, prochainesPhases } from '../../domain/lune';
import { Bande } from '../../ui/Bande';
import { Etiquette } from '../../ui/Etiquette';
import styles from './Lune.module.css';

const FORMATTEUR_DATE = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' });

interface LuneProps {
  maintenant?: Date;
}

/**
 * Lune (§6, phase 6) : disque de la phase en cours, illumination, et les
 * quatre prochaines phases primaires. `domain/lune.ts` (Meeus ch. 49) porte
 * tout le calcul ; ce composant ne fait que le mettre en forme.
 *
 * Écart documenté (DECISIONS.md) : le mockup affiche aussi l'heure de
 * lever/coucher de la lune (`09:10 → 20:45`) — non calculée ici, la
 * position topocentrique de la lune est significativement plus complexe que
 * celle du soleil et n'est pas couverte par le critère d'acceptation de la
 * phase 6 ; seules la fraction illuminée et la date des phases le sont.
 */
export function Lune({ maintenant = new Date() }: LuneProps) {
  const fraction = fractionIlluminee(maintenant);
  const nom = nomPhase(maintenant);
  const pourcentage = Math.round(fraction * 100);
  const prochaines = prochainesPhases(maintenant);

  return (
    <Bande>
      <Etiquette glyphe={<Signe nom="lune" taille={17} />} titre="Lune" />
      <div className={styles.luneRang}>
        <DisqueLune fraction={fraction} taille={104} />
        <div className={styles.luneInfo}>
          <h4>{nom}</h4>
          <p>Éclairée à {pourcentage} %</p>
        </div>
      </div>
      <div className={styles.phases}>
        {prochaines.map((phase) => (
          <div className={styles.phase} key={phase.nom}>
            <DisqueLune fraction={phase.nom === 'Pleine lune' ? 1 : phase.nom === 'Nouvelle lune' ? 0 : 0.5} taille={22} />
            <div>
              <b>{phase.nom}</b>
              <span>{FORMATTEUR_DATE.format(phase.dateUtc)}</span>
            </div>
          </div>
        ))}
      </div>
    </Bande>
  );
}
