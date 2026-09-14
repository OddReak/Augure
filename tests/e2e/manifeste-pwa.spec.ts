import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

/**
 * Phase 9, critères d'acceptation explicites (§8) : « le manifeste passe le
 * contrôle d'installabilité » et « aucun `skipWaiting()` inconditionnel dans
 * le bundle ». Lecture directe de `dist/` (comme `bundle-secrets.spec.ts`) :
 * ce qui compte est ce qui a été écrit sur disque, pas ce qu'une page choisit
 * d'exécuter — et la génération du manifeste/service worker ne dépend pas de
 * `VITE_MOCK` (seul son enregistrement à l'exécution en dépend, voir
 * DECISIONS.md), le build mocké du projet `chromium` suffit à ce contrôle.
 */

const dossierDist = join(process.cwd(), 'dist');

interface IconeManifeste {
  src: string;
  sizes: string;
  type: string;
  purpose?: string;
}

test.describe('Manifeste et service worker (§9)', () => {
  test('le manifeste contient ce que Chrome exige pour proposer l’installation', () => {
    const manifeste = JSON.parse(readFileSync(join(dossierDist, 'manifest.webmanifest'), 'utf-8')) as {
      name: string;
      short_name: string;
      start_url: string;
      display: string;
      background_color: string;
      theme_color: string;
      icons: IconeManifeste[];
    };

    expect(manifeste.name).toBeTruthy();
    expect(manifeste.short_name).toBeTruthy();
    expect(manifeste.start_url).toBe('/');
    expect(['standalone', 'fullscreen', 'minimal-ui']).toContain(manifeste.display);
    expect(manifeste.background_color).toMatch(/^#[0-9a-f]{6}$/i);
    expect(manifeste.theme_color).toMatch(/^#[0-9a-f]{6}$/i);

    // Critère d'installabilité de Chrome : au moins une icône PNG ≥ 192 et une ≥ 512.
    const auMoins = (taille: number) =>
      manifeste.icons.some((i) => i.type === 'image/png' && i.sizes.startsWith(`${taille}x`));
    expect(auMoins(192)).toBe(true);
    expect(auMoins(512)).toBe(true);
    expect(manifeste.icons.some((i) => i.purpose === 'maskable')).toBe(true);
  });

  test('sw.js ne contient aucun skipWaiting() inconditionnel', () => {
    const contenu = readFileSync(join(dossierDist, 'sw.js'), 'utf-8');
    const occurrences = [...contenu.matchAll(/skipWaiting\(\)/g)];
    expect(occurrences.length).toBeGreaterThan(0);

    for (const occurrence of occurrences) {
      const debut = occurrence.index ?? 0;
      const contexte = contenu.slice(Math.max(0, debut - 150), debut);
      // `registerType: 'prompt'` (vite.config.ts) : le seul appel généré par Workbox est
      // celui, conditionnel, du message SKIP_WAITING que `updateServiceWorker(true)`
      // envoie sur clic explicite (`RegistreurPwa.tsx`) — jamais au chargement.
      expect(contexte, 'skipWaiting() doit être conditionné par le message SKIP_WAITING').toContain('SKIP_WAITING');
    }
  });

  test('le service worker MSW (fixtures, phase 3) n’est pas précaché par le vrai service worker', () => {
    const contenu = readFileSync(join(dossierDist, 'sw.js'), 'utf-8');
    expect(contenu).not.toContain('mockServiceWorker.js');
  });
});
