import { useId } from 'react';
import { TrameDefs } from './TrameDefs';
import styles from './CarteSVG.module.css';

/**
 * Carte des précipitations (§6, `carteSVG()` du mockup) : fond de carte
 * réduit à deux valeurs (terre/eau), précipitations quantifiées en cinq
 * aplats — jamais un dégradé de nuance (§5.1, règle 5). Grille et silhouette
 * de terrain reprises telles quelles du mockup, pas réinterprétées.
 *
 * Illustratif pour l'instant : les tuiles Foreca Maps demandent un jeton
 * séparé de l'API météo et une infrastructure de tuiles hors du périmètre
 * de la phase 8 (§0, « tu construis contre un mock documenté ») — voir
 * DECISIONS.md et ACTIONS.md.
 */
const PLUIE_HEX = ['#BFD4E0', '#8FB4CC', '#5B8FB8', '#3B5F96', '#2B2A64'];

const GRILLE: readonly (readonly number[])[] = [
  [2, 0, 0, 1, 1, 0, 0, 0],
  [3, 2, 1, 1, 2, 1, 0, 0],
  [4, 3, 2, 1, 2, 2, 1, 0],
  [3, 4, 3, 2, 1, 2, 1, 0],
  [1, 3, 4, 3, 2, 1, 1, 0],
  [0, 1, 3, 3, 2, 1, 0, 0],
  [0, 0, 1, 2, 1, 1, 0, 0],
  [0, 0, 0, 1, 1, 0, 0, 0],
];

const TERRE_1 = 'M0 90 L70 72 L130 96 L190 78 L250 104 L310 88 L390 110 L390 300 L0 300Z';
const TERRE_2 = 'M0 168 L60 156 L120 180 L200 164 L280 188 L390 172 L390 300 L0 300Z';

export function CarteSVG() {
  const idTrame = useId();

  const cellules: React.ReactNode[] = [];
  GRILLE.forEach((ligne, r) => {
    ligne.forEach((v, c) => {
      if (v > 0) {
        cellules.push(
          <rect
            key={`${r}-${c}`}
            x={c * 48.75}
            y={40 + r * 30}
            width={48.75}
            height={30}
            fill={PLUIE_HEX[v - 1]}
            opacity={0.85}
          />,
        );
      }
    });
  });

  return (
    <svg className={styles.carte} viewBox="0 0 390 300" role="img" aria-label="Carte des précipitations">
      <TrameDefs id={idTrame} />
      <rect width={390} height={300} fill="var(--ciel-b)" />
      <rect width={390} height={300} fill={`url(#${idTrame})`} />
      <path d={TERRE_1} fill="var(--p1)" />
      <path d={TERRE_1} fill={`url(#${idTrame})`} />
      <path d={TERRE_2} fill="var(--p2)" />
      <path d={TERRE_2} fill={`url(#${idTrame})`} />
      {cellules}
      <circle cx={176} cy={182} r={7} fill="var(--signe)" stroke="var(--papier)" strokeWidth={3} />
    </svg>
  );
}
