import { palierDuSymboleForeca, signeDuSymboleForeca } from '../domain/symboles';
import type {
  Avertissement,
  ConditionCourante,
  JourPrevision,
  Lieu,
  NiveauVigilance,
  PointHoraire,
  PointQualiteAir,
} from '../domain/types';
import type {
  ForecaLieu,
  ForecaReponseAvertissements,
  ForecaReponseCourante,
  ForecaReponseHoraire,
  ForecaReponseQualiteAir,
  ForecaReponseQuotidienne,
  ForecaReponseRecherche,
} from './foreca-types';

/**
 * Adaptateur Foreca → domaine (§3 arborescence : `src/api/foreca.ts`).
 * Convertit les réponses brutes en modèle de domaine ; les unités entrantes
 * de Foreca sont déjà en SI (°C, km/h, mm), aucune conversion ici — sauf la
 * qualité de l'air, dont le barème lui-même diffère (voir `qualiteAir.ts`).
 */

export function adapterConditionCourante(
  reponse: ForecaReponseCourante,
  phrase: string,
  vigilance?: NiveauVigilance,
): ConditionCourante {
  const p = reponse.current;
  return {
    horodatage: p.time,
    temperatureC: p.temperature,
    ressentiC: p.feelsLikeTemp,
    signe: signeDuSymboleForeca(p.symbol),
    symboleBrut: p.symbol,
    palier: palierDuSymboleForeca(p.symbol, {
      indiceUv: p.uvIndex,
      temperatureC: p.temperature,
      ...(vigilance !== undefined ? { vigilance } : {}),
    }),
    phrase,
    ventKmh: p.windSpeed,
    humiditePourcent: p.relHumidity,
    pressionHpa: p.pressure,
    indiceUv: p.uvIndex,
    pointDeRoseeC: p.dewPoint,
    visibiliteM: p.visibility,
  };
}

export function adapterHoraire(reponse: ForecaReponseHoraire): PointHoraire[] {
  return reponse.forecast.map((p) => ({
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
  return reponse.forecast.map((p) => ({
    date: p.date,
    signe: signeDuSymboleForeca(p.symbol),
    symboleBrut: p.symbol,
    temperatureMinC: p.minTemp,
    temperatureMaxC: p.maxTemp,
    pluieAccumuleeMm: p.precipAccum,
    ventMaxKmh: p.maxWindSpeed,
  }));
}

/**
 * Détail par polluant (§11, post-livraison — vue détaillée de la qualité de
 * l'air, `src/app/QualiteAir.tsx`) : au-delà du seul AQI que
 * `fusionnerQualiteAir` pose sur la frise, le polluant dominant et les six
 * sous-indices. Un point par heure, dans le même ordre que la réponse
 * Foreca — le premier est la donnée la plus proche de maintenant, comme
 * pour `horaire[0]`.
 */
export function adapterQualiteAirDetail(reponse: ForecaReponseQualiteAir): PointQualiteAir[] {
  return reponse.forecast.map((p) => ({
    horodatage: p.time,
    aqi: p.AQI,
    polluantDominant: p.pollutantPhrase,
    sousIndices: {
      o3: p.AQI_O3,
      no2: p.AQI_NO2,
      so2: p.AQI_SO2,
      co: p.AQI_CO,
      pm10: p.AQI_PM10,
      pm25: p.AQI_PM2P5,
    },
  }));
}

/**
 * Fusionne la qualité de l'air (endpoint séparé, §4.1) dans la frise
 * horaire, par correspondance exacte d'horodatage. Un point horaire sans
 * correspondance garde `qualiteAirIndice` indéfini plutôt qu'une valeur
 * inventée — la métrique « air » l'affiche alors comme absente (§ phase 5).
 * L'AQI brut est posé tel quel (§11, post-livraison) : plus parlant qu'une
 * bande 1-6 sans contexte, `FriseHoraire.tsx` le colore via `niveau(v,
 * ECH_AIR)` — un seul calcul, jamais une bande précalculée qui pourrait
 * diverger de l'affichage détaillé.
 */
export function fusionnerQualiteAir(
  horaire: PointHoraire[],
  reponse: ForecaReponseQualiteAir,
): PointHoraire[] {
  const parHorodatage = new Map(reponse.forecast.map((p) => [p.time, p.AQI]));
  return horaire.map((point) => {
    const aqi = parHorodatage.get(point.horodatage);
    return aqi === undefined ? point : { ...point, qualiteAirIndice: aqi };
  });
}

function adapterLieu(l: ForecaLieu): Lieu {
  const region = l.adminArea ?? l.country;
  return {
    nom: l.name,
    ...(region !== undefined ? { region } : {}),
    coordonnees: { latitude: l.lat, longitude: l.lon },
    idForeca: l.id,
  };
}

export function adapterLieux(reponse: ForecaReponseRecherche): Lieu[] {
  return reponse.locations.map(adapterLieu);
}

const NIVEAU_DEPUIS_SIGNIFICANCE: Record<string, NiveauVigilance> = {
  red: 'rouge',
  r: 'rouge',
  orange: 'orange',
  o: 'orange',
  yellow: 'jaune',
  y: 'jaune',
};

export function adapterAvertissements(reponse: ForecaReponseAvertissements): Avertissement[] {
  return reponse.warnings.map((w) => ({
    niveau: NIVEAU_DEPUIS_SIGNIFICANCE[w.significance.toLowerCase()] ?? 'jaune',
    type: w.type,
    depuis: w.from,
    jusqua: w.to,
    ...(w.description !== undefined ? { description: w.description } : {}),
  }));
}

const PRIORITE_VIGILANCE: Record<NiveauVigilance, number> = { aucune: 0, jaune: 1, orange: 2, rouge: 3 };

/** Le niveau de vigilance le plus élevé parmi une liste d'avertissements actifs. */
export function vigilanceMax(avertissements: readonly Avertissement[]): NiveauVigilance {
  return avertissements.reduce<NiveauVigilance>(
    (max, a) => (PRIORITE_VIGILANCE[a.niveau] > PRIORITE_VIGILANCE[max] ? a.niveau : max),
    'aucune',
  );
}
