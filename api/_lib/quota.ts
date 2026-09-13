/**
 * Garde-fou de quota Foreca (§4.1) : « au-delà de 85 % du budget, sers la
 * dernière donnée connue plutôt que d'appeler, et signale-le par un en-tête
 * `x-augure-degrade: quota`. Une application qui affiche une donnée d'il y a
 * deux heures est utilisable ; une application qui renvoie 429 ne l'est
 * pas. »
 *
 * Sans base de données (interdite hors la table `devices` de la phase 10,
 * §3), le compteur et le dernier succès connu vivent en mémoire du module —
 * partagés par les invocations qui réutilisent la même instance chaude,
 * réinitialisés à chaque redémarrage. C'est un filet best-effort, pas un
 * compteur exact multi-instance : le CDN (`s-maxage`/`stale-while-revalidate`,
 * §4, `api/_lib/cache.ts`) reste la ligne de défense principale contre le
 * dépassement — il évite l'immense majorité des appels sortants avant même
 * d'atteindre cette fonction. Ce garde-fou couvre le cas où une instance
 * chaude, à elle seule, dépasse son propre budget entre deux revalidations
 * CDN. Documenté ici plutôt que réécrit à chaque relecture (DECISIONS.md).
 */

const BUDGET_QUOTIDIEN = 2000;
const SEUIL_DEGRADATION = 0.85;

interface EtatQuota {
  jour: string;
  appels: number;
}

let etat: EtatQuota | null = null;
const dernieresReponses = new Map<string, unknown>();

function jourUtc(horloge: () => number): string {
  return new Date(horloge()).toISOString().slice(0, 10);
}

/** Exposé pour les tests uniquement : une instance Vercel vit plus longtemps qu'un test. */
export function reinitialiserQuota(): void {
  etat = null;
  dernieresReponses.clear();
}

export function enregistrerAppel(horloge: () => number = Date.now): void {
  const jour = jourUtc(horloge);
  if (!etat || etat.jour !== jour) {
    etat = { jour, appels: 0 };
  }
  etat.appels += 1;
}

export function quotaDegrade(horloge: () => number = Date.now): boolean {
  const jour = jourUtc(horloge);
  if (!etat || etat.jour !== jour) return false;
  return etat.appels >= BUDGET_QUOTIDIEN * SEUIL_DEGRADATION;
}

export function memoriserDerniereReponse(cle: string, reponse: unknown): void {
  dernieresReponses.set(cle, reponse);
}

export function derniereReponseConnue<T>(cle: string): T | undefined {
  return dernieresReponses.get(cle) as T | undefined;
}
