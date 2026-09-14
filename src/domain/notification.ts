import { decalageDe, versHeureLocale } from './fuseau.ts';
import type { IdSigneMeteo } from './signes.ts';
import { signeAffiche } from './symboles.ts';
import type { JourPrevision } from './types.ts';

/**
 * Générateur du texte de la notification quotidienne (§10). Trois règles,
 * tenues ici :
 * - donner l'écart avec aujourd'hui (`phraseEcart`, sur le maximum du jour —
 *   c'est la lecture qui retombe exactement sur l'exemple du document
 *   maître : 28° aujourd'hui, 31° demain, « trois de plus ») ;
 * - donner l'heure de bascule plutôt que la condition moyenne
 *   (`phraseCondition`) ;
 * - aucune exhortation — uniquement des affirmations, jamais un verbe à
 *   l'impératif ni un point d'exclamation (§9, interdits).
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
  nomLieu: string;
  demain: Pick<JourPrevision, 'temperatureMinC' | 'temperatureMaxC'>;
  aujourdhui: Pick<JourPrevision, 'temperatureMaxC'>;
  /** Points horaires de demain seulement, triés chronologiquement, au moins un. */
  horairesDemain: PointHoraireNotification[];
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
  if (!premier) return 'Conditions incertaines demain.';

  const signeAffichePremier = signeAffiche(premier.signe, premier.temperatureC);
  const matin = capitaliser(phraseSigne(signeAffichePremier, false));

  const bascule = horaires
    .slice(1)
    .find((h) => signeAffiche(h.signe, h.temperatureC) !== signeAffichePremier);

  if (!bascule) return `${matin} toute la journée.`;

  const signeAfficheBascule = signeAffiche(bascule.signe, bascule.temperatureC);
  return `${matin} le matin, ${phraseSigne(signeAfficheBascule, true)} après ${heureLocale(bascule.horodatage)} h.`;
}

const NOMBRES_LETTRES = [
  '',
  'un',
  'deux',
  'trois',
  'quatre',
  'cinq',
  'six',
  'sept',
  'huit',
  'neuf',
  'dix',
  'onze',
  'douze',
  'treize',
  'quatorze',
  'quinze',
  'seize',
  'dix-sept',
  'dix-huit',
  'dix-neuf',
  'vingt',
];

function enLettres(n: number): string {
  return NOMBRES_LETTRES[n] ?? String(n);
}

/** §10 : « donner l'écart avec aujourd'hui, qui est l'information réellement cherchée le matin ». */
function phraseEcart(maxDemainC: number, maxAujourdhuiC: number): string {
  const ecart = Math.round(maxDemainC) - Math.round(maxAujourdhuiC);
  if (ecart === 0) return 'comme aujourd’hui';
  return `${enLettres(Math.abs(ecart))} ${ecart > 0 ? 'de plus' : 'de moins'} qu’aujourd’hui`;
}

export function composerNotification(scenario: ScenarioNotification): NotificationQuotidienne {
  const { nomLieu, demain, aujourdhui, horairesDemain } = scenario;

  const condition = phraseCondition(horairesDemain);
  const min = Math.round(demain.temperatureMinC);
  const max = Math.round(demain.temperatureMaxC);
  const ecart = phraseEcart(demain.temperatureMaxC, aujourdhui.temperatureMaxC);

  return {
    titre: `Demain à ${nomLieu}`,
    texte: `${condition} ${min}° → ${max}°, ${ecart}.`,
  };
}
