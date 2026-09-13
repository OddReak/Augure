import styles from './ArcSolaire.module.css';

/**
 * Arc solaire (§6, `arcSoleil()` du mockup) : arc elliptique dont les deux
 * extrémités tombent exactement sur la ligne d'horizon, la corde occupant
 * toute la largeur disponible. `position` est la course du soleil dans la
 * journée (0 au lever, 1 au coucher — voir `marche-ciel.ts`, déjà utilisée
 * pour la marche de ciel du héros).
 */
const LARGEUR = 330;
const HAUTEUR = 120;
const RX = LARGEUR / 2;
const RY = HAUTEUR - 16;
const CX = LARGEUR / 2;
const CY = HAUTEUR;

function point(f: number): [number, number] {
  const a = Math.PI * (1 - f);
  return [CX + RX * Math.cos(a), CY - RY * Math.sin(a)];
}

function f2(n: number): string {
  return n.toFixed(1);
}

interface ArcSolaireProps {
  /** Position du soleil sur l'arc, 0 (lever) à 1 (coucher) — déjà bornée par l'appelant. */
  position: number;
}

export function ArcSolaire({ position }: ArcSolaireProps) {
  const [x0, y0] = point(0);
  const [x1, y1] = point(1);
  const [xc, yc] = point(position);

  return (
    <svg className={styles.arc} viewBox={`0 0 ${LARGEUR} ${HAUTEUR + 6}`} aria-hidden="true">
      <path
        d={`M${f2(x0)} ${f2(y0)}A${RX} ${RY} 0 0 1 ${f2(x1)} ${f2(y1)}`}
        fill="none"
        stroke="var(--encre)"
        strokeWidth={2}
        strokeDasharray="1 7"
        strokeLinecap="round"
        opacity={0.45}
      />
      <path
        d={`M${f2(x0)} ${f2(y0)}A${RX} ${RY} 0 0 1 ${f2(xc)} ${f2(yc)}`}
        fill="none"
        stroke="var(--signe)"
        strokeWidth={5}
      />
      <line x1={0} y1={HAUTEUR} x2={LARGEUR} y2={HAUTEUR} stroke="var(--encre)" strokeWidth={2} />
      <circle cx={f2(xc)} cy={f2(yc)} r={11} fill="var(--signe)" stroke="var(--papier)" strokeWidth={3} />
    </svg>
  );
}
