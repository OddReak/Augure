/**
 * Définition de la trame (§5.5) : hachures à 45°, un `<pattern>` par
 * instance — jamais un motif global — pour que les variables CSS
 * `--trame-rgb`/`--trame-op` se résolvent dans le palier de l'écran
 * courant. Partagée par tous les SVG qui peignent une face ombrée
 * (`Paysage`, `DisqueLune`).
 */
interface TrameDefsProps {
  id: string;
  pas?: number;
}

export function TrameDefs({ id, pas = 4 }: TrameDefsProps) {
  return (
    <defs>
      <pattern id={id} width={pas} height={pas} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width={pas} height={1} fill="rgb(var(--trame-rgb) / var(--trame-op))" />
      </pattern>
    </defs>
  );
}
