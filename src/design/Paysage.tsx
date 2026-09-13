import { useId } from 'react';
import styles from './Paysage.module.css';

/**
 * Paysage (§6, fonction `paysage()` du mockup) : trois plans, des arcades et
 * des cyprès, chaque masse peinte en aplat puis recouverte de la trame.
 * Tracés recopiés tels quels — ne pas redessiner.
 *
 * Un `<pattern>` par instance (§5.5) : les variables CSS de la trame se
 * résolvent dans le contexte du `<pattern>`, donc un motif partagé
 * prendrait les valeurs de la racine plutôt que celles du palier courant.
 */
const FORMES = {
  p1: (
    <>
      <path d="M258 190V92h18V74h16V58h22v16h16v18h18v98Z" />
      <path d="M0 190v-44l40-17 34 13 30-19 26 15v52Z" />
    </>
  ),
  p2: <path d="M0 190v-50l64-18 58 20 52-26 60 18 56-24 40 16v64Z" />,
  arc: (
    <>
      <path d="M206 190v-22a9 9 0 0 1 18 0v22Z" />
      <path d="M238 190v-22a9 9 0 0 1 18 0v22Z" />
      <path d="M270 190v-22a9 9 0 0 1 18 0v22Z" />
    </>
  ),
  corniche: <path d="M0 190v-20l52 8 44-14 58 12 46-10 52 14 50-12 38 10v12Z" />,
  cypA: (
    <>
      <path d="M40 170c0-17 5-32 8-32s8 15 8 32Z" />
      <path d="M96 174c0-14 4-26 6-26s6 12 6 26Z" />
      <path d="M158 168c0-18 5-33 8-33s8 15 8 33Z" />
    </>
  ),
  cypB: (
    <>
      <path d="M48 138c3 0 8 15 8 32h-8Z" />
      <path d="M102 148c2 0 6 12 6 26h-6Z" />
      <path d="M166 135c3 0 8 15 8 33h-8Z" />
    </>
  ),
} as const;

const PAS_TRAME = 4;
const HAUTEUR_VIEWBOX = 190;

interface PaysageProps {
  /** Hauteur (depuis le haut, en unités du viewBox) où commence la marche d'ombre du ciel (§5.1, §5.3). */
  hauteurCiel?: number;
}

export function Paysage({ hauteurCiel = 46 }: PaysageProps) {
  const id = useId();
  const idMotif = `trame-paysage-${id}`;

  const masse = (cle: keyof typeof FORMES, teinte: string) => (
    <>
      <g fill={teinte}>{FORMES[cle]}</g>
      <g fill={`url(#${idMotif})`}>{FORMES[cle]}</g>
    </>
  );

  const cielB = <rect y={hauteurCiel} width={390} height={HAUTEUR_VIEWBOX - hauteurCiel} />;

  return (
    <svg
      className={styles.paysage}
      viewBox="0 0 390 190"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <pattern
          id={idMotif}
          width={PAS_TRAME}
          height={PAS_TRAME}
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <rect width={PAS_TRAME} height={1} fill="rgb(var(--trame-rgb) / var(--trame-op))" />
        </pattern>
      </defs>
      <rect width={390} height={hauteurCiel} fill="var(--ciel)" />
      <g fill="var(--ciel-b)">{cielB}</g>
      <g fill={`url(#${idMotif})`}>{cielB}</g>
      {masse('p1', 'var(--p1)')}
      {masse('p2', 'var(--p2)')}
      {masse('arc', 'var(--p3)')}
      {masse('corniche', 'var(--p3)')}
      {masse('cypA', 'var(--p3)')}
      {masse('cypB', 'var(--p2)')}
    </svg>
  );
}
