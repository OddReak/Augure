-- Phase 10 (§10) : la seule table de toute l'application (§3, « aucune base
-- de données, sauf une table devices en phase 10 »).

create table public.devices (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  lat double precision not null,
  lon double precision not null,
  label text,
  heure_locale time not null default '07:00',
  fuseau text not null,
  vu_le timestamptz not null default now()
);

-- Index de regroupement (§10 : « regroupe par coordonnées arrondies sur la
-- grille de 0,05° avant d'appeler le fournisseur »). round(x/0.05)*0.05 —
-- même arrondi que `api/_lib/grille.ts` côté client, valeur recopiée plutôt
-- que devinée.
create index devices_grille_idx on public.devices (
  round((lat / 0.05)::numeric) ,
  round((lon / 0.05)::numeric)
);

comment on table public.devices is
  'Souscriptions Web Push (§10). Sans compte (§3) : aucune ligne n''a de propriétaire authentifiable — voir les fonctions abonner_appareil/desabonner_appareil ci-dessous, seul chemin d''écriture ouvert à `anon`.';

alter table public.devices enable row level security;

-- Aucune politique pour `anon` sur la table elle-même : ni lecture, ni
-- écriture, ni suppression directes. Sans compte, aucune ligne n'a de
-- propriétaire vérifiable côté base — un accès table-à-table, même filtré
-- par une politique RLS « using (true) », laisserait n'importe quel
-- détenteur de la clé publishable (embarquée dans le bundle client, donc
-- publique par construction) lire ou effacer la souscription de qui que ce
-- soit. Les deux fonctions ci-dessous, `security definer`, sont le seul
-- chemin d'écriture pour `anon` : leur portée est bornée par leurs
-- paramètres (un endpoint, jamais une condition arbitraire), pas par une
-- politique RLS que le client pourrait contourner en construisant sa propre
-- requête REST. L'Edge Function (clé secrète, `service_role`, qui
-- contourne RLS par défaut sur Supabase) lit et écrit la table directement.

create or replace function public.abonner_appareil(
  p_endpoint text,
  p_p256dh text,
  p_auth text,
  p_lat double precision,
  p_lon double precision,
  p_label text,
  p_heure_locale time,
  p_fuseau text
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.devices (endpoint, p256dh, auth, lat, lon, label, heure_locale, fuseau)
  values (p_endpoint, p_p256dh, p_auth, p_lat, p_lon, p_label, p_heure_locale, p_fuseau)
  on conflict (endpoint) do update set
    p256dh = excluded.p256dh,
    auth = excluded.auth,
    lat = excluded.lat,
    lon = excluded.lon,
    label = excluded.label,
    heure_locale = excluded.heure_locale,
    fuseau = excluded.fuseau,
    vu_le = now();
end;
$$;

create or replace function public.desabonner_appareil(p_endpoint text) returns void
language sql
security definer
set search_path = public
as $$
  delete from public.devices where endpoint = p_endpoint;
$$;

revoke all on public.devices from anon, authenticated;
revoke execute on function public.abonner_appareil from public, authenticated;
revoke execute on function public.desabonner_appareil from public, authenticated;
grant execute on function public.abonner_appareil to anon;
grant execute on function public.desabonner_appareil to anon;

-- Sélection des appareils à notifier « maintenant » (§10 : cron toutes les
-- 15 minutes). Paramétrée par un instant explicite plutôt que de lire
-- `now()` en dur, pour rester testable avec un instant fixe — l'Edge
-- Function l'appelle sans argument en production.
create or replace function public.devices_a_notifier(a timestamptz default now())
returns setof public.devices
language sql
stable
as $$
  select *
  from public.devices
  where
    case
      -- La fenêtre de 15 minutes chevauche minuit dans le fuseau de l'appareil.
      when heure_locale + interval '15 minutes' < heure_locale then
        (a at time zone fuseau)::time >= heure_locale
        or (a at time zone fuseau)::time < heure_locale + interval '15 minutes'
      else
        (a at time zone fuseau)::time >= heure_locale
        and (a at time zone fuseau)::time < heure_locale + interval '15 minutes'
    end;
$$;

-- Exécutée par l'Edge Function avec la clé secrète (service_role) : jamais
-- appelable depuis le client. `execute` est accordé à `public` par défaut à
-- la création d'une fonction (contrairement aux privilèges de table) — révoqué
-- explicitement plutôt que de compter sur l'absence de grant explicite.
revoke execute on function public.devices_a_notifier from public, anon, authenticated;
grant execute on function public.devices_a_notifier to service_role;
