import { palierDuSymboleForeca, signeDuSymboleForeca } from '../domain/symboles';
import type { ConditionCourante, JourPrevision, PointHoraire } from '../domain/types';
import type {
  ForecaReponseCourante,
  ForecaReponseHoraire,
  ForecaReponseQuotidienne,
} from './foreca-types';

/**
 * Adaptateur Foreca → domaine (§3 arborescence : `src/api/foreca.ts`).
 * Convertit les réponses brutes en modèle de domaine ; les unités entrantes
 * de Foreca sont déjà en SI (°C, km/h, mm), aucune conversion ici.
 */

export function adapterConditionCourante(
  reponse: ForecaReponseCourante,
  phrase: string,
): ConditionCourante {
  const p = reponse.current;
  return {
    horodatage: p.time,
    temperatureC: p.temperature,
    ressentiC: p.feelsLikeTemp,
    signe: signeDuSymboleForeca(p.symbol),
    symboleBrut: p.symbol,
    palier: palierDuSymboleForeca(p.symbol, { indiceUv: p.uvIndex, temperatureC: p.temperature }),
    phrase,
  };
}

export function adapterHoraire(reponse: ForecaReponseHoraire): PointHoraire[] {
  return reponse.hourly.map((p) => ({
    horodatage: p.time,
    temperatureC: p.temperature,
    ressentiC: p.feelsLikeTemp,
    signe: signeDuSymboleForeca(p.symbol),
    symboleBrut: p.symbol,
    indiceUv: p.uvIndex,
    ventKmh: p.windSpeed,
    pluieMm: p.precipAccum,
  }));
}

export function adapterQuotidien(reponse: ForecaReponseQuotidienne): JourPrevision[] {
  return reponse.daily.map((p) => ({
    date: p.date,
    signe: signeDuSymboleForeca(p.symbol),
    symboleBrut: p.symbol,
    temperatureMinC: p.minTemp,
    temperatureMaxC: p.maxTemp,
  }));
}
