/**
 * En-têtes de cache CDN par endpoint (§4, tableau des durées) — calées sur le
 * quota Foreca, pas sur le confort. Recalculer ce budget si une durée change
 * (§4.1 : « recalcule ce budget si tu touches à une durée de cache »).
 */

export type EndpointCache = 'current' | 'hourly' | 'daily' | 'alerts' | 'air' | 'places';

interface Durees {
  sMaxage: number;
  swr: number;
}

const DUREES: Record<EndpointCache, Durees> = {
  current: { sMaxage: 900, swr: 3600 },
  hourly: { sMaxage: 3600, swr: 7200 },
  daily: { sMaxage: 21600, swr: 43200 },
  alerts: { sMaxage: 1800, swr: 3600 },
  air: { sMaxage: 3600, swr: 7200 },
  places: { sMaxage: 604800, swr: 2592000 },
};

export function dureesCache(endpoint: EndpointCache): Durees {
  return DUREES[endpoint];
}

export function enteteCacheControl(endpoint: EndpointCache): string {
  const { sMaxage, swr } = DUREES[endpoint];
  return `public, s-maxage=${sMaxage}, stale-while-revalidate=${swr}`;
}
