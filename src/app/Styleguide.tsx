import { useState } from 'react';
import { PALIERS, type Palier } from '../domain/types';
import { IDS_SIGNES_METEO } from '../domain/signes';
import { ID_ICONES_INTERFACE } from '../design/icones';
import { Signe } from '../design/Signe';
import { Bande } from '../ui/Bande';
import { Etiquette } from '../ui/Etiquette';
import { Interrupteur } from '../ui/Interrupteur';
import { Segment } from '../ui/Segment';
import styles from './Styleguide.module.css';

const NOMS_PALIER: Record<Palier, string> = {
  vigies: 'Vigies',
  ondee: 'Ondée',
  veille: 'Veille',
  colere: 'Colère',
  cendre: 'Cendre',
  fournaise: 'Fournaise',
};

/**
 * Route non publiée (§8, phase 1) : sert de référence visuelle pour les
 * six paliers et les primitives `src/ui`, capturée à chaque revue d'ensemble.
 */
export function Styleguide() {
  const [interrupteur, setInterrupteur] = useState(false);
  const [segment, setSegment] = useState<'c' | 'f'>('c');

  return (
    <main className={styles.page}>
      <h1 className={styles.titre}>Styleguide</h1>

      <div className={styles.galerie}>
        {PALIERS.map((palier) => (
          <figure key={palier} className={styles.carte} data-palier={palier}>
            <div className={styles.ciel}>
              <strong>{NOMS_PALIER[palier]}</strong>
            </div>
            <div className={`${styles.ombre} trame`} />
            <div className={styles.plans}>
              <div className={styles.plan} style={{ background: 'var(--p1)' }} />
              <div className={styles.plan} style={{ background: 'var(--p2)' }} />
              <div className={`${styles.plan} trame`} style={{ background: 'var(--p3)' }} />
            </div>
            <div className={styles.corps}>
              <Etiquette glyphe={<span aria-hidden="true">◆</span>} titre="Exemple d'étiquette" note="démo" />
              <Bande>
                <p className={styles.nom}>Bande de contenu</p>
              </Bande>
            </div>
          </figure>
        ))}
      </div>

      <section>
        <h2>Échelle de température (exclue de la bascule de palier)</h2>
        <div className={styles.echelleTemp}>
          <div className={styles.bandeTemp} style={{ background: 'var(--t1)' }}>
            t1 ≤5°
          </div>
          <div className={styles.bandeTemp} style={{ background: 'var(--t2)' }}>
            t2
          </div>
          <div className={styles.bandeTemp} style={{ background: 'var(--t3)' }}>
            t3
          </div>
          <div className={styles.bandeTemp} style={{ background: 'var(--t4)' }}>
            t4
          </div>
          <div className={styles.bandeTemp} style={{ background: 'var(--t5)' }}>
            t5 ≥30°
          </div>
        </div>
      </section>

      <section>
        <h2>Signes ({IDS_SIGNES_METEO.length} météo + {ID_ICONES_INTERFACE.length} interface)</h2>
        <div className={styles.grilleSignes}>
          {IDS_SIGNES_METEO.map((id) => (
            <div key={id} className={styles.caseSigne}>
              <Signe nom={id} taille={28} titre={id} />
              <span>{id}</span>
            </div>
          ))}
          {ID_ICONES_INTERFACE.map((id) => (
            <div key={id} className={styles.caseSigne}>
              <Signe nom={id} taille={28} />
              <span>{id}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>Primitives</h2>
        <p>Interrupteur</p>
        <Interrupteur actif={interrupteur} onChange={setInterrupteur} libelle="Exemple" />
        <p>Segment</p>
        <Segment
          options={[
            { valeur: 'c', libelle: '°C' },
            { valeur: 'f', libelle: '°F' },
          ]}
          valeur={segment}
          onChange={setSegment}
        />
      </section>
    </main>
  );
}
