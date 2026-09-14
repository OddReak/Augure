import type { IdSigneMeteo } from './signes.ts';
import { IDS_SIGNES_METEO } from './signes.ts';
import type { Palier } from './types.ts';

/**
 * Décodage des symboles Foreca (`current`, `forecast/hourly`, `forecast/daily`).
 *
 * Imports relatifs en `.ts` (voir `notification.ts`) : ce module est
 * importé tel quel par l'Edge Function `envoi-quotidien` (Deno, phase 10).
 *
 * Foreca documente son schéma (developer.foreca.com/resources) comme une
 * lettre jour/nuit suivie de trois chiffres, chacun une catégorie séparée :
 *
 *   [d|n] [nébulosité 0-6] [taux de précipitation 0-4] [type de précipitation 0-2]
 *
 *   nébulosité       : 0 dégagé · 1 quasi dégagé · 2 mi-nuageux · 3 fragmenté ·
 *                       4 couvert · 5 voile d'altitude · 6 brouillard
 *   taux de précip.  : 0 aucun · 1 faible · 2 averses · 3 continu · 4 orageux
 *   type de précip.  : 0 pluie · 1 mélange (grésil/verglas) · 2 neige
 *
 * Exemple donné par la documentation elle-même, repris au §4.1 du document
 * maître : `d421` = jour, couvert, averses de grésil.
 *
 * Ne couvre que les seize signes météo dérivables d'une condition du moment
 * (dégagé, voilé, couvert, pluie, averse, orage, neige, grêle, brume, plus
 * nuit). `vent`, `rafale`, `canicule`, `gel`, `lever`, `coucher` ne viennent
 * jamais de ce champ : ce sont des glyphes de métrique, de seuil de
 * température ou de repère d'astre, posés ailleurs (voir DECISIONS.md).
 */

export interface DecodageSymboleForeca {
  code: string;
  veille: boolean;
  nebulosite: number;
  tauxPrecipitation: number;
  typePrecipitation: number;
}

const MOTIF_CODE = /^([dn])([0-6])([0-4])([0-2])$/;

export function decoderSymboleForeca(code: string): DecodageSymboleForeca | null {
  const trouve = MOTIF_CODE.exec(code);
  if (!trouve) return null;
  const [, prefixe, nebulosite, tauxPrecipitation, typePrecipitation] = trouve;
  return {
    code,
    veille: prefixe === 'n',
    nebulosite: Number(nebulosite),
    tauxPrecipitation: Number(tauxPrecipitation),
    typePrecipitation: Number(typePrecipitation),
  };
}

/** Un symbole inconnu ou malformé retombe sur `couvert` et journalise (§ phase 2). */
export function signeDuSymboleForeca(code: string): IdSigneMeteo {
  const decodage = decoderSymboleForeca(code);
  if (!decodage) {
    console.warn(`[symboles] code Foreca inconnu ou malformé « ${code} », repli sur « couvert ».`);
    return 'couvert';
  }

  const { veille, nebulosite, tauxPrecipitation, typePrecipitation } = decodage;

  // Le tonnerre prime sur tout : c'est le danger, pas la forme de la précipitation.
  if (tauxPrecipitation === 4) return 'orage';
  if (typePrecipitation === 1 && tauxPrecipitation > 0) return 'grele';
  if (typePrecipitation === 2 && tauxPrecipitation > 0) return 'neige';
  if (tauxPrecipitation === 2) return 'averse';
  if (tauxPrecipitation === 1 || tauxPrecipitation === 3) return 'pluie';

  // Aucune précipitation : la nébulosité seule décide.
  if (nebulosite === 6) return 'brume';
  if (nebulosite === 3 || nebulosite === 4) return 'couvert';
  if (nebulosite === 1 || nebulosite === 2 || nebulosite === 5) return 'voile';
  return veille ? 'lune' : 'soleil';
}

export interface ContextePalier {
  vigilance?: 'aucune' | 'jaune' | 'orange' | 'rouge';
  temperatureC?: number;
  indiceUv?: number;
}

/**
 * Palier associé à un symbole (§5.2), priorité décroissante :
 * colere › fournaise › cendre › ondee › veille › vigies.
 *
 * Un couvert ou un voile de jour, sans précipitation ni alerte, ne
 * correspond à aucun déclencheur explicite du tableau du document maître —
 * décision tranchée ici (DECISIONS.md) : il retombe sur `vigies`, le palier
 * par défaut, plutôt que d'inventer un septième palier.
 */
export function palierDuSymboleForeca(code: string, contexte: ContextePalier = {}): Palier {
  const decodage = decoderSymboleForeca(code);
  const signe = signeDuSymboleForeca(code);
  const veille = decodage?.veille ?? false;

  if (contexte.vigilance === 'orange' || contexte.vigilance === 'rouge') return 'colere';
  if (signe === 'orage' || signe === 'grele') return 'colere';
  if ((contexte.temperatureC ?? -Infinity) >= 34 || (contexte.indiceUv ?? 0) >= 8) return 'fournaise';
  if (signe === 'neige' || signe === 'brume') return 'cendre';
  if (signe === 'pluie' || signe === 'averse') return 'ondee';
  if (veille) return 'veille';
  return 'vigies';
}

export function estSigneMeteoConnu(id: string): id is IdSigneMeteo {
  return (IDS_SIGNES_METEO as string[]).includes(id);
}

/**
 * Glyphe affiché pour une vignette de lieu (§6, `ecranLieux()`) : au-delà
 * d'un seuil de température, le signe de seuil (canicule/gel) prime sur la
 * condition du moment — c'est ce que montre le mockup pour Séville (39 °C,
 * glyphe « canicule », pas « soleil »). Seuils : ≥ 34 °C (aligné sur le
 * déclencheur du palier fournaise, §5.2), ≤ 0 °C (le gel de l'eau ; le
 * document maître ne donne aucune valeur pour ce signe, décision tranchée
 * ici, voir DECISIONS.md). Appliqué pour l'instant seulement à la vignette
 * de « Mes lieux » (phase 8) — le héros et la frise horaire gardent le
 * signe brut de Foreca, écart documenté dans DECISIONS.md.
 */
export function signeAffiche(signeBase: IdSigneMeteo, temperatureC: number): IdSigneMeteo {
  if (temperatureC >= 34) return 'canicule';
  if (temperatureC <= 0) return 'gel';
  return signeBase;
}
