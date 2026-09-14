# Actions humaines

Liste vide pour l'instant — présentée à l'humain seulement à la livraison finale (§10 du document maître). Rien n'est envoyé en cours de route.

Accumulé jusqu'ici :

## Dépôt et déploiement
- Fusionner la branche `worktree-augure-build` (ou celle en cours à la clôture) vers `main` : le déploiement Vercel se déclenche sur `main`, et cette session ne pousse jamais directement dessus.

## Cartes (phase 8)
- L'écran Cartes affiche une carte de précipitations illustrative, pas les vraies tuiles Foreca Maps : le jeton Foreca Maps est séparé de la clé de l'API météo (§4.1). Si les cartes réelles sont souhaitées, souscrire à Foreca Maps et fournir le jeton — une fonction Vercel de proxy restera à écrire (`api/maps/tile.ts`, sur le modèle de `api/current.ts`).

## Supabase et notification quotidienne (phase 10)

Dans l'ordre — chaque étape dépend de la précédente.

1. **Créer le projet Supabase** (si aucun n'existe déjà) sur supabase.com, puis récupérer l'URL du projet et ses clés (Settings → API) : la clé publishable (`sb_publishable_...`) et la clé secrète (`sb_secret_...`).
2. **Lier le projet local au projet distant** : `supabase link --project-ref <ref>` (depuis la racine du dépôt).
3. **Appliquer les migrations** : `supabase db push`. Elles créent la table `devices`, ses deux fonctions `security definer` (`abonner_appareil`/`desabonner_appareil`, le seul chemin d'écriture ouvert à `anon` — RLS ferme la table elle-même, voir DECISIONS.md), la fonction `devices_a_notifier`, et la planification `pg_cron` (`envoi-quotidien`, toutes les 15 minutes). Vérifier auparavant que les extensions `pg_cron` et `pg_net` sont activées (Database → Extensions sur le tableau de bord Supabase — activées par défaut sur un projet récent, mais à confirmer) : la seconde migration échoue sinon.
4. **Créer les deux secrets Vault** que `net.http_post` lit à chaque déclenchement du cron (SQL Editor du tableau de bord, ou `psql` sur la chaîne de connexion du projet) :
   ```sql
   select vault.create_secret('https://<ref>.supabase.co', 'envoi_quotidien_url');
   select vault.create_secret('<clé secrète service_role/sb_secret_...>', 'envoi_quotidien_service_key');
   ```
5. **Générer une vraie paire de clés VAPID** : `node scripts/generer-vapid.mjs` (affiche `VITE_VAPID_PUBLIC` et `VAPID_PRIVATE` — n'écrit rien sur disque). Choisir un `VAPID_SUBJECT` au format `mailto:quelqu'un@exemple.com`.
6. **Déployer l'Edge Function** : `supabase functions deploy envoi-quotidien`.
7. **Configurer les secrets de la fonction** (jamais dans `.env`, jamais commités) :
   ```sh
   supabase secrets set \
     APP_BASE_URL=https://<domaine-vercel-de-l-app> \
     VAPID_PUBLIC=<la clé publique générée à l'étape 5> \
     VAPID_PRIVATE=<la clé privée générée à l'étape 5> \
     VAPID_SUBJECT=mailto:quelqu'un@exemple.com
   ```
   Ne jamais définir `ENVOI_MOCK` en production (fait répondre la fonction contre des fixtures, phase 3).
8. **Vérifier le nom exact de la variable que Supabase injecte pour la clé secrète.** `index.ts` essaie dans l'ordre `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_SECRET_KEY`, `SUPABASE_SECRET` faute d'avoir pu le confirmer sans déploiement réel (voir JOURNAL.md — l'environnement de développement de cette session ne peut pas joindre une Edge Function en local, réseau Docker inter-conteneurs bloqué). Si aucun des trois ne fonctionne à l'usage, ajouter le bon nom via `supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<clé secrète>` explicitement — la fonction le lira en priorité.
9. **Vercel → Settings → Environment Variables** : `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE`, `VITE_VAPID_PUBLIC` (les trois exposées au client), `SUPABASE_SECRET` (si un usage serveur en a besoin plus tard).
10. **Tester en réel** : ouvrir l'application installée sur un iPhone (Web Push exige le mode autonome sur iOS, §10) ou dans Chrome Android, activer « Résumé du lendemain » dans Réglages, puis appeler la fonction manuellement une fois pour vérifier l'envoi sans attendre la fenêtre de 15 minutes : `curl -X POST https://<ref>.supabase.co/functions/v1/envoi-quotidien -H "Authorization: Bearer <clé secrète>"`.

**Non vérifié en réel, à confirmer au premier déploiement** (voir JOURNAL.md pour le détail) :
- Le nom exact de la variable d'environnement de la clé secrète auto-injectée (étape 8).
- `supabase functions serve` contre un Supabase local : bloqué dans cet environnement de développement précis par une restriction réseau Docker inter-conteneurs (`gotrue`/`edge-runtime` ne peuvent pas joindre le conteneur Postgres). La migration SQL elle-même a été testée directement contre Postgres (RLS, les deux fonctions `security definer`, `devices_a_notifier` y compris son cas de chevauchement de minuit) ; la logique de l'Edge Function (regroupement, composition du texte, suppression sur 404/410) a été testée unitairement (Vitest, sans Deno) via `traiterEnvoi`, dépendances injectées. Seuls les appels réels à `npm:web-push` et à `/api/*` en production restent à vérifier après déploiement — un développeur sur une machine Docker sans cette restriction devrait pouvoir lancer `supabase functions serve` sans adaptation.
- Le parcours d'abonnement complet (permission → `PushManager.subscribe()` → RPC → réception d'une notification) n'a été vérifié sur aucun appareil réel.

## Foreca (phase 7)
- Ouvrir un accès sur developer.foreca.com, ou souscrire au plan Basic du listing « Foreca Weather API » sur RapidAPI.
- Vercel → Settings → Environment Variables :
  - `FORECA_MODE` = `direct` ou `rapidapi`
  - `FORECA_TOKEN` (mode direct) ou `FORECA_RAPIDAPI_KEY` (mode rapidapi)
  - Aucune de ces variables ne porte le préfixe `VITE_`.
- Dès qu'une clé est active, enregistrer de vraies réponses de `current/{location}`, `forecast/hourly/{location}`, `forecast/daily/{location}`, `air-quality/forecast/hourly/{location}` et `warning/{location}` comme fixtures : les enveloppes `current`/`forecast`/`locations` sont vérifiées contre une source tierce (voir DECISIONS.md), mais les noms de champs eux-mêmes, la forme de `warning` et de `air-quality`, restent non confirmés par un exemple réel.
