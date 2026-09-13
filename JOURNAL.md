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
**État** : à démarrer.

Prochaine étape : lire `design/mockup.html` (bloc `:root`, sélecteurs `.tel[data-palier=...]`), recopier les jetons dans `src/design/jetons.css`, poser `data-palier` sur la racine, typographie auto-hébergée (Fraunces/Karla dans `public/fonts`), primitives `src/ui`, route `/styleguide`.

Commande pour relancer les tests : `pnpm verify`
