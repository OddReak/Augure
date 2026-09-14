import { creerGestionnaireCoordonnees } from './_lib/route.js';

/**
 * Qualité de l'air (§4, §4.1) : `s-maxage=3600`, endpoint distinct de la
 * prévision — compte pour un appel de quota séparé. Chemin et forme de
 * réponse non confirmés par un exemple réel (voir `src/api/foreca-types.ts`).
 */
export const config = { runtime: 'edge' };

export default creerGestionnaireCoordonnees('air', (location) => `air-quality/forecast/hourly/${location}`, {
  periods: '48',
});
