import { useState, type ReactNode } from 'react';
import { Signe } from '../../design/Signe';
import {
  BAS_TRACE,
  HAUT_TRACE,
  HAUTEUR,
  largeurFrise,
  positionSeparateur,
  positionsColonnes,
} from '../../design/frise-geometrie';
import {
  IDS_METRIQUES,
  METRIQUES,
  bandeTemperature,
  niveau,
  plafondAxeColonnes,
  type IdMetrique,
} from '../../domain/quantification';
import type { PointHoraire } from '../../domain/types';
import { Bande } from '../../ui/Bande';
import { Etiquette } from '../../ui/Etiquette';
import { Onglets } from '../../ui/Onglets';
import styles from './FriseHoraire.module.css';

interface FriseHoraireProps {
  /** Déjà enrichie des jalons lever/coucher et des repères de jour (§domain/frise.ts). */
  points: PointHoraire[];
}

// Lu directement dans le texte de l'horodatage (`HH` en positions 11-12,
// `MM` en 14-15), jamais via `Date#getHours` : celui-ci renvoie l'heure dans
// le fuseau du terminal qui exécute le code, pas dans celui encodé par
// l'offset ISO — la frise doit afficher l'heure locale du lieu, pas celle du
// lecteur (§domain/frise.ts, même piège que la timezone du repère de jour).
function formatHeure(p: PointHoraire): string {
  const hh = p.horodatage.slice(11, 13);
  if (!p.jalon) return hh;
  const mm = p.horodatage.slice(14, 16);
  return `${hh}:${mm}`;
}

function valeurMetrique(p: PointHoraire, id: IdMetrique): number {
  switch (id) {
    case 'temp':
      return p.temperatureC;
    case 'ress':
      return p.ressentiC;
    case 'pluie':
      return p.pluieMm;
    case 'vent':
      return p.ventKmh;
    case 'uv':
      return p.indiceUv;
    case 'air':
      return p.qualiteAirEaqi ?? 0;
  }
}

/**
 * Frise horaire (§6, `horaires()` du mockup) : SVG en défilement horizontal,
 * jalons lever/coucher, séparateur de jour, six métriques quantifiées par
 * bande (§5.1 règle 5). La géométrie des colonnes (`frise-geometrie.ts`) ne
 * dépend jamais de la métrique active : basculer d'onglet ne déplace aucune
 * colonne (critère d'acceptation phase 5).
 */
export function FriseHoraire({ points }: FriseHoraireProps) {
  const [idActif, setIdActif] = useState<IdMetrique>('temp');
  const metrique = METRIQUES[idActif];
  const positions = positionsColonnes(points);
  const largeur = largeurFrise(points);
  const valeurs = points.map((p) => valeurMetrique(p, idActif));

  const separateurs: ReactNode[] = points.map((p, i) => {
    if (!p.sep) return null;
    const x = positionSeparateur(points, i);
    return (
      <g key={`sep-${i}`}>
        <line x1={x} y1={4} x2={x} y2={HAUTEUR - 6} stroke="var(--encre)" strokeWidth={2} opacity={0.28} />
        <text
          x={x - 7}
          y={HAUTEUR / 2}
          transform={`rotate(-90 ${x - 7} ${HAUTEUR / 2})`}
          textAnchor="middle"
          fontFamily="Karla"
          fontSize={10}
          fontWeight={700}
          letterSpacing={1.6}
          fill="var(--encre)"
          opacity={0.55}
        >
          {p.sep.toUpperCase()}
        </text>
      </g>
    );
  });

  const tetes: ReactNode[] = points.map((p, i) => {
    const x = positions[i];
    return (
      <g key={`tete-${i}`} data-testid={`colonne-${i}`} data-x={x}>
        <text
          x={x}
          y={16}
          textAnchor="middle"
          fontFamily="Karla"
          fontSize={12.5}
          fontWeight={600}
          fill={p.jalon ? 'var(--signe)' : 'var(--encre)'}
          opacity={p.jalon ? 1 : 0.55}
        >
          {formatHeure(p)}
        </text>
        <g transform={`translate(${x - 11} 30) scale(.92)`}>
          <use href={`#signe-${p.signe}`} width={24} height={24} />
        </g>
      </g>
    );
  });

  let corps: ReactNode;
  let vals: ReactNode[];

  if (metrique.type === 'ligne') {
    const mn = Math.min(...valeurs);
    const mx = Math.max(...valeurs);
    const amp = Math.max(mx - mn, 1);
    const y = (v: number) => BAS_TRACE - 8 - ((v - mn) / amp) * (BAS_TRACE - 8 - HAUT_TRACE);

    const segments: ReactNode[] = [];
    const points_: ReactNode[] = [];
    vals = [];
    valeurs.forEach((v, i) => {
      const x = positions[i];
      const yy = y(v);
      if (i > 0) {
        const moyenne = Math.round((valeurs[i - 1] + v) / 2);
        segments.push(
          <line
            key={`seg-${i}`}
            x1={positions[i - 1]}
            y1={y(valeurs[i - 1])}
            x2={x}
            y2={yy}
            stroke={`var(--${bandeTemperature(moyenne)})`}
            strokeWidth={5}
            strokeLinecap="butt"
          />,
        );
      }
      points_.push(<circle key={`pt-${i}`} cx={x} cy={yy} r={3.4} fill="var(--encre)" />);
      vals.push(
        <text
          key={`val-${i}`}
          x={x}
          y={yy + 23}
          textAnchor="middle"
          fontFamily="Fraunces"
          fontSize={19}
          fontWeight={600}
          fill="var(--encre)"
        >
          {v}
        </text>,
      );
    });
    corps = (
      <>
        {segments}
        {points_}
      </>
    );
  } else {
    const echelle = metrique.echelle;
    const maxi = plafondAxeColonnes(valeurs, echelle);
    const colonnes: ReactNode[] = [];
    vals = [];
    valeurs.forEach((v, i) => {
      const x = positions[i];
      const { couleur } = niveau(v, echelle);
      const hauteur = Math.max(2, (v / maxi) * (BAS_TRACE - HAUT_TRACE));
      colonnes.push(<rect key={`col-${i}`} x={x - 13} y={BAS_TRACE - hauteur} width={26} height={hauteur} fill={couleur} />);
      vals.push(
        <text
          key={`val-${i}`}
          x={x}
          y={BAS_TRACE + 21}
          textAnchor="middle"
          fontFamily="Fraunces"
          fontSize={18}
          fontWeight={600}
          fill="var(--encre)"
          opacity={v ? 1 : 0.35}
        >
          {metrique.decimales ? v.toFixed(metrique.decimales) : v}
        </text>,
      );
    });
    corps = (
      <>
        {colonnes}
        <line x1={6} y1={BAS_TRACE} x2={largeur - 12} y2={BAS_TRACE} stroke="var(--encre)" strokeWidth={2} />
      </>
    );
  }

  const note = idActif === 'temp' ? '48 h' : `${metrique.unite} · 48 h`;

  return (
    <Bande>
      <Etiquette glyphe={<Signe nom="horloge" taille={17} />} titre="Heure par heure" note={note} />
      <div className={styles.rail}>
        <svg
          width={largeur}
          height={HAUTEUR}
          viewBox={`0 0 ${largeur} ${HAUTEUR}`}
          role="img"
          aria-label={`${metrique.libelle} heure par heure`}
        >
          {separateurs}
          {corps}
          {tetes}
          {vals}
        </svg>
      </div>
      <table className={styles.lectureLineaire}>
        <caption>{metrique.libelle} heure par heure</caption>
        <thead>
          <tr>
            <th scope="col">Heure</th>
            <th scope="col">{metrique.libelle}</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p, i) => (
            <tr key={p.horodatage}>
              <td>{formatHeure(p)}</td>
              <td>
                {valeurs[i]} {metrique.unite}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className={styles.selecteur}>
        <Onglets
          colonnes={3}
          valeur={idActif}
          onChange={setIdActif}
          options={IDS_METRIQUES.map((id) => ({
            valeur: id,
            libelle: METRIQUES[id].libelle,
            glyphe: <Signe nom={METRIQUES[id].glyphe} taille={17} />,
          }))}
        />
      </div>
    </Bande>
  );
}
