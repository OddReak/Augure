# Journal

## Phase 0 — Socle
**État** : close, `pnpm verify` vert.

Fait :
- Devcontainer (Node 22, pnpm via corepack, ESLint/Prettier, `postCreateCommand` installe les dépendances et Chromium pour Playwright).
- Scaffold Vite + React 19 + TypeScript strict (`tsconfig.app.json` avec toutes les options strictes en plus de `strict`).
- ESLint (flat config, `typescript-eslint` + `react-hooks` + `react-refresh`, compatible Prettier).
- Prettier.
- Vitest (configuré dans `vite.config.ts`, environnement jsdom).
- Playwright (`playwright.config.ts`, un seul projet Chromium, `webServer` sur `pnpm build && pnpm preview`).
- `vercel.json` (framework Vite, `pnpm build`, sortie `dist`).
- `.gitignore` avec `.env*` dès le premier commit.
- `.env.example` avec toutes les variables attendues et un commentaire par clé.
- Les trois fichiers de suivi (`JOURNAL.md`, `DECISIONS.md`, `ACTIONS.md`).
- Test Playwright unique (`tests/e2e/socle.spec.ts`) qui ouvre l'application et lit le titre « AUGURE ».
- Test Vitest trivial (`tests/unit/socle.test.ts`) pour que `pnpm test` ait quelque chose à exécuter.

Non vérifié en réel : rien à ce stade, aucune dépendance externe.

Commande pour relancer les tests : `pnpm verify`

## Phase 1 — Système de design
**État** : close, `pnpm verify` vert.

Fait :
- `design/mockup.html` versionné (il ne l'était pas encore dans le dépôt Git).
- `src/design/jetons.css` : les six paliers recopiés au caractère près depuis le mockup (quatorze jetons chacun), l'échelle de température t1–t5 avec sa version sombre sous `veille`/`colere`, l'échelle d'espacement et les trois épaisseurs de trait (§8bis), la classe utilitaire `.trame`.
- Sélecteur `[data-palier=...]` plutôt que `html[data-palier=...]` : permet à la fois de piloter la racine en production et d'afficher plusieurs paliers simultanément dans le styleguide (chaque `<figure>` porte son propre `data-palier`).
- Polices Fraunces et Karla auto-hébergées : téléchargées depuis Google Fonts (subsets latin + latin-ext, variables) et servies depuis `public/fonts`, `@font-face` dans `jetons.css`. Aucune requête vers Google Fonts au runtime.
- Primitives `src/ui` : `Bande`, `Etiquette`, `Interrupteur`, `Segment`, `Onglets`, `Feuille` — CSS modules, angle droit partout, jetons uniquement (aucune couleur en dur).
- Store Zustand unique (`src/lib/magasin.ts`), persisté, pour l'instant limité au palier forcé par le styleguide.
- Route `/styleguide` (non liée dans une nav) : galerie des six paliers, échelle de température, primitives. React Router en `createBrowserRouter`.
- Test `tests/unit/jetons.test.ts` : les six paliers définissent bien les quatorze jetons attendus, valeurs exactes vérifiées pour `vigies`.
- Test `tests/unit/regles-de-rendu.test.ts` : échoue si `box-shadow`, `filter: blur`, `border-radius` non nul hors `.chassis`, `linear-gradient(`/`radial-gradient(` apparaissent dans `src/**/*.css` ; `repeating-linear-gradient(` n'est toléré que dans `jetons.css`. Aucun fichier ne porte encore `.chassis` — la règle sera exercée réellement en phase 9 (châssis PWA) ; en attendant elle protège déjà contre toute régression.
- Capture Playwright de `/styleguide` (`tests/e2e/styleguide.spec.ts-snapshots/styleguide-chromium-linux.png`) comme référence visuelle.

Non vérifié en réel : rendu sur un vrai iPhone (contrastes, tailles tactiles) — seulement vérifié en résolution desktop de capture.

Commande pour relancer les tests : `pnpm verify`

## Phase 2 — Signes
**État** : à démarrer.

Prochaine étape : extraire l'objet `GL` de `design/mockup.html` (40 tracés) vers `src/design/signes.svg` en `<symbol>`, composant `<Signe>`, tables `src/domain/signes.ts` et `src/domain/paliers.ts` (projection symbole Foreca → signe + palier).

Commande pour relancer les tests : `pnpm verify`
