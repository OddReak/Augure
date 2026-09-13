/**
 * Position déduite des en-têtes de géolocalisation IP que Vercel ajoute à
 * chaque requête (§7 : « l'application se peint immédiatement avec la
 * position déduite des en-têtes x-vercel-ip-latitude et
 * x-vercel-ip-longitude, puis déclenche getCurrentPosition() à la frame
 * suivante » ) — première étape de la chaîne de repli, avant tout dialogue
 * de permission natif.
 *
 * Hors de l'infrastructure Vercel (développement local, `vite preview` des
 * tests Playwright), ces en-têtes n'existent pas : la fonction répond alors
 * 204, un signal explicite d'absence plutôt qu'une position par défaut
 * fabriquée qui masquerait un vrai bug de géolocalisation en production.
 * Le client retombe sur l'étape suivante de la chaîne (`src/lib/position.ts`).
 */
export const config = { runtime: 'edge' };

export default function handler(request: Request): Response {
  const latitude = Number(request.headers.get('x-vercel-ip-latitude'));
  const longitude = Number(request.headers.get('x-vercel-ip-longitude'));

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return new Response(null, { status: 204 });
  }

  const villeBrute = request.headers.get('x-vercel-ip-city');
  const ville = villeBrute ? decodeURIComponent(villeBrute) : undefined;

  return Response.json(
    { latitude, longitude, ville },
    // Jamais mise en cache CDN : la position dépend de l'IP de l'appelant, pas du lieu demandé.
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
