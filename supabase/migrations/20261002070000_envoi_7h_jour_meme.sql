-- Notification quotidienne (§10, post-livraison, demandé) : envoyée chaque
-- matin à 7 h, heure locale de l'appareil, avec la prévision du jour même
-- (l'Edge Function, `traiter.ts`) pour la position actuelle de l'appareil
-- (tenue à jour par le client, `useSuiviPositionNotifications.ts`).
--
-- L'heure n'est plus réglable : `devices_a_notifier` compare désormais à
-- 07:00 fixe plutôt qu'à `heure_locale`. La colonne reste (et le paramètre
-- `p_heure_locale` de `abonner_appareil`) : une version du client encore en
-- cache dans un service worker continue de l'envoyer, la retirer ferait
-- échouer son abonnement.

update public.devices set heure_locale = '07:00';

-- « Votre position » était le nom générique envoyé pour une position sans
-- nom connu : la notification gère désormais ce cas elle-même (`label`
-- null → titre « Aujourd'hui » seul).
update public.devices set label = null where label = 'Votre position';

comment on column public.devices.heure_locale is
  'Inutilisée depuis le passage à un envoi fixe à 07:00 (devices_a_notifier) — conservée pour les clients encore en cache qui l''envoient.';

-- Fenêtre [07:00, 07:15) dans le fuseau de l'appareil : le job pg_cron part
-- toutes les 15 minutes à :00, :15, :30, :45 — l'exécution de 7 h pile est
-- la seule à tomber dans la fenêtre, une notification par jour. Les fuseaux
-- décalés d'une demi-heure ou de trois quarts d'heure (Inde, Népal) la
-- reçoivent à la même exécution, puisque 15 minutes divisent ces décalages.
create or replace function public.devices_a_notifier(a timestamptz default now())
returns setof public.devices
language sql
stable
as $$
  select *
  from public.devices
  where (a at time zone fuseau)::time >= time '07:00'
    and (a at time zone fuseau)::time < time '07:15';
$$;

revoke execute on function public.devices_a_notifier from public, anon, authenticated;
grant execute on function public.devices_a_notifier to service_role;
