/**
 * Formes brutes des réponses Foreca (§4.1), d'après la documentation
 * publique de developer.foreca.com au moment d'écrire ce module — les noms
 * d'enveloppe (`current`, `hourly`, `daily`) sont une hypothèse raisonnable
 * non confirmée par un exemple de réponse ; à corriger en phase 7 dès que
 * de vraies réponses sont enregistrées (voir DECISIONS.md).
 */

export interface ForecaPeriodeCourante {
  time: string;
  temperature: number;
  feelsLikeTemp: number;
  symbol: string;
  windSpeed: number;
  windDir: number;
  relHumidity: number;
  pressure: number;
  uvIndex: number;
  precipRate: number;
  precipProb: number;
}

export interface ForecaReponseCourante {
  current: ForecaPeriodeCourante;
}

export interface ForecaPeriodeHoraire extends ForecaPeriodeCourante {
  precipAccum: number;
  snowAccum: number;
}

export interface ForecaReponseHoraire {
  hourly: ForecaPeriodeHoraire[];
}

export interface ForecaPeriodeQuotidienne {
  date: string;
  maxTemp: number;
  minTemp: number;
  symbol: string;
  maxWindSpeed: number;
  windDir: number;
  precipAccum: number;
}

export interface ForecaReponseQuotidienne {
  daily: ForecaPeriodeQuotidienne[];
}
