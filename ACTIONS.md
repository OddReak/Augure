# Actions humaines

Liste vide pour l'instant — présentée à l'humain seulement à la livraison finale (§10 du document maître). Rien n'est envoyé en cours de route.

Accumulé jusqu'ici :

## Dépôt et déploiement
- Fusionner la branche `worktree-augure-build` (ou celle en cours à la clôture) vers `main` : le déploiement Vercel se déclenche sur `main`, et cette session ne pousse jamais directement dessus.

## Foreca (phase 7)
- Ouvrir un accès sur developer.foreca.com, ou souscrire au plan Basic du listing « Foreca Weather API » sur RapidAPI.
- Vercel → Settings → Environment Variables :
  - `FORECA_MODE` = `direct` ou `rapidapi`
  - `FORECA_TOKEN` (mode direct) ou `FORECA_RAPIDAPI_KEY` (mode rapidapi)
  - Aucune de ces variables ne porte le préfixe `VITE_`.
- Dès qu'une clé est active, enregistrer de vraies réponses de `current/{location}`, `forecast/hourly/{location}`, `forecast/daily/{location}`, `air-quality/forecast/hourly/{location}` et `warning/{location}` comme fixtures : les enveloppes `current`/`forecast`/`locations` sont vérifiées contre une source tierce (voir DECISIONS.md), mais les noms de champs eux-mêmes, la forme de `warning` et de `air-quality`, restent non confirmés par un exemple réel.
