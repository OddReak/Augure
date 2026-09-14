import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * §11, post-livraison : trouvé en vérifiant `/qualite-air` sur le vrai
 * déploiement Vercel — `curl` y renvoyait 404, comme sur *toute* route
 * profonde (`/reglages`, `/mes-lieux`, `/jour/:date`…). Vercel ne
 * sert le contenu statique de `dist/` qu'au chemin exact, sans repli SPA par
 * défaut — contrairement à `vite dev`/`vite preview`, ce qui a rendu ce bug
 * invisible à tous les tests e2e locaux (aucun ne fait de vraie requête HTTP
 * vers une route profonde sur autre chose que `vite preview`). Un lien
 * partagé, un signet, ou un simple rechargement de page sur un écran
 * secondaire renvoyait donc une 404 à n'importe quel visiteur réel.
 *
 * Ce test ne peut pas reproduire le 404 lui-même (il faudrait un vrai
 * déploiement Vercel) : il verrouille seulement la présence de la règle de
 * réécriture qui l'a corrigé, pour qu'un futur `vercel.json` simplifié par
 * erreur ne la fasse pas disparaître en silence.
 */
describe('vercel.json — repli SPA (§11, post-livraison)', () => {
  it('réécrit toute route non-fichier vers index.html', () => {
    const config = JSON.parse(readFileSync(join(process.cwd(), 'vercel.json'), 'utf-8')) as {
      rewrites?: Array<{ source: string; destination: string }>;
    };

    expect(config.rewrites, 'vercel.json ne définit aucune règle de réécriture').toBeDefined();
    const repliSpa = config.rewrites?.find((r) => r.destination === '/index.html');
    expect(repliSpa, 'aucune règle ne réécrit vers /index.html — les routes profondes 404ent sur Vercel').toBeTruthy();
  });
});
