/**
 * Les seize signes météo officiels (§5.4), recopiés tels quels depuis
 * l'objet `NOM` de `design/mockup.html` : nom en clair et translittération.
 * `composeDe` ne référence que les décompositions dont les deux constituants
 * sont eux-mêmes un des seize signes (voile, averse, grêle, gel) ; les
 * autres combinaisons utilisent des primitives sans signe propre (l'éclair
 * GIR, l'intensité GAL) et n'ont pas de décomposition ici — leur fiche du
 * Lexique (phase 8) affichera alors le glyphe seul.
 */

export type IdSigneMeteo =
  | 'soleil'
  | 'lune'
  | 'voile'
  | 'couvert'
  | 'pluie'
  | 'averse'
  | 'orage'
  | 'neige'
  | 'grele'
  | 'brume'
  | 'vent'
  | 'rafale'
  | 'canicule'
  | 'gel'
  | 'lever'
  | 'coucher';

export interface SigneMeteo {
  id: IdSigneMeteo;
  nom: string;
  translit: string;
  composeDe?: [IdSigneMeteo, IdSigneMeteo];
}

export const SIGNES_METEO: Record<IdSigneMeteo, SigneMeteo> = {
  soleil: { id: 'soleil', nom: 'Dégagé', translit: 'ŠAM' },
  lune: { id: 'lune', nom: 'Nuit claire', translit: 'LIL' },
  voile: { id: 'voile', nom: 'Voilé', translit: 'ŠAM·NUB', composeDe: ['soleil', 'couvert'] },
  couvert: { id: 'couvert', nom: 'Couvert', translit: 'NUB' },
  pluie: { id: 'pluie', nom: 'Pluie', translit: 'ZAL' },
  averse: { id: 'averse', nom: 'Averse', translit: 'ŠAM·ZAL', composeDe: ['soleil', 'pluie'] },
  orage: { id: 'orage', nom: 'Orage', translit: 'ZAL·GIR' },
  neige: { id: 'neige', nom: 'Neige', translit: 'KUŠ' },
  grele: { id: 'grele', nom: 'Grêle', translit: 'KUŠ·ZAL', composeDe: ['neige', 'pluie'] },
  brume: { id: 'brume', nom: 'Brume', translit: 'ḪAB' },
  vent: { id: 'vent', nom: 'Vent', translit: 'IM' },
  rafale: { id: 'rafale', nom: 'Rafale', translit: 'IM·GIR' },
  canicule: { id: 'canicule', nom: 'Canicule', translit: 'ŠAM·GAL' },
  gel: { id: 'gel', nom: 'Gel', translit: 'KUŠ·LIL', composeDe: ['neige', 'lune'] },
  lever: { id: 'lever', nom: 'Lever', translit: 'É' },
  coucher: { id: 'coucher', nom: 'Coucher', translit: 'KI' },
};

export const IDS_SIGNES_METEO = Object.keys(SIGNES_METEO) as IdSigneMeteo[];
