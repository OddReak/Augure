-- Planification (§10 : « pg_cron côté Supabase, toutes les 15 minutes » —
-- décision verrouillée du document maître, §3). `pg_net.http_post` appelle
-- l'Edge Function ; l'URL du projet et la clé secrète vivent dans Vault,
-- jamais en dur dans une migration versionnée — voir ACTIONS.md pour les
-- deux commandes à lancer une fois (`select vault.create_secret(...)`)
-- avant que ce job puisse réellement joindre la fonction. Sans ces deux
-- secrets, le job se déclenche toutes les 15 minutes mais `net.http_post`
-- échoue (sous-requête vide) — c'est un échec visible dans
-- `net._http_response`, jamais un envoi silencieusement manqué.
select cron.schedule(
  'envoi-quotidien',
  '*/15 * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'envoi_quotidien_url') || '/functions/v1/envoi-quotidien',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'envoi_quotidien_service_key')
    ),
    body := '{}'::jsonb
  ) as request_id;
  $$
);
