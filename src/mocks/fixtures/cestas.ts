import type {
  ForecaPeriodeHoraire,
  ForecaPeriodeQuotidienne,
  ForecaReponseAvertissements,
  ForecaReponseCourante,
  ForecaReponseHoraire,
  ForecaReponseQualiteAir,
  ForecaReponseQuotidienne,
} from '../../api/foreca-types';

/**
 * Fixture Cestas — reproduit le scénario « vigies » de `design/mockup.html`
 * (objets `ECRANS.vigies`, `H_JOUR`, `SEPT`) : lieu Cestas, 44,74 · −0,68,
 * température courante 28°, 22 points horaires, 7 jours.
 *
 * Seules les températures et symboles de condition suivent le mockup au
 * chiffre près ; les champs que le mockup calcule lui-même de façon
 * procédurale (`enrichir()` : UV, vent, pluie horaire) sont ici des valeurs
 * d'auteur plausibles, pas des données recopiées — documenté dans
 * DECISIONS.md.
 */

export const CESTAS_COORDONNEES = { latitude: 44.74, longitude: -0.68 };

export const CESTAS_COURANT: ForecaReponseCourante = {
  current: {
    time: '2026-09-19T15:00:00+02:00',
    temperature: 28,
    feelsLikeTemp: 28,
    symbol: 'd000',
    windSpeed: 12,
    windDir: 220,
    relHumidity: 45,
    pressure: 1015,
    uvIndex: 6,
    precipRate: 0,
    precipProb: 0,
    dewPoint: 15,
    visibility: 25000,
  },
};

// [heure du jour, température °C, symbole Foreca] — recopié de H_JOUR (mockup).
// Les jalons "lever"/"coucher" du mockup sont une insertion applicative (phase 5),
// pas une donnée Foreca : ces deux points redeviennent des conditions "dégagé" ordinaires ici.
const HORAIRE_BRUT: Array<[heure: string, temperatureC: number, symbole: string]> = [
  ['15:00', 28, 'd000'],
  ['16:00', 28, 'd000'],
  ['17:00', 28, 'd000'],
  ['18:00', 28, 'd000'],
  ['19:00', 27, 'd000'],
  ['20:00', 24, 'd000'],
  ['21:00', 22, 'n000'],
  ['22:00', 20, 'n000'],
  ['23:00', 18, 'n000'],
  ['00:00', 18, 'n000'],
  ['01:00', 17, 'n000'],
  ['02:00', 16, 'n000'],
  ['03:00', 16, 'n000'],
  ['04:00', 15, 'n000'],
  ['05:00', 14, 'n000'],
  ['07:00', 13, 'd000'],
  ['08:00', 13, 'd000'],
  ['09:00', 16, 'd000'],
  ['10:00', 20, 'd000'],
  ['11:00', 24, 'd200'],
  ['12:00', 26, 'd200'],
  ['13:00', 29, 'd000'],
];

function construireHeureIso(index: number, heure: string): string {
  const [h, m] = heure.split(':').map(Number);
  const jourSuivant = index >= 9; // à partir de 00:00 (après 23h), on bascule au jour suivant
  const jour = jourSuivant ? '2026-09-20' : '2026-09-19';
  return `${jour}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00+02:00`;
}

export const CESTAS_HORAIRE: ForecaReponseHoraire = {
  forecast: HORAIRE_BRUT.map(([heure, temperature, symbol], index): ForecaPeriodeHoraire => {
    const estNuit = symbol.startsWith('n');
    return {
      time: construireHeureIso(index, heure),
      temperature,
      feelsLikeTemp: temperature,
      symbol,
      windSpeed: 8 + ((index * 7) % 20),
      windDir: (index * 37) % 360,
      relHumidity: estNuit ? 65 : 45,
      pressure: 1015,
      uvIndex: estNuit ? 0 : Math.max(0, Math.round(6 * Math.sin((Math.PI * (index + 1)) / 24))),
      precipRate: 0,
      precipProb: 0,
      precipAccum: 0,
      snowAccum: 0,
      dewPoint: estNuit ? 13 : 15,
      visibility: 25000,
    };
  }),
};

// [jour ISO, min, max, symbole] — recopié de SEPT (mockup), 7 jours à partir du samedi 19/09/2026.
const QUOTIDIEN_BRUT: Array<[date: string, min: number, max: number, symbole: string]> = [
  ['2026-09-19', 13, 28, 'd000'],
  ['2026-09-20', 14, 31, 'd200'],
  ['2026-09-21', 14, 34, 'd000'],
  ['2026-09-22', 16, 33, 'd000'],
  ['2026-09-23', 14, 24, 'd200'],
  ['2026-09-24', 10, 24, 'd200'],
  ['2026-09-25', 12, 24, 'd410'],
];

export const CESTAS_QUOTIDIEN: ForecaReponseQuotidienne = {
  forecast: QUOTIDIEN_BRUT.map(([date, minTemp, maxTemp, symbol]): ForecaPeriodeQuotidienne => ({
    date,
    minTemp,
    maxTemp,
    symbol,
    maxWindSpeed: 22,
    windDir: 210,
    precipAccum: symbol === 'd410' ? 3.2 : 0,
  })),
};

// Qualité de l'air (phase 7, endpoint séparé, §4.1) : valeurs d'auteur plausibles
// (AQI américain, converties par `eaqiDepuisAqiUs`) — le mockup ne documente pas
// cette métrique, absente de ses fixtures d'origine. Polluant dominant alterné
// jour/nuit (ozone le jour, particules la nuit — schéma réel courant) pour que
// la vue détaillée (§11, post-livraison) ait quelque chose à distinguer entre
// les points plutôt qu'un unique polluant répété partout.
export const CESTAS_AIR: ForecaReponseQualiteAir = {
  forecast: HORAIRE_BRUT.map(([heure, , symbole], index) => {
    const aqi = 30 + ((index * 5) % 40);
    const estNuit = symbole.startsWith('n');
    return {
      time: construireHeureIso(index, heure),
      AQI: aqi,
      pollutant: estNuit ? 'Fine Particulate Matter' : 'Ozone',
      pollutantPhrase: estNuit ? 'particules fines' : 'ozone',
      AQI_O3: estNuit ? Math.round(aqi * 0.4) : aqi,
      AQI_NO2: Math.round(aqi * 0.3),
      AQI_SO2: Math.round(aqi * 0.1),
      AQI_CO: Math.round(aqi * 0.2),
      AQI_PM10: Math.round(aqi * 0.5),
      AQI_PM2P5: estNuit ? aqi : Math.round(aqi * 0.6),
    };
  }),
};

// Scénario « vigies » : aucune vigilance active.
export const CESTAS_ALERTES: ForecaReponseAvertissements = { warnings: [] };

export const CESTAS_PHRASE = 'Ciel dégagé pendant la prochaine heure.';
