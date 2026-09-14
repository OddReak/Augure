# Actions humaines

Liste vide pour l'instant — présentée à l'humain seulement à la livraison finale (§10 du document maître). Rien n'est envoyé en cours de route.

Accumulé jusqu'ici :

## Dépôt et déploiement
- Fusionner la branche `worktree-augure-build` (ou celle en cours à la clôture) vers `main` : le déploiement Vercel se déclenche sur `main`, et cette session ne pousse jamais directement dessus.

## Supabase et notification quotidienne (phase 10)

**Fait, post-livraison** (projet Supabase « Augure », `zbgialxsmmdfvtpqswbo`, eu-west-3) : projet créé, lié, migrations appliquées (`supabase db push`), secrets Vault déjà en place, clés VAPID générées, Edge Function déployée (`--use-api`, voir DECISIONS.md) et testée en réel — `curl` manuel : `HTTP 200`, `{"groupes":0,"appelsMeteo":0,"envois":0,"supprimes":0}` (zéro appareil inscrit à ce jour, chemin météo/Push pas encore exercé). Ferme la question du nom exact de la variable de clé secrète auto-injectée (JOURNAL.md) : ça a fonctionné sans configuration supplémentaire.

Il reste :

1. **Vercel → Settings → Environment Variables**, à ajouter :
   ```
   VITE_SUPABASE_URL         = https://zbgialxsmmdfvtpqswbo.supabase.co
   VITE_SUPABASE_PUBLISHABLE = sb_publishable__IcNQ0bMW5ENPeZxbJUsFg_3lTcE8cA
   VITE_VAPID_PUBLIC         = BJeVaD2DtTCWTKJsPT2EppRbdVkY7JnCBnK_t01bcqVZR-q8VGy0-LEZoqrIKVJhizwbnAiN-JL7EpYQZejN9Zc
   ```
   Redéployer ensuite.
2. **Tester en réel** : ouvrir l'application installée sur un iPhone (Web Push exige le mode autonome sur iOS, §10) ou dans Chrome Android, activer « Résumé du lendemain » dans Réglages, puis rappeler la fonction manuellement pour vérifier l'envoi sans attendre la fenêtre de 15 minutes (la clé secrète elle-même n'est pas recopiée ici — Settings → API → clé `secret` sur le tableau de bord Supabase) :
   ```sh
   curl -X POST https://zbgialxsmmdfvtpqswbo.supabase.co/functions/v1/envoi-quotidien \
     -H "Authorization: Bearer <clé secrète, tableau de bord Supabase>"
   ```

**Non vérifié en réel, à confirmer au premier abonnement réel** :
- Le chemin météo de l'Edge Function (`APP_BASE_URL` → `/api/current|hourly|daily` sur Vercel) : dépend d'une clé Foreca active côté Vercel (voir ci-dessous), pas encore exercé (zéro appareil inscrit).
- Le parcours d'abonnement complet (permission → `PushManager.subscribe()` → RPC → réception d'une notification) n'a été vérifié sur aucun appareil réel.

## Foreca (phase 7)

**Fait, post-livraison** : une clé est déjà active sur Vercel (`FORECA_MODE`/`FORECA_TOKEN`). Vérifié en réel : `curl https://augure.vercel.app/api/current?lat=44.74&lon=-0.68` répond une vraie observation courante.

Il reste, sans urgence :
- Vérifier de la même façon `hourly`/`daily`/`air`/`alerts` (`/api/hourly`, `/api/daily`, `/api/air`, `/api/alerts`, mêmes paramètres `lat`/`lon`) : seul `current` a été confirmé pour l'instant.
- Enregistrer de vraies réponses des cinq endpoints comme fixtures et relancer les tests de contrat : les enveloppes `current`/`forecast`/`locations` sont vérifiées contre une source tierce (voir DECISIONS.md), mais les noms de champs eux-mêmes, la forme de `warning` et de `air-quality`, restent non confirmés par un exemple réel malgré la clé maintenant active.
