import { bandeTemperature, type BandeTemperature } from '../domain/quantification';

/**
 * Barre segmentée des sept jours (§6, `blocSept()` du mockup) : une échelle
 * **fixe** −5 °C → 40 °C (jamais réajustée à la série, pour rester
 * comparable d'un jour à l'autre), quinze segments, chacun coloré par sa
 * bande de température quand il tombe dans la plage min→max du jour.
 */

export const NOMBRE_SEGMENTS = 15;
export const BORNE_BASSE = -5;
export const BORNE_HAUTE = 40;

function position(temperatureC: number): number {
  return Math.round(((temperatureC - BORNE_BASSE) / (BORNE_HAUTE - BORNE_BASSE)) * NOMBRE_SEGMENTS);
}

export interface SegmentJour {
  actif: boolean;
  bande?: BandeTemperature;
}

/** Les quinze segments d'un jour, actifs entre les index de `min` et de `max` (au moins un segment). */
export function segmentsJour(min: number, max: number): SegmentJour[] {
  const lo = position(min);
  const hi = Math.max(position(max), lo + 1);
  const segments: SegmentJour[] = [];
  for (let i = 0; i < NOMBRE_SEGMENTS; i++) {
    const actif = i >= lo && i < hi;
    if (!actif) {
      segments.push({ actif: false });
      continue;
    }
    const t = min + (max - min) * ((i - lo) / Math.max(hi - lo, 1));
    segments.push({ actif: true, bande: bandeTemperature(t) });
  }
  return segments;
}
