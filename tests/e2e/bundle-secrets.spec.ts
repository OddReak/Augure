import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

/**
 * §9 : « pas de clé Foreca dans le bundle client, dans un log, dans une URL
 * côté navigateur. » Acceptation phase 7 : « aucune variable Foreca
 * n'apparaît dans le bundle (test de grep sur dist/) ». Lecture directe du
 * système de fichiers plutôt qu'une page ouverte dans le navigateur : ce
 * test vérifie ce qui a été *écrit* dans `dist/`, pas ce qu'une page
 * exécutée choisit d'afficher.
 *
 * `api/_lib/foreca-auth.ts` (le seul endroit qui lit ces variables) n'est
 * jamais importé par un fichier de `src/` : Vite ne peut donc physiquement
 * pas les inclure dans le bundle client, que `VITE_MOCK` vaille 0 ou 1. Ce
 * test verrouille cette séparation contre une régression future (un import
 * accidentel de `api/_lib` depuis `src/`, par exemple).
 */

const NOMS_INTERDITS = [
  'FORECA_TOKEN',
  'FORECA_RAPIDAPI_KEY',
  'FORECA_USER',
  'FORECA_PASSWORD',
  'FORECA_MODE',
  'SUPABASE_SECRET',
  'VAPID_PRIVATE',
];

function fichiersJs(dossier: string): string[] {
  const resultat: string[] = [];
  for (const entree of readdirSync(dossier, { withFileTypes: true })) {
    const chemin = join(dossier, entree.name);
    if (entree.isDirectory()) {
      resultat.push(...fichiersJs(chemin));
    } else if (entree.name.endsWith('.js') || entree.name.endsWith('.html') || entree.name.endsWith('.css')) {
      resultat.push(chemin);
    }
  }
  return resultat;
}

test('aucune variable Foreca ni secret serveur dans le bundle dist/', () => {
  const fichiers = fichiersJs(join(process.cwd(), 'dist'));
  expect(fichiers.length).toBeGreaterThan(0);

  for (const fichier of fichiers) {
    const contenu = readFileSync(fichier, 'utf-8');
    for (const nom of NOMS_INTERDITS) {
      expect(contenu, `« ${nom} » trouvé dans ${fichier}`).not.toContain(nom);
    }
  }
});
