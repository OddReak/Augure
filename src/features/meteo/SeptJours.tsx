import { libelleJourCourt } from '../../domain/fuseau';
import { segmentsJour } from '../../design/sept-jours-geometrie';
import { Signe } from '../../design/Signe';
import { SIGNES_METEO } from '../../domain/signes';
import type { JourPrevision } from '../../domain/types';
import { Bande } from '../../ui/Bande';
import { Etiquette } from '../../ui/Etiquette';
import styles from './SeptJours.module.css';

interface SeptJoursProps {
  jours: JourPrevision[];
  /** Date calendaire (`AAAA-MM-JJ`) du jour courant, pour poser le curseur (§6, `.curseur`). */
  aujourdhui: string;
}

/**
 * Sept jours (§6, `blocSept()` du mockup) : une barre à quinze segments par
 * jour sur une échelle fixe −5 → 40 °C, curseur sur le jour en cours.
 */
export function SeptJours({ jours, aujourdhui }: SeptJoursProps) {
  return (
    <Bande>
      <Etiquette glyphe={<Signe nom="calendrier" taille={17} />} titre="Sept jours" note="min / max" />
      <div className={styles.jours}>
        {jours.map((jour) => {
          const estAujourdhui = jour.date === aujourdhui;
          const titreSigne = SIGNES_METEO[jour.signe].nom;
          return (
            <div className={styles.jour} key={jour.date}>
              <span className={styles.j}>{libelleJourCourt(jour.date)}</span>
              <Signe nom={jour.signe} taille={24} titre={titreSigne} />
              <span className={styles.mini}>{Math.round(jour.temperatureMinC)}°</span>
              <div className={styles.barre}>
                {segmentsJour(jour.temperatureMinC, jour.temperatureMaxC).map((segment, i) => (
                  <i
                    key={i}
                    className={segment.actif ? styles.on : undefined}
                    style={segment.actif ? { background: `var(--${segment.bande})` } : undefined}
                  />
                ))}
                {estAujourdhui ? <i className={styles.curseur} /> : null}
              </div>
              <span className={styles.maxi}>{Math.round(jour.temperatureMaxC)}°</span>
            </div>
          );
        })}
      </div>
    </Bande>
  );
}
