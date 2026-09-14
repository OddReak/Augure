import { creerGestionnaireCoordonnees } from './_lib/route.js';

/**
 * Prévision horaire (§4, §4.1) : `s-maxage=3600`. `periods=48` (deux jours) —
 * marge au-delà de la seule journée affichée par défaut, pour que la frise
 * puisse insérer un jalon lever/coucher (§ phase 6) sur le jour suivant sans
 * un second appel. Choix d'auteur, pas une valeur documentée par Foreca.
 */
export const config = { runtime: 'edge' };

export default creerGestionnaireCoordonnees('hourly', (location) => `forecast/hourly/${location}`, {
  periods: '48',
  // `dataset=full` (§ vérifié en réel, phase 11 post-livraison, voir DECISIONS.md) : sans lui,
  // l'endpoint horaire ne renvoie qu'un sous-ensemble de champs — ni indice UV, ni humidité, ni
  // pression, alors que `current/{location}` les renvoie déjà par défaut.
  dataset: 'full',
});
