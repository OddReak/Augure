/**
 * Icônes d'interface (décoratives, `aria-hidden`) présentes dans le sprite
 * `signes.svg` en plus des seize signes météo de `domain/signes.ts`. La
 * distinction est celle du §5.4 : « les glyphes décoratifs sont aria-hidden ».
 */
export const ID_ICONES_INTERFACE = [
  'actualiser',
  'thermo',
  'ressenti',
  'air',
  'horloge',
  'calendrier',
  'partage',
  'plus',
  'carte',
  'ciel',
  'lexique',
  'loupe',
  'retour',
  'croix',
  'ajout',
  'position',
  'poignee',
  'cloche',
  'reglages',
  'unite',
  'info',
  'corbeille',
  'humidite',
  'pression',
  'uv',
  'visibilite',
  'rosee',
  'hors_ligne',
  'alerte',
] as const;

export type IdIconeInterface = (typeof ID_ICONES_INTERFACE)[number];
