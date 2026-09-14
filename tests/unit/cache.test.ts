import { describe, expect, it } from 'vitest';
import { dureesCache, enteteCacheControl, type EndpointCache } from '../../api/_lib/cache';

// Table du §4 du document maître, recopiée telle quelle pour verrouiller toute dérive.
const TABLE_DU_DOCUMENT_MAITRE: Record<EndpointCache, { sMaxage: number; swr: number }> = {
  current: { sMaxage: 900, swr: 3600 },
  hourly: { sMaxage: 3600, swr: 7200 },
  daily: { sMaxage: 21600, swr: 43200 },
  alerts: { sMaxage: 1800, swr: 3600 },
  air: { sMaxage: 3600, swr: 7200 },
  places: { sMaxage: 604800, swr: 2592000 },
};

describe('en-têtes de cache CDN (§4, acceptation phase 7)', () => {
  it.each(Object.entries(TABLE_DU_DOCUMENT_MAITRE) as [EndpointCache, { sMaxage: number; swr: number }][])(
    '%s : s-maxage et stale-while-revalidate correspondent au tableau du §4',
    (endpoint, attendu) => {
      expect(dureesCache(endpoint)).toEqual(attendu);
      expect(enteteCacheControl(endpoint)).toBe(
        `public, s-maxage=${attendu.sMaxage}, stale-while-revalidate=${attendu.swr}`,
      );
    },
  );
});
