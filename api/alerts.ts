import { creerGestionnaireCoordonnees } from './_lib/route.js';

/** Avertissements officiels (§4, §4.1) : `s-maxage=1800`. Forme de réponse non confirmée, voir `src/api/foreca-types.ts`. */
export const config = { runtime: 'edge' };

export default creerGestionnaireCoordonnees('alerts', (location) => `warning/${location}`);
