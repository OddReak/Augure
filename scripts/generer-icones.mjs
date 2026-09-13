// Génère les icônes PNG de l'application (phase 9, §8 : « icônes de 40 à
// 1024 px générées depuis le SVG du mockup ») à partir de
// `src/design/icone-app.svg` (recopié tel quel de `iconeApp()` du mockup).
//
// Utilise Chromium via Playwright plutôt qu'une bibliothèque de rastérisation
// (sharp, resvg…) : Playwright est déjà une dépendance installée avec son
// navigateur (devcontainer, phase 0), une dépendance de plus n'aurait servi
// qu'à ce seul script. Script versionné (contrairement au script jetable
// d'extraction du sprite de la phase 2) : les icônes peuvent avoir besoin
// d'être régénérées si la palette de l'icône change.
//
// Usage : node scripts/generer-icones.mjs

import { chromium } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const racine = dirname(dirname(fileURLToPath(import.meta.url)));
const cheminSvg = join(racine, 'src/design/icone-app.svg');
const dossierSortie = join(racine, 'public/icons');

// 32 (favicon) → 1024 (icône App Store / haute résolution) ; le jeu standard
// attendu par les manifestes PWA (192, 512) et par iOS (180, apple-touch-icon)
// est couvert.
const TAILLES = [32, 40, 60, 72, 80, 96, 120, 128, 144, 152, 167, 180, 192, 256, 384, 512, 1024];

async function main() {
  const svg = await readFile(cheminSvg, 'utf-8');
  await mkdir(dossierSortie, { recursive: true });

  const navigateur = await chromium.launch();
  try {
    const page = await navigateur.newPage();
    for (const taille of TAILLES) {
      await page.setViewportSize({ width: taille, height: taille });
      await page.setContent(
        `<!doctype html><html><head><style>
          html,body{margin:0;padding:0}
          svg{display:block;width:${taille}px;height:${taille}px}
        </style></head><body>${svg}</body></html>`,
      );
      const chemin = join(dossierSortie, `icon-${taille}.png`);
      await page.screenshot({ path: chemin, omitBackground: false });
      console.log(`✓ ${chemin}`);
    }
  } finally {
    await navigateur.close();
  }

  // apple-touch-icon : mêmes octets que l'icône 180, sous le nom attendu par iOS.
  await writeFile(join(dossierSortie, 'apple-touch-icon.png'), await readFile(join(dossierSortie, 'icon-180.png')));
}

await main();
