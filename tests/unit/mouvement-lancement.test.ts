import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * §7 : « un seul moment orchestré, au lancement, sur 600 ms : la marche de
 * ciel se peint de haut en bas en steps(2) (180 ms), les trois plans du
 * paysage entrent par décalage de 8 px (120 ms, décalés de 40 ms), puis le
 * glyphe de condition frappe (opacité 0 → 1, échelle 0,94 → 1, 500 ms,
 * cubic-bezier(.2,.9,.3,1)). [...] prefers-reduced-motion: reduce supprime
 * les trois temps. » Vérifié par lecture du CSS compilé plutôt que par une
 * capture d'écran chronométrée à la milliseconde — ce que le document
 * maître demande est verrouillé ici valeur par valeur, par outil, comme les
 * sept règles de rendu (§5.1, regles-de-rendu.test.ts).
 */

const paysageCss = readFileSync(join(process.cwd(), 'src/design/Paysage.module.css'), 'utf-8');
const heroCss = readFileSync(join(process.cwd(), 'src/features/meteo/Hero.module.css'), 'utf-8');

describe('mouvement orchestré du lancement (§7)', () => {
  it('la marche de ciel se peint en steps(2) sur 180 ms', () => {
    expect(paysageCss).toMatch(/animation:\s*peindreMarcheOmbre\s+180ms\s+steps\(2\)/);
    expect(paysageCss).toMatch(/@keyframes\s+peindreMarcheOmbre/);
  });

  it('les trois plans entrent en 120 ms, décalés de 40 ms les uns des autres', () => {
    expect(paysageCss).toMatch(/animation:\s*entreePlan\s+120ms/);
    expect(paysageCss).toMatch(/@keyframes\s+entreePlan\s*\{\s*from\s*\{\s*transform:\s*translateY\(8px\)/);

    const delais = [...paysageCss.matchAll(/animation-delay:\s*(\d+)ms;/g)].map((m) => Number(m[1]));
    expect(delais.sort((a, b) => a - b)).toEqual([0, 40, 80]);
  });

  it('le glyphe de condition frappe en 500 ms, cubic-bezier(.2,.9,.3,1), de 0,94 à l’échelle 1', () => {
    expect(heroCss).toMatch(/animation:\s*frapperSigne\s+500ms\s+cubic-bezier\(0\.2,\s*0\.9,\s*0\.3,\s*1\)/);
    expect(heroCss).toMatch(/@keyframes\s+frapperSigne\s*\{\s*from\s*\{\s*opacity:\s*0;\s*transform:\s*scale\(0\.94\)/);
  });

  it('prefers-reduced-motion: reduce supprime les trois temps', () => {
    for (const source of [paysageCss, heroCss]) {
      const blocReduit = source.match(/@media \(prefers-reduced-motion: reduce\) \{([^}]*\{[^}]*\}[^}]*)\}/);
      expect(blocReduit, 'bloc prefers-reduced-motion absent').not.toBeNull();
      expect(blocReduit![1]).toMatch(/animation:\s*none;/);
    }
  });
});
