import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { clePositionNotifiee, fuseauNavigateur, memoriserPositionNotifiee, oublierPositionNotifiee } from './positionNotifiee';
import type { Database } from './supabase-types';

const URL_SUPABASE = import.meta.env.VITE_SUPABASE_URL;
const CLE_PUBLISHABLE = import.meta.env.VITE_SUPABASE_PUBLISHABLE;
const CLE_VAPID_PUBLIQUE = import.meta.env.VITE_VAPID_PUBLIC;

let client: SupabaseClient<Database> | undefined;

/**
 * Client Supabase, créé au premier besoin plutôt qu'au chargement du module
 * (§7 : ne jamais retarder le premier rendu — et tant qu'aucune clé
 * distante n'est fournie, `createClient` échouerait avec une URL vide).
 */
function clientSupabase(): SupabaseClient<Database> | null {
  if (!URL_SUPABASE || !CLE_PUBLISHABLE) return null;
  client ??= createClient<Database>(URL_SUPABASE, CLE_PUBLISHABLE);
  return client;
}

// `PushManager.subscribe` attend la clé VAPID en `BufferSource`, pas la
// chaîne base64url que porte `VITE_VAPID_PUBLIC`. Le cast est sûr : ce
// buffer vient toujours de `Uint8Array.from`, jamais d'un `SharedArrayBuffer`
// — seule la définition de type DOM (`ArrayBufferLike`) est trop large ici.
function base64UrlVersOctets(base64Url: string): BufferSource {
  const base64 = (base64Url + '='.repeat((4 - (base64Url.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  const brut = atob(base64);
  return Uint8Array.from(brut, (c) => c.charCodeAt(0)) as unknown as BufferSource;
}

/**
 * Le navigateur sait faire du Web Push — jamais vrai dans Safari hors mode
 * autonome (§10). Vérité de la valeur, pas seulement présence de la clé
 * (`in`) : `navigator.serviceWorker` peut exister mais valoir `undefined`
 * dans certains contextes restreints, et `in` ne le détecterait pas.
 */
export function pushDisponible(): boolean {
  return Boolean(navigator.serviceWorker) && Boolean(window.PushManager) && Boolean(window.Notification);
}

/** Lecture seule, sans effet de bord : ne déclenche jamais de permission (§7, §9). */
export async function estAbonneNotifications(): Promise<boolean> {
  if (!pushDisponible()) return false;
  const inscription = await navigator.serviceWorker.getRegistration();
  const abonnement = await inscription?.pushManager.getSubscription();
  return abonnement != null;
}

export interface LieuAbonnement {
  latitude: number;
  longitude: number;
  /** `null` : position actuelle sans nom connu — la notification titre alors « Aujourd'hui » seul. */
  nomLieu: string | null;
}

/**
 * Enregistre (ou met à jour, l'endpoint est la clé) la ligne `devices` de
 * cet abonnement (§10, RPC `abonner_appareil`, seul chemin d'écriture
 * ouvert à `anon` — voir la migration). Le fuseau est celui du navigateur
 * (`Intl`), pas le décalage fixe que porte l'horodatage Foreca
 * (`domain/fuseau.ts`) : `pg_cron` a besoin d'un nom IANA pour rester
 * correct au changement d'heure, ce dont un simple décalage ne peut pas
 * répondre (voir DECISIONS.md).
 */
async function enregistrerAppareil(
  supabase: SupabaseClient<Database>,
  abonnement: PushSubscription,
  lieu: LieuAbonnement,
): Promise<void> {
  const { keys } = abonnement.toJSON();
  if (!keys?.p256dh || !keys.auth) throw new Error('Abonnement Push sans clés de chiffrement.');

  const fuseau = fuseauNavigateur();
  const { error } = await supabase.rpc('abonner_appareil', {
    p_endpoint: abonnement.endpoint,
    p_p256dh: keys.p256dh,
    p_auth: keys.auth,
    p_lat: lieu.latitude,
    p_lon: lieu.longitude,
    p_label: lieu.nomLieu,
    // Envoi fixe à 7 h (`devices_a_notifier`) : valeur ignorée côté base, gardée pour la signature.
    p_heure_locale: '07:00',
    p_fuseau: fuseau,
  });
  if (error) throw error;
  memoriserPositionNotifiee(clePositionNotifiee(lieu.latitude, lieu.longitude, fuseau));
}

/**
 * Demande la permission (geste utilisateur explicite — jamais au lancement,
 * §9), souscrit au Push, et enregistre l'appareil pour la notification de
 * 7 h (§10).
 */
export async function abonnerNotifications(lieu: LieuAbonnement): Promise<void> {
  const supabase = clientSupabase();
  if (!supabase) throw new Error('Supabase non configuré (VITE_SUPABASE_URL/VITE_SUPABASE_PUBLISHABLE manquants).');
  if (!CLE_VAPID_PUBLIQUE) throw new Error('VITE_VAPID_PUBLIC manquant.');
  if (!pushDisponible()) throw new Error('Web Push indisponible sur ce navigateur.');

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Permission refusée.');

  const inscription = await navigator.serviceWorker.ready;
  const abonnement = await inscription.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: base64UrlVersOctets(CLE_VAPID_PUBLIQUE),
  });

  try {
    await enregistrerAppareil(supabase, abonnement, lieu);
  } catch (e) {
    await abonnement.unsubscribe();
    throw e;
  }
}

/**
 * Met à jour la position d'un abonnement déjà actif, sans jamais demander
 * de permission (§9) : la notification suit la position actuelle de
 * l'appareil, pas celle du jour de l'abonnement. Ne fait rien sans
 * abonnement ni configuration Supabase.
 */
export async function mettreAJourPositionNotifications(lieu: LieuAbonnement): Promise<void> {
  const supabase = clientSupabase();
  if (!supabase || !pushDisponible()) return;
  const inscription = await navigator.serviceWorker.getRegistration();
  const abonnement = await inscription?.pushManager.getSubscription();
  if (!abonnement) return;
  await enregistrerAppareil(supabase, abonnement, lieu);
}

/** Toujours sûre à appeler, même sans abonnement actif — ne lève jamais. */
export async function desabonnerNotifications(): Promise<void> {
  if (!pushDisponible()) return;
  const inscription = await navigator.serviceWorker.getRegistration();
  const abonnement = await inscription?.pushManager.getSubscription();
  if (!abonnement) return;

  const { endpoint } = abonnement;
  await abonnement.unsubscribe();
  oublierPositionNotifiee();

  const supabase = clientSupabase();
  if (!supabase) return;
  await supabase.rpc('desabonner_appareil', { p_endpoint: endpoint });
}
