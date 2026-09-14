import { creerGestionnaireCoordonnees } from './_lib/route.js';

/** Prévision quotidienne (§4, §4.1) : `s-maxage=21600`. `periods=7`, le format des Sept Jours (§6). */
export const config = { runtime: 'edge' };

export default creerGestionnaireCoordonnees('daily', (location) => `forecast/daily/${location}`, {
  periods: '7',
});
