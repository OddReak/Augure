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
**État** : close, `pnpm verify` vert.

Fait :
- `src/design/signes.svg` : sprite de 44 `<symbol>` extraits tels quels de l'objet `GL` du mockup (script Node jetable, non versionné — voir DECISIONS.md pour l'écart avec les « 40 chemins » / « 23 glyphes » annoncés par le document maître).
- `src/design/Sprite.tsx` : injecte le sprite une fois, monté dans `app/Layout.tsx`.
- `src/design/Signe.tsx` : composant `<Signe nom taille titre?>`, décoratif (`aria-hidden`) sans `titre`, porteur de sens (`role="img"` + `aria-label`) avec `titre`. L'appui long qui ouvre la fiche Lexique reste à câbler en phase 8, une fois l'écran Lexique construit.
- `src/domain/signes.ts` : table des seize signes météo officiels (nom + translittération, recopiés de l'objet `NOM` du mockup), avec décomposition (`composeDe`) pour les quatre signes dont les deux constituants sont eux-mêmes un des seize (voile, averse, grêle, gel).
- `src/design/icones.ts` : liste des vingt-huit icônes d'interface du sprite, hors signes météo.
- `src/domain/symboles.ts` : décodage des codes Foreca `[d|n][nébulosité][taux precip][type precip]` d'après le schéma documenté sur developer.foreca.com/resources (recherche web, pas deviné — l'exemple `d421` de ce site correspond à celui du document maître) ; `signeDuSymboleForeca` (jamais orphelin, repli `couvert` + `console.warn` journalisé) ; `palierDuSymboleForeca` (priorité colere › fournaise › cendre › ondee › veille › vigies).
- Section « Signes » ajoutée au styleguide (planche des 44 glyphes), capture Playwright régénérée.
- Tests : `tests/unit/symboles.test.ts` (exemple `d421`, code inconnu → repli journalisé, préfixe `n` → palier veille, balayage complet des 630 codes du champ documenté sans orphelin) ; `tests/unit/signes.test.ts` (sprite ↔ tables en bijection exacte, 44 = 44).

Non vérifié en réel : aucune réponse Foreca réelle n'a encore été observée (pas de clé) — le décodage s'appuie sur le schéma publié par Foreca lui-même, pas sur une fixture. À revalider en phase 3/7 dès qu'une clé ou des réponses enregistrées sont disponibles.

Commande pour relancer les tests : `pnpm verify`

## Phase 3 — Domaine, adaptateur Foreca et fixtures
**État** : close, `pnpm verify` vert.

Fait :
- `src/domain/types.ts` étoffé : `CoordonneesGeo`, `Lieu`, `ConditionCourante`, `PointHoraire`, `JourPrevision`, `PrevisionLieu`. Unités en SI partout (§4.1).
- `api/_lib/foreca-location.ts` : `formaterCibleForeca`, seule fonction autorisée à construire `{location}` — teste et verrouille le piège longitude-avant-latitude (`-0.68,44.74` pour Cestas).
- `api/_lib/foreca-auth.ts` : authentification pilotée par `FORECA_MODE`, en-tête `X-RapidAPI-Key` ou `Authorization: Bearer`, jeton mémorisé au niveau module avec une marge de 60 s. Vérifié contre `developer.foreca.com` (recherche web) : la voie directe utilise un jeton statique généré dans « My API », pas un flux identifiant/mot de passe programmatique — `FORECA_USER`/`FORECA_PASSWORD` ne servent qu'à l'humain pour se connecter au tableau de bord (voir DECISIONS.md).
- `tsconfig.api.json` ajouté et référencé depuis `tsconfig.json` : `api/` était jusqu'ici hors du périmètre de `pnpm typecheck`.
- **Correctif supplémentaire** : `pnpm typecheck` (`tsc --noEmit` sur le tsconfig racine) ne vérifiait en réalité aucun fichier, les `references` n'étant suivies qu'en mode `--build`. Remplacé par `tsc -b` (voir DECISIONS.md) — vérifie maintenant les 440+ fichiers du projet, `api/` compris.
- `src/api/foreca-types.ts` (formes brutes Foreca) et `src/api/foreca.ts` (adaptateur → domaine), `src/api/index.ts` en façade.
- `src/mocks/fixtures/cestas.ts` : fixture Cestas fidèle au mockup (44,74 / −0,68, 28°, 22 points horaires de `H_JOUR`, 7 jours de `SEPT`) au format brut Foreca.
- `src/mocks/handlers.ts` + `src/mocks/browser.ts` (MSW) : interceptent `/api/current|hourly|daily` et servent les fixtures. Activé dans `main.tsx` derrière `VITE_MOCK=1` (nouvelle variable, absente du tableau du §2 — ajoutée sciemment, ce n'est pas un secret).
- Tests : `foreca-location.test.ts` (piège de coordonnées), `foreca-auth.test.ts` (mémorisation du jeton, renouvellement à la marge de 60 s, échec clair si `FORECA_TOKEN` manque), `foreca-adapter.test.ts` (contrat adaptateur sur la fixture Cestas), `mode-mock.test.ts` (MSW intercepte réellement une requête `fetch`, sans réseau — via `msw/node`, indépendamment de l'écran qui consommera ces données en phase 4+).

Non vérifié en réel : aucune réponse Foreca authentique observée (pas de clé) ; les noms de champs bruts (`temperature`, `feelsLikeTemp`, `symbol`, enveloppes `current`/`hourly`/`daily`…) viennent d'une lecture de la documentation publique, pas d'un exemple de réponse — à corriger en phase 7 dès que des réponses réelles sont enregistrées, comme prévu par le document maître lui-même.

Commande pour relancer les tests : `pnpm verify`

## Phase 4 — Héros et paysage
**État** : close, `pnpm verify` vert.

Fait :
- `src/design/Paysage.tsx` : chemins recopiés tels quels de la fonction `paysage()` du mockup (trois plans, arcades, cyprès), un `<pattern>` de trame par instance (`useId`, §5.5). La bande `cielb` (marche d'ombre) est désormais paramétrable en hauteur (`hauteurCiel`) au lieu d'être fixée à 46 — c'est ce qui permet la marche animée.
- `src/design/marche-ciel.ts` : `courseSolaire` (0 au lever, 0,5 à midi, 1 au coucher, `null` la nuit) et `hauteurMarcheCiel` — approximation par sinus, pas le calcul Meeus complet (arrive en phase 6 pour l'arc et la lune ; ici on ne place que la marche du héros dans la journée).
- `src/features/meteo/Hero.tsx` (+ `Hero.module.css`) : barre supérieure collante (`position: sticky`), bloc de température (`tabular-nums`, Fraunces 500 opsz144), phrase, glyphe du signe courant.
- `src/features/meteo/phrase.ts` : phrase d'accroche **placeholder**, une par signe — la composition complète du §5.6 (horizon temporel, heure de bascule) dépend de la frise horaire (phase 5), pas encore raccordée.
- `src/features/meteo/usePrevisionLieu.ts` : assemble `/api/current|hourly|daily` via TanStack Query (§3) et l'adaptateur de la phase 3. Position en dur sur Cestas en attendant la chaîne de repli du §7/phase 7-8.
- `src/lib/requetes.ts` : `QueryClient` + persistance IndexedDB (`idb-keyval`, `@tanstack/query-async-storage-persister`), câblé dans `App.tsx` via `PersistQueryClientProvider`.
- `src/lib/magasin.ts` : ajout de `palierMeteo` (dérivé de la dernière condition reçue) ; `Layout.tsx` résout `data-palier` par `palierForce ?? palierMeteo ?? 'vigies'`.
- `Accueil.tsx` n'est plus un placeholder : rend `Hero` avec les données réelles (fixture Cestas tant que `VITE_MOCK=1`), état d'erreur avec réessai, état de chargement sans spinner (§7).
- **Deux correctifs d'outillage** : `vite.config.ts` fixe `build.target: 'es2022'` (le top-level await de `main.tsx` cassait le build par défaut) ; `playwright.config.ts` construit le serveur e2e avec `VITE_MOCK=1` puisque les fonctions `/api/*` n'existent pas encore (phase 7).
- Tests : `marche-ciel.test.ts` (la marche varie avec l'heure solaire) ; `tests/e2e/trame.spec.ts` — capture Playwright + décodage PNG (`pngjs`) + régression linéaire, exactement la méthode prescrite au §5.5, sur les six paliers. **Écart documenté** : `veille`/`colere` (`--trame-op: 0.24`) mesurent ~24-28 % de creux, au-delà de la bande générale 6-13 % du document — bande élargie pour ces deux paliers seulement (voir DECISIONS.md), jetons du mockup non modifiés.
- Capture `/styleguide` régénérée (échantillons de mesure de trame ajoutés).

Non vérifié en réel : la marche de ciel n'a été vérifiée que par sa formule (sinus), jamais contre une vraie position solaire Meeus (phase 6) ; la phrase d'accroche est un texte fixe par signe, pas la composition finale du §5.6.

Commande pour relancer les tests : `pnpm verify`

## Phase 5 — Frise horaire
**État** : close, `pnpm verify` vert.

Fait :
- `src/domain/quantification.ts` : `bandeTemperature` (les cinq bandes t1–t5, §5.2), les quatre échelles par colonnes `ECH_UV`/`ECH_AIR`/`ECH_PLUIE`/`ECH_VENT` (valeurs hexadécimales recopiées du mockup), `niveau()` (le palier d'une valeur), `plafondAxeColonnes()` (la borne haute de la bande qui contient le pic de la série, jamais le pic lui-même — §5.2), le catalogue `METRIQUES` des six métriques (deux en polyligne, quatre en colonnes).
- `src/domain/frise.ts` : `avecJalons()` insère un jalon lever/coucher à son heure exacte entre les deux points horaires qui l'encadrent (une insertion par date rencontrée dans la série, jamais un point retiré), avec température/ressenti/vent/UV/qualité de l'air interpolés linéairement ; `avecSeparateursJour()` pose un repère de jour (« dim. ») sur le premier point de chaque nouvelle date ; `construireFrise()` compose les deux. Piège de fuseau horaire verrouillé (voir DECISIONS.md) : le libellé de jour est ancré à midi UTC sur la seule date, jamais lu via `Date#getHours()` en fuseau local.
- `src/design/frise-geometrie.ts` : géométrie pure (`positionsColonnes`, `positionSeparateur`, `largeurFrise`), reprise de `horaires()` du mockup (pas de 58 px, bande de tracé y=74→116, hauteur 156) — ne prend jamais la métrique en paramètre, ce qui garantit structurellement que changer de métrique ne déplace aucune colonne.
- `src/features/meteo/FriseHoraire.tsx` (+ `.module.css`) : SVG en défilement horizontal (`.rail`), têtes d'heure + glyphe de condition, polyligne colorée par bande de température (temp/ressenti) ou colonnes colorées par niveau d'indice (pluie/vent/UV/qualité de l'air), séparateur de jour tourné à −90°, sélecteur de six métriques en grille 3×2 (réutilise `Onglets`, phase 1). `svg[role="img"]` avec `aria-label`, doublé d'une table de lecture linéaire visuellement masquée (§7).
- `usePrevisionLieu` applique désormais `construireFrise` à la réponse `/api/hourly` adaptée ; `Accueil.tsx` rend `<FriseHoraire>` sous le héros.
- Tests : `quantification.test.ts` (bandes, échelles, `niveau`, `plafondAxeColonnes` — le pic ne doit jamais être son propre plafond), `frise.test.ts` (index d'insertion exact du coucher, interpolation, absence d'insertion hors plage, plusieurs jalons/jours, ordre chronologique préservé, repère de jour posé au bon endroit), `frise-geometrie.test.ts` (pas fixe, décalage par repère de jour, largeur totale, indépendance vis-à-vis de la métrique). `tests/e2e/frise.spec.ts` (390×844) : les positions `data-x` des colonnes sont identiques après bascule des six métriques ; le défilement du rail ne perturbe pas la géométrie ; les six libellés du sélecteur ne débordent pas en français, ni après substitution par des variantes plus longues.

Non vérifié en réel : le lever/coucher inséré reste la même heure HH:MM pour toutes les dates de la série (pas de calcul par jour avant la phase 6, voir DECISIONS.md) ; la qualité de l'air (`qualiteAirEaqi`) est absente tant que l'endpoint `/api/air` n'est pas câblé (phase 7) — la métrique « air » de la frise affiche 0 en attendant, correctement quantifié mais pas encore une vraie donnée.

Commande pour relancer les tests : `pnpm verify`

## Phase 6 — Sept jours, soleil, lune
**État** : à démarrer.

Prochaine étape : barres segmentées sur échelle fixe −5 → 40 °C avec curseur du jour courant, arc solaire (`arcSoleil()` du mockup), disque lunaire et phases (`disqueLune()`, attention au drapeau de sens au premier quartier), calcul Meeus du lever/coucher réel par jour (qui remplacera l'heure unique de la phase 5, voir DECISIONS.md).

Commande pour relancer les tests : `pnpm verify`
