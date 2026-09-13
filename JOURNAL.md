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
**État** : close, `pnpm verify` vert.

Fait :
- `src/domain/soleil.ts` : lever/coucher du soleil (Meeus, éléments moyens — précision de la minute), `leverCoucherUtc(instant, coordonnees)`. Validé numériquement contre trois relevés indépendants (sunrise-sunset.org, recherche web) pour Cestas aux deux solstices et à l'équinoxe de septembre 2026 : écart maximal inférieur à quatre minutes (voir DECISIONS.md).
- `src/domain/lune.ts` : `fractionIlluminee` (approximation âge/cosinus), `nomPhase` (huit noms, par tranche de 1/8 de mois synodique), `prochainesPhases` (algorithme complet de Meeus ch. 49, JDE moyen + corrections périodiques). Les cinq références utilisées par les tests (dates réelles de nouvelle lune, premier quartier, pleine lune, dernier quartier, nouvelle lune de septembre-octobre 2026) viennent d'une recherche web indépendante, pas du mockup — qui s'avère leur correspondre exactement. Un bug de signe dans le terme dominant de la correction « pleine lune » (voir DECISIONS.md) a été détecté et corrigé grâce à ce test contre des références réelles.
- `src/domain/fuseau.ts` : module partagé (extrait de `frise.ts`, phase 5) pour lire/formater un horodatage dans le fuseau qu'il porte lui-même (`decalageDe`, `dateDe`, `versHeureLocale`, `versIsoAvecDecalage`, `libelleJourCourt`) — jamais dans celui du terminal qui exécute le code.
- `src/domain/frise.ts` recalcule maintenant le lever/coucher par date via `soleil.ts` (au lieu de l'heure HH:MM unique de la phase 5) ; comparaisons passées à `Date.parse` plutôt qu'à la comparaison lexicale de chaînes.
- **Correctif rétroactif** : `courseSolaire` (phase 4, `design/marche-ciel.ts`) lisait l'heure via `Date#getHours()` — le fuseau du terminal, pas celui du lieu affiché. Corrigé (paramètre `decalageIso` explicite), `Hero.tsx` mis à jour en conséquence. Voir DECISIONS.md pour l'analyse du bug et pourquoi aucun test antérieur ne l'avait révélé.
- `src/design/disque-lune-geometrie.ts` + `src/design/DisqueLune.tsx` : terminateur en demi-ellipse, piège du drapeau de sens verrouillé par un test paramétré (§6).
- `src/design/ArcSolaire.tsx` : arc solaire (`arcSoleil()` du mockup), position réutilisant `courseSolaire`.
- `src/design/TrameDefs.tsx` : composant de motif de trame extrait de `Paysage.tsx` et partagé avec `DisqueLune.tsx`.
- `src/design/sept-jours-geometrie.ts` + `src/features/meteo/SeptJours.tsx` : barre à quinze segments sur échelle fixe −5→40 °C, curseur sur le jour courant.
- `src/features/meteo/CourseSoleil.tsx`, `src/features/meteo/Lune.tsx` : mise en forme des modules ci-dessus, câblés dans `Accueil.tsx` sous la frise horaire.
- Tests : `soleil.test.ts` (trois relevés réels), `lune.test.ts` (cinq dates de référence réelles + bornes [0,1] sur 400 jours + prochaines phases triées et toujours après la date donnée), `disque-lune-geometrie.test.ts` (drapeau de sens paramétré f=0/.25/.5/.75/1, exactement les valeurs citées par le document maître), `sept-jours-geometrie.test.ts` (échelle fixe, au moins un segment actif, bornes basse/haute), `marche-ciel.test.ts` étoffé (décalage horaire explicite, dates construites en UTC).

Non vérifié en réel : la position de la lune elle-même (lever/coucher lunaire) n'est pas calculée — hors du critère d'acceptation de cette phase, voir DECISIONS.md ; `Lune.tsx` n'affiche que fraction illuminée et nom de phase. Le lever/coucher du soleil utilisé par la frise horaire (phase 5) et le héros (phase 4) est maintenant réel (Meeus), mais reste non confronté à une observation en conditions réelles depuis le lieu effectif de l'utilisateur — seulement contre des relevés tiers pour Cestas.

Commande pour relancer les tests : `pnpm verify`

## Phase 7 — Données réelles
**État** : close, `pnpm verify` vert. Toujours sans clé Foreca (portail développeur ou RapidAPI) — voir le bloc d'accès initial du §1 ; les fonctions sont écrites et testées contre un fournisseur simulé (fetch remplacé dans les tests), pas contre une vraie réponse Foreca. Le mode `VITE_MOCK=1` (fixtures MSW) reste le chemin de développement et d'e2e tant qu'une clé n'arrive pas.

Fait :
- `api/_lib/grille.ts` : arrondi des coordonnées sur la grille de 0,05° (§4.1) et construction de la clé de cache, robuste à l'imprécision binaire de la division flottante (`toFixed(2)`).
- `api/_lib/cache.ts` : en-têtes `Cache-Control: public, s-maxage=…, stale-while-revalidate=…` pour les six endpoints, valeurs recopiées du tableau du §4.
- `api/_lib/limite.ts` : limite de débit par IP, fenêtre glissante de 60 requêtes/minute en mémoire d'instance — généreuse, sert seulement à couper un script (§4.1).
- `api/_lib/quota.ts` : compteur journalier d'appels sortants et dernière réponse connue par requête, tous deux en mémoire de module (pas de base de données disponible avant la phase 10) ; dégradation à 85 % du budget de 2000 appels/jour, servant la dernière donnée connue plutôt qu'une erreur.
- `api/_lib/foreca-client.ts` : appelant Foreca partagé, deux bases d'URL selon `FORECA_MODE` (`weatherapi.foreca.net/api/v1` en direct, `foreca-weather.p.rapidapi.com` sans préfixe en RapidAPI — voir DECISIONS.md), repli sur la dernière réponse connue en cas de panne réseau/HTTP ou de dégradation de quota, échec explicite seulement si aucun repli n'existe.
- **Correctif rétroactif (phase 3)** : `foreca-auth.ts` ne posait que `X-RapidAPI-Key` en mode RapidAPI ; ajout de `X-RapidAPI-Host`, requis (voir DECISIONS.md).
- Six fonctions Vercel en Edge Runtime (`export const config = { runtime: 'edge' }`, signature `Request → Response` du standard web — aucune dépendance `@vercel/node` ajoutée, `@types/node` fournit déjà les types globaux `Request`/`Response`) : `api/current.ts`, `api/hourly.ts`, `api/daily.ts`, `api/air.ts`, `api/alerts.ts` (par coordonnées, squelette commun `api/_lib/route.ts`), `api/places.ts` (recherche par texte, pas de grille), `api/position.ts` (géolocalisation IP via les en-têtes `x-vercel-ip-*`, répond 204 hors de l'infrastructure Vercel).
- **Correction des enveloppes de réponse Foreca** (`src/api/foreca-types.ts`) : `hourly`/`daily` (hypothèse de la phase 3) remplacées par `forecast` pour les deux, `locations` pour la recherche de lieux — vérifié contre le code source ouvert du client `mr-ransel/ha-foreca-weather` et contre corporate.foreca.com/en/api-technical-details (recherche web), pas deviné. Ajout des types qualité de l'air et avertissements (formes moins sûres, documentées comme telles).
- `src/domain/qualiteAir.ts` : conversion ordinale de l'AQI américain (fourni par Foreca) vers la bande EAQI européenne à six niveaux qu'impose l'affichage (§5.2) — les deux barèmes ne sont pas équivalents, voir DECISIONS.md.
- `src/api/foreca.ts` : `fusionnerQualiteAir` (par correspondance d'horodatage), `adapterLieux`, `adapterAvertissements`, `vigilanceMax` ; `adapterConditionCourante` accepte désormais un niveau de vigilance et l'injecte dans `palierDuSymboleForeca` — le déclencheur `colere` par vigilance orange/rouge (§5.2), non câblé avant cette phase, fonctionne maintenant réellement.
- `src/lib/position.ts` + `src/lib/usePosition.ts` : chaîne de repli du §7 côté client — position stockée (`localStorage`) → `/api/position` (IP) pour le premier rendu, sans jamais appeler `getCurrentPosition()` avant qu'il soit peint ; `getCurrentPosition()` différé à la frame suivante (`requestAnimationFrame`), seulement si la permission n'est pas `denied` (§7, §9 : jamais de demande au lancement qui bloquerait le premier rendu). Options de géolocalisation exactement celles du §7 (`enableHighAccuracy: false`, `timeout: 8000`, `maximumAge: 300000`).
- `Accueil.tsx` : utilise `usePosition()` au lieu des coordonnées Cestas en dur ; repli par défaut sur Cestas tant qu'aucune source n'a répondu (garde le mode mock fonctionnel).
- Fixtures Cestas et handlers MSW mis à jour pour la nouvelle forme d'enveloppe et les nouveaux endpoints (`/api/air`, `/api/alerts`, `/api/places`) ; `/api/position` volontairement non interceptée en mode mock (§ voir commentaire du fichier).
- Tests : `grille.test.ts` (deux coordonnées à quelques centaines de mètres → même clé, robustesse flottante), `cache.test.ts` (les six endpoints contre le tableau du §4), `quota.test.ts` (dégradation à 85 %, réinitialisation quotidienne UTC), `limite.test.ts` (fenêtre glissante par IP), `qualiteAir.test.ts` (les six bandes), `foreca-client.test.ts` (**acceptation explicite de la phase** : succès, panne réseau → dernière donnée connue, erreur HTTP → dernière donnée connue, dégradation de quota → dernière donnée sans appeler Foreca, dégradation sans repli → appelle quand même, base RapidAPI sans préfixe), `position.test.ts` (chaîne complète, y compris « jamais d'appel GPS si `denied` »), `tests/e2e/bundle-secrets.spec.ts` (**acceptation explicite** : aucun nom de variable Foreca/secret serveur dans `dist/`).

Non vérifié en réel : aucune réponse Foreca authentique observée (toujours pas de clé) — la correction d'enveloppe (`forecast`/`locations`) s'appuie sur une source tierce indépendante et crédible, pas sur un exemple Foreca direct ; la forme de `warning/{location}` et `air-quality/forecast/hourly/{location}` reste une déduction de la documentation textuelle, sans JSON observé ; la conversion AQI→EAQI est une correspondance de catégories, pas un calcul officiel EAQI (qui demanderait les concentrations brutes par polluant, non confirmées dans la réponse Foreca) ; le compteur de quota et la limite de débit sont en mémoire d'instance, best-effort en environnement multi-instance (pas de base de données disponible avant la phase 10) ; la chaîne de position n'a été exercée qu'en environnement de test (jsdom, Playwright hors Vercel) — jamais contre de vrais en-têtes `x-vercel-ip-*` ni un vrai dialogue de permission natif ; aucun nom de lieu par géocodage inverse (« Votre position » générique) faute d'endpoint câblé pour ça avant la phase 8.

Commande pour relancer les tests : `pnpm verify`

## Phase 8 — Navigation et écrans secondaires
**État** : en cours, `pnpm verify` vert. Session interrompue à la demande de l'humain avant la fin de la phase — reprendre ici plutôt que revenir en arrière.

Fait :
- Chapeau/Pastille (`src/ui`) : primitives génériques du `.chapeau`/`.pastille`, réutilisées par tous les écrans poussés.
- Pied (`src/ui/Pied.tsx`) : nav basse à trois destinations (Ciel/Cartes/Lexique) + recherche — jamais Mes lieux ni Réglages, atteints depuis le chapeau (décision, DECISIONS.md).
- Store étendu (`src/lib/magasin.ts`) : `lieuxEnregistres` (persisté), `lieuActif`, `deplacerLieu` ; préférences d'affichage (unités, signes seuls, notifications) persistées mais pas encore appliquées à l'affichage (gap documenté).
- Recherche (`/recherche`) : `/api/places` avec anti-rebond, température par résultat, état vide fidèle au mockup.
- Mes lieux (`/mes-lieux`) : position live en tête + lieux enregistrés en dessous, chaque vignette calcule son propre palier (`useResumeLieu`) posé en `data-palier` sur son propre conteneur ; réorganisation par mode explicite (Monter/Descendre/Retirer), pas de glisser-déposer. Fixtures `LIEUX_DEMO` : un lieu par palier (Cestas/Rennes/Annecy/Toulouse/Chamonix/Séville), verrouillées par `demo-lieux.test.ts`.
- Menu du lieu (feuille, depuis la pastille « Menu » du héros) : ajouter/retirer des lieux, partager, raccourcis vers Réglages.
- Réglages (`/reglages`) : section Position reflétant l'état réel de `navigator.permissions` (jamais un faux interrupteur) ; export/effacement des données locales réels ; unités et signes-seuls persistés.
- Détail d'un jour (`/jour/:date`) : réutilise la requête de l'accueil (même clé TanStack Query, aucun second appel réseau) ; frise horaire omise au-delà des 48 h couvertes par `/api/hourly` ; Humidité/Pression/Indice UV/Course du soleil réservés au jour courant (l'endpoint quotidien ne les fournit pas pour les autres jours).
- Lexique (`/lexique`) + fiche de signe (`/lexique/:signe`) : seize signes, décomposition (`composeDe`), seuils de déclenchement rédigés à partir de la logique réellement implémentée (`domain/lexique.ts`, verrouillé par `lexique.test.ts`) — le filtre par primitive de tracé du mockup (Disque/Barre/Chevron/Point) n'est pas repris, aucune classification fiable n'étant donnée par le document maître (décision, DECISIONS.md).
- `SigneLexique` (`src/design`) : appui long (500 ms) ouvrant la fiche du Lexique (§5.4, règle d'accessibilité) — câblé sur le glyphe du héros et du détail d'un jour, seuls emplacements non déjà imbriqués dans un élément cliquable. Sept jours / vignettes / résultats de recherche gardent un `<Signe>` simple (décision, DECISIONS.md).
- Cartes (`/cartes`) : `CarteSVG.tsx` reprend telle quelle la grille et la silhouette de terrain de `carteSVG()` du mockup (précipitations en cinq aplats, jamais un dégradé). Illustratif tant qu'aucune clé Foreca Maps n'est disponible (§4.1, jeton séparé de l'API météo) — le sélecteur de couche reste réel et persistant, mais Vent/Température le disent explicitement plutôt que de laisser croire à une carte différente (décision, DECISIONS.md ; action correspondante dans ACTIONS.md).
- Domaine étendu : `ConditionCourante` (ventKmh, humiditePourcent, pressionHpa, indiceUv), `JourPrevision` (pluieAccumuleeMm, ventMaxKmh), `signeAffiche` (seuils canicule/gel appliqués à la vignette de lieu), `domain/fuseau.ts` (libelleJourLong, libelleDateLongue).

Non vérifié en réel : aucun changement (toujours pas de clé Foreca). Les unités choisies en Réglages ne changent encore aucun affichage ailleurs dans l'application (gap assumé, pas caché). La carte est illustrative (voir ci-dessus), pas les vraies tuiles Foreca.

Reste à faire avant de clore la phase : état « hors ligne » (bandeau + âge de la donnée sur l'accueil — la « position refusée » et l'« échec de chargement » existent déjà, respectivement dans Réglages et Accueil).

Commande pour relancer les tests : `pnpm verify`
