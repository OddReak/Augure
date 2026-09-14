import { creerGestionnaireCoordonnees } from './_lib/route';

/**
 * Prévision horaire (§4, §4.1) : `s-maxage=3600`. `periods=48` (deux jours) —
 * marge au-delà de la seule journée affichée par défaut, pour que la frise
 * puisse insérer un jalon lever/coucher (§ phase 6) sur le jour suivant sans
 * un second appel. Choix d'auteur, pas une valeur documentée par Foreca.
 */
export const config = { runtime: 'edge' };

export default creerGestionnaireCoordonnees('hourly', (location) => `forecast/hourly/${location}`, {
  periods: '48',
});
