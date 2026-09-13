# Décisions

Une ligne par arbitrage : la question, l'option retenue, la raison.

- **Branche de travail** — Travail sur `worktree-augure-build` poussée vers `origin`, pas directement sur `main` — la politique de l'environnement d'exécution interdit un push direct sur `main`/`master` ; l'humain fusionne la branche vers `main`, ce qui déclenche le déploiement Vercel automatique décrit dans le document maître.
- **Scaffold manuel plutôt que `create-vite`** — Fichiers de configuration écrits à la main (tsconfig, eslint flat config, vitest intégré à `vite.config.ts`) plutôt que générés — donne un contrôle exact sur le TS strict et les scripts attendus par `pnpm verify` dès la phase 0.
- **Devcontainer basé sur l'image officielle `javascript-node:22`** — Plus simple à maintenir qu'une image construite à la main, correspond à l'exigence Node 22 du §2.
- **Vitest 5 plutôt que 2** — La résolution pnpm de `vitest@2.1.9` embarquait `vite@5.4.21` en interne à côté du `vite@6.4.3` direct, deux types `Plugin`/`UserConfig` incompatibles faisaient échouer `tsc -b`. `vitest@5` aligne sa dépendance interne sur `vite@6` et supprime le doublon.
- **Sélecteur `[data-palier=...]` plutôt que `html[data-palier=...]`** — Le mockup scope ses jetons sur `.tel[data-palier=...]`, un conteneur, pas la racine. Généraliser le sélecteur (sans le préfixe `html`) permet à la production de poser l'attribut sur `<html>` (« un seul attribut sur la racine pilote tout », §5.2) tout en laissant le styleguide afficher les six paliers simultanément, chacun sur son propre conteneur.
- **Polices récupérées depuis Google Fonts puis auto-hébergées, pas de service de fonte tiers** — `developer.foreca.com` n'a aucun rapport avec la typographie ; le plus simple pour respecter « aucune requête vers Google Fonts en production » (§5.3) est de télécharger une fois les fichiers `.woff2` (subsets latin + latin-ext, axes variables) et de les servir depuis `public/fonts`.
- **`react-router-dom` et `zustand` installés dès la phase 1** — Décidés au §3, nécessaires dès que `/styleguide` doit coexister avec la route racine et que le palier doit être piloté par un état partagé.
