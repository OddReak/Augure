import { decalageDe, versHeureLocale } from './fuseau.ts';
import type { IdSigneMeteo } from './signes.ts';
import { signeAffiche } from './symboles.ts';
import type { JourPrevision } from './types.ts';

/**
 * Générateur du texte de la notification quotidienne (§10), envoyée chaque
 * matin à 7 h avec la prévision du jour même (demande post-livraison, voir
 * DECISIONS.md — le document maître décrivait un résumé du lendemain).
 * Deux règles, tenues ici :
 * - donner l'heure de bascule plutôt que la condition moyenne
 *   (`phraseCondition`) ;
 * - aucune exhortation — uniquement des affirmations, jamais un verbe à
 *   l'impératif ni un point d'exclamation (§9, interdits).
 * L'écart avec la veille n'est pas donné : la réponse quotidienne Foreca
 * commence au jour même, la veille n'y figure jamais — rien à comparer sans
 * inventer une donnée (§7).
 *
 * Module partagé tel quel avec l'Edge Function `envoi-quotidien` (Deno) :
 * aucune dépendance Node ni navigateur, uniquement des types et fonctions
 * pures — voir DECISIONS.md, « le générateur de texte est un module de
 * domaine, pas un script d'Edge Function ». Ses imports relatifs portent
 * l'extension `.ts`, contrairement au reste du projet (`allowImportingTsExtensions`
 * déjà activé, tsconfig.app.json) : Deno l'exige pour résoudre un import
 * relatif, à la différence du bundler ; seuls ce fichier et les modules
 * qu'il importe (`fuseau`, `signes`, `symboles`, `types`) en ont besoin.
 */

/** Un point horaire réduit à ce dont ce module a besoin — découplé de `PointHoraire` (frise). */
export interface PointHoraireNotification {
  horodatage: string;
  signe: IdSigneMeteo;
  temperatureC: number;
}

export interface ScenarioNotification {
  /** `null` : position actuelle de l'appareil, sans nom connu (aucun géocodage inverse, §8). */
  nomLieu: string | null;
  aujourdhui: Pick<JourPrevision, 'temperatureMinC' | 'temperatureMaxC'>;
  /** Points horaires du jour, de l'heure d'envoi à la fin de journée, triés chronologiquement. */
  horairesAujourdhui: PointHoraireNotification[];
}

export interface NotificationQuotidienne {
  titre: string;
  texte: string;
}

const PHRASE_SIGNE: Record<IdSigneMeteo, string> = {
  soleil: 'soleil',
  lune: 'ciel clair',
  voile: 'ciel voilé',
  couvert: 'ciel couvert',
  pluie: 'pluie',
  averse: 'averses',
  orage: 'orage',
  neige: 'neige',
  grele: 'grêle',
  brume: 'brume',
  vent: 'vent',
  rafale: 'rafales',
  canicule: 'chaleur intense',
  gel: 'gel',
  lever: 'lever de soleil',
  coucher: 'coucher de soleil',
};

// Seul l'orage a un texte différent en seconde partie de journée (« averses orageuses »),
// repris tel quel de l'exemple du document maître plutôt qu'inventé.
function phraseSigne(signe: IdSigneMeteo, enBascule: boolean): string {
  if (signe === 'orage' && enBascule) return 'averses orageuses';
  return PHRASE_SIGNE[signe];
}

function capitaliser(texte: string): string {
  return texte.charAt(0).toUpperCase() + texte.slice(1);
}

function heureLocale(horodatage: string): string {
  const decalage = decalageDe(horodatage);
  const [heure] = versHeureLocale(new Date(horodatage), decalage).split(':');
  // « après 16 h », jamais « après 06 h » — le zéro initial n'a de sens que dans un cadran.
  return String(Number(heure));
}

/**
 * Condition du jour, avec sa bascule (§10 : « l'heure de bascule plutôt que
 * la condition moyenne »). Le seuil canicule/gel (`signeAffiche`, déjà
 * utilisé par la vignette de « Mes lieux », phase 8) prime sur le symbole
 * Foreca brut ici aussi — une notification qui dirait « soleil » un jour à
 * 38 °C manquerait l'information réellement cherchée le matin (§10, § intro
 * du texte de notification).
 */
function phraseCondition(horaires: PointHoraireNotification[]): string {
  const premier = horaires[0];
  if (!premier) return 'Conditions incertaines aujourd’hui.';

  const signeAffichePremier = signeAffiche(premier.signe, premier.temperatureC);
  const matin = capitaliser(phraseSigne(signeAffichePremier, false));

  const bascule = horaires
    .slice(1)
    .find((h) => signeAffiche(h.signe, h.temperatureC) !== signeAffichePremier);

  if (!bascule) return `${matin} toute la journée.`;

  const signeAfficheBascule = signeAffiche(bascule.signe, bascule.temperatureC);
  return `${matin} le matin, ${phraseSigne(signeAfficheBascule, true)} après ${heureLocale(bascule.horodatage)} h.`;
}

export function composerNotification(scenario: ScenarioNotification): NotificationQuotidienne {
  const { nomLieu, aujourdhui, horairesAujourdhui } = scenario;

  const condition = phraseCondition(horairesAujourdhui);
  const min = Math.round(aujourdhui.temperatureMinC);
  const max = Math.round(aujourdhui.temperatureMaxC);

  return {
    titre: nomLieu ? `Aujourd’hui à ${nomLieu}` : 'Aujourd’hui',
    texte: `${condition} ${min}° → ${max}°.`,
  };
}
