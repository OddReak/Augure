import { useId } from 'react';
import { RAYON_DISQUE, geometrieDisqueLune } from './disque-lune-geometrie';
import { TrameDefs } from './TrameDefs';

interface DisqueLuneProps {
  /** 0 (nouvelle lune) à 1 (pleine lune). */
  fraction: number;
  /** Côté du disque en pixels CSS. */
  taille: number;
}

/**
 * Disque lunaire (§6, `disqueLune()` du mockup) : face sombre hachurée,
 * terminateur en demi-ellipse dont le demi-axe et le drapeau de sens
 * suivent la fraction illuminée (`disque-lune-geometrie.ts` — attention au
 * piège du premier quartier, verrouillé par un test paramétré).
 */
export function DisqueLune({ fraction, taille }: DisqueLuneProps) {
  const id = useId();
  const idMotif = `trame-lune-${id}`;
  const { demiAxe, sens, epaisseurTrait, pasTrame } = geometrieDisqueLune(fraction, taille);
  const R = RAYON_DISQUE;

  return (
    <svg
      viewBox="0 0 100 100"
      style={{ width: taille, height: taille, flex: '0 0 auto' }}
      aria-hidden="true"
    >
      <TrameDefs id={idMotif} pas={pasTrame} />
      <circle cx={50} cy={50} r={R} fill="var(--lune-b)" />
      <circle cx={50} cy={50} r={R} fill={`url(#${idMotif})`} />
      <path
        d={`M50 4A${R} ${R} 0 0 1 50 96A${Math.abs(demiAxe).toFixed(1)} ${R} 0 0 ${sens} 50 4Z`}
        fill="var(--lune)"
      />
      <circle cx={50} cy={50} r={R} fill="none" stroke="var(--encre)" strokeWidth={epaisseurTrait} />
    </svg>
  );
}
