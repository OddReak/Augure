// Edge Function « envoi-quotidien » (§10). Planifiée par pg_cron toutes les
// 15 minutes (ACTIONS.md pour la commande exacte) ; peut aussi être appelée
// directement (tests, `supabase functions serve`).
//
// Ne fait que fournir à `traiterEnvoi` (`traiter.ts`, module pur — testé par
// Vitest, sans Deno) les implémentations réelles ou simulées (`ENVOI_MOCK=1`)
// de la météo et de l'envoi Push. Deno (Supabase Edge Runtime), pas Node :
// les modules partagés avec le reste du projet portent l'extension `.ts` sur
// leurs imports relatifs pour rester importables tels quels — DECISIONS.md.

import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3';
import { CESTAS_COURANT, CESTAS_HORAIRE, CESTAS_QUOTIDIEN } from '../../../src/mocks/fixtures/cestas.ts';
import { traiterEnvoi, type AppareilANotifier, type MeteoGroupe } from './traiter.ts';

Deno.serve(async (requete) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    // Nom exact non confirmé sans déploiement réel (voir JOURNAL.md) — les trois
    // formes documentées ou plausibles sont essayées dans l'ordre.
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ??
      Deno.env.get('SUPABASE_SECRET_KEY') ??
      Deno.env.get('SUPABASE_SECRET') ??
      '',
  );

  const mock = Deno.env.get('ENVOI_MOCK') === '1';
  const instantParam = new URL(requete.url).searchParams.get('instant');

  const { data: appareils, error } = await supabase.rpc(
    'devices_a_notifier',
    instantParam ? { a: instantParam } : {},
  );
  if (error) return Response.json({ erreur: error.message }, { status: 500 });

  const baseUrl = Deno.env.get('APP_BASE_URL');
  if (!mock) webpush.setVapidDetails(Deno.env.get('VAPID_SUBJECT') ?? '', Deno.env.get('VAPID_PUBLIC') ?? '', Deno.env.get('VAPID_PRIVATE') ?? '');

  const resume = await traiterEnvoi(appareils as AppareilANotifier[], {
    async recupererMeteo(latitude, longitude): Promise<MeteoGroupe> {
      // Mode test : fixtures déjà utilisées par `VITE_MOCK` côté client — jamais un second
      // fournisseur (§9), seulement une donnée enregistrée en l'absence de déploiement réel.
      if (mock) return { courant: CESTAS_COURANT, horaire: CESTAS_HORAIRE, quotidien: CESTAS_QUOTIDIEN };
      if (!baseUrl) throw new Error('APP_BASE_URL manquant.');
      const params = `lat=${latitude}&lon=${longitude}`;
      const [courant, horaire, quotidien] = await Promise.all([
        fetch(`${baseUrl}/api/current?${params}`).then((r) => r.json()),
        fetch(`${baseUrl}/api/hourly?${params}`).then((r) => r.json()),
        fetch(`${baseUrl}/api/daily?${params}`).then((r) => r.json()),
      ]);
      return { courant, horaire, quotidien } as MeteoGroupe;
    },

    async envoyerPush(appareil, titre, texte): Promise<void> {
      if (mock) {
        // Pas de vraie souscription Push disponible sans navigateur : l'endpoint pilote le
        // scénario simulé, ici « abonnement expiré » pour exercer la suppression sur 410.
        if (appareil.endpoint.includes('expire-410')) {
          const erreur = new Error('expiré (test)') as Error & { statusCode: number };
          erreur.statusCode = 410;
          throw erreur;
        }
        return;
      }
      await webpush.sendNotification(
        { endpoint: appareil.endpoint, keys: { p256dh: appareil.p256dh, auth: appareil.auth } },
        JSON.stringify({ title: titre, body: texte }),
      );
    },

    async supprimerAppareil(id): Promise<void> {
      await supabase.from('devices').delete().eq('id', id);
    },
  });

  return Response.json(resume);
});
