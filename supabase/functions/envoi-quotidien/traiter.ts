import { composerNotification, type PointHoraireNotification } from '../../../src/domain/notification.ts';
import { signeDuSymboleForeca, type IdSigneMeteo } from '../../../src/domain/symboles.ts';
import { grouperParGrille, type AppareilGroupable } from './grouper.ts';

/**
 * Orchestration de l'envoi (§10), dépendances injectées (météo, envoi Push,
 * suppression) : module pur, sans `Deno.*` ni `npm:*`, testé par Vitest
 * (`tests/unit/traiter-envoi.test.ts`) sans navigateur ni Docker — `index.ts`
 * ne fait plus que fournir les implémentations réelles (ou simulées,
 * `ENVOI_MOCK=1`) de ces trois dépendances.
 */

export interface AppareilANotifier extends AppareilGroupable {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  label: string | null;
}

export interface PeriodeForeca {
  time: string;
  temperature: number;
  symbol: string;
}

export interface MeteoGroupe {
  courant: { current: PeriodeForeca };
  horaire: { forecast: PeriodeForeca[] };
  quotidien: { forecast: Array<{ date: string; minTemp: number; maxTemp: number }> };
}

export interface DependancesEnvoi {
  recupererMeteo: (latitude: number, longitude: number) => Promise<MeteoGroupe>;
  envoyerPush: (appareil: AppareilANotifier, titre: string, texte: string) => Promise<void>;
  supprimerAppareil: (id: string) => Promise<void>;
}

export interface ResumeEnvoi {
  groupes: number;
  appelsMeteo: number;
  envois: number;
  supprimes: number;
}

/** Date calendaire (`AAAA-MM-JJ`) de l'horodatage courant, dans le fuseau qu'il porte lui-même. */
export function dateDuJour(horodatage: string): string {
  // L'horodatage Foreca porte déjà l'heure locale du lieu (`2026-10-02T07:00:00+02:00`) : sa
  // partie date est la date locale, sans conversion — jamais `toISOString()`, qui la ramènerait
  // en UTC (la veille, pour un envoi à 7 h à l'est de UTC+7).
  return horodatage.slice(0, 10);
}

function versPointHoraireNotification(p: PeriodeForeca): PointHoraireNotification {
  const signe: IdSigneMeteo = signeDuSymboleForeca(p.symbol);
  return { horodatage: p.time, signe, temperatureC: p.temperature };
}

export async function traiterEnvoi(appareils: AppareilANotifier[], deps: DependancesEnvoi): Promise<ResumeEnvoi> {
  const groupes = grouperParGrille(appareils);
  let appelsMeteo = 0;
  let envois = 0;
  let supprimes = 0;

  for (const groupe of groupes) {
    appelsMeteo += 1;
    const meteo = await deps.recupererMeteo(groupe.latitude, groupe.longitude);

    const aujourdhui = dateDuJour(meteo.courant.current.time);
    // Recherché par date plutôt que pris en tête de liste : la réponse quotidienne vit en cache
    // CDN, et une réponse de la veille commencerait par la veille.
    const jourAujourdhui = meteo.quotidien.forecast.find((j) => j.date === aujourdhui);
    // §7 : dernière donnée connue absente plutôt qu'inventée — rien à envoyer pour ce groupe
    // si le jour même manque dans la réponse.
    if (!jourAujourdhui) continue;

    // Heures du jour à partir de l'heure courante seulement : la réponse horaire peut venir du
    // cache CDN (`s-maxage=3600`) et commencer une heure plus tôt que l'envoi.
    const debutHeureCourante = Math.floor(new Date(meteo.courant.current.time).getTime() / 3_600_000) * 3_600_000;
    const horairesAujourdhui = meteo.horaire.forecast
      .filter((p) => p.time.startsWith(aujourdhui) && new Date(p.time).getTime() >= debutHeureCourante)
      .map(versPointHoraireNotification);

    for (const appareil of groupe.appareils) {
      const { titre, texte } = composerNotification({
        nomLieu: appareil.label,
        aujourdhui: { temperatureMinC: jourAujourdhui.minTemp, temperatureMaxC: jourAujourdhui.maxTemp },
        horairesAujourdhui,
      });

      try {
        await deps.envoyerPush(appareil, titre, texte);
        envois += 1;
      } catch (e) {
        const statut = (e as { statusCode?: number }).statusCode;
        if (statut === 404 || statut === 410) {
          // §10 : « supprime la ligne sur retour 404 ou 410 » — l'abonnement n'existe plus
          // côté navigateur, le conserver ne ferait que répéter l'échec chaque jour.
          await deps.supprimerAppareil(appareil.id);
          supprimes += 1;
        }
        // Toute autre erreur (réseau, 5xx du service Push) : laissé en base, retenté au
        // prochain cycle de 15 minutes plutôt que supprimé sur un échec possiblement transitoire.
      }
    }
  }

  return { groupes: groupes.length, appelsMeteo, envois, supprimes };
}
