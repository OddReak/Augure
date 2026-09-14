import { creerGestionnaireCoordonnees } from './_lib/route.js';

/** Conditions courantes (§4, §4.1) : `s-maxage=900` — Foreca rafraîchit ses observations au quart d'heure. */
export const config = { runtime: 'edge' };

export default creerGestionnaireCoordonnees('current', (location) => `current/${location}`);
