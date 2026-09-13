import type { ForecaReponseAvertissements, ForecaReponseCourante, ForecaReponseQuotidienne } from '../../api/foreca-types';
import type { Lieu } from '../../domain/types';
import { CESTAS_COORDONNEES, CESTAS_COURANT, CESTAS_QUOTIDIEN } from './cestas';

/**
 * Six lieux de démonstration, un par palier — reproduit tel quel le tableau
 * `LIEUX` de `design/mockup.html` (« six villes, six ambiances, aucune
 * légende nécessaire ») : mêmes noms, mêmes températures, mêmes min/max.
 * Les coordonnées et les codes symboles Foreca sont d'auteur (le mockup ne
 * donne que le nom et le palier) — choisis pour que `signeDuSymboleForeca`
 * et `palierDuSymboleForeca` (§ phase 2) retombent exactement sur le palier
 * annoncé, vérifié par `tests/unit/demo-lieux.test.ts`.
 */

export interface LieuDemo {
  lieu: Lieu;
  courant: ForecaReponseCourante;
  quotidien: ForecaReponseQuotidienne;
  alertes: ForecaReponseAvertissements;
}

const SANS_ALERTE: ForecaReponseAvertissements = { warnings: [] };

export const LIEUX_DEMO: LieuDemo[] = [
  {
    // vigies — recopié de la fixture Cestas existante (phase 3), pas dupliqué.
    lieu: { nom: 'Cestas', coordonnees: CESTAS_COORDONNEES },
    courant: CESTAS_COURANT,
    quotidien: CESTAS_QUOTIDIEN,
    alertes: SANS_ALERTE,
  },
  {
    // ondee — pluie continue (taux=1, type=0).
    lieu: { nom: 'Rennes', region: 'Ille-et-Vilaine', coordonnees: { latitude: 48.11, longitude: -1.68 } },
    courant: {
      current: {
        time: '2026-09-19T17:00:00+02:00',
        temperature: 17,
        feelsLikeTemp: 15,
        symbol: 'd310',
        windSpeed: 14,
        windDir: 250,
        relHumidity: 82,
        pressure: 1008,
        uvIndex: 1,
        precipRate: 0.6,
        precipProb: 80,
      },
    },
    quotidien: {
      forecast: [
        { date: '2026-09-19', minTemp: 12, maxTemp: 18, symbol: 'd310', maxWindSpeed: 30, windDir: 250, precipAccum: 4 },
      ],
    },
    alertes: SANS_ALERTE,
  },
  {
    // veille — nuit dégagée (préfixe n, sans précipitation).
    lieu: { nom: 'Annecy', region: 'Haute-Savoie', coordonnees: { latitude: 45.9, longitude: 6.13 } },
    courant: {
      current: {
        time: '2026-09-19T23:00:00+02:00',
        temperature: 16,
        feelsLikeTemp: 16,
        symbol: 'n000',
        windSpeed: 4,
        windDir: 180,
        relHumidity: 70,
        pressure: 1018,
        uvIndex: 0,
        precipRate: 0,
        precipProb: 0,
      },
    },
    quotidien: {
      forecast: [
        { date: '2026-09-19', minTemp: 11, maxTemp: 24, symbol: 'n000', maxWindSpeed: 10, windDir: 180, precipAccum: 0 },
      ],
    },
    alertes: SANS_ALERTE,
  },
  {
    // colere — orage (taux=4) et vigilance orange active.
    lieu: { nom: 'Toulouse', region: 'Haute-Garonne', coordonnees: { latitude: 43.6, longitude: 1.44 } },
    courant: {
      current: {
        time: '2026-09-19T17:00:00+02:00',
        temperature: 31,
        feelsLikeTemp: 35,
        symbol: 'd240',
        windSpeed: 22,
        windDir: 200,
        relHumidity: 55,
        pressure: 1005,
        uvIndex: 5,
        precipRate: 3,
        precipProb: 90,
      },
    },
    quotidien: {
      forecast: [
        { date: '2026-09-19', minTemp: 20, maxTemp: 34, symbol: 'd240', maxWindSpeed: 60, windDir: 200, precipAccum: 12 },
      ],
    },
    alertes: {
      warnings: [
        {
          id: 'orage-toulouse',
          significance: 'orange',
          type: 'orage',
          from: '2026-09-19T15:00:00+02:00',
          to: '2026-09-19T21:00:00+02:00',
          description: 'Orages violents attendus, rafales possibles.',
        },
      ],
    },
  },
  {
    // cendre — neige continue (taux=3, type=2).
    lieu: { nom: 'Chamonix', region: 'Haute-Savoie', coordonnees: { latitude: 45.92, longitude: 6.87 } },
    courant: {
      current: {
        time: '2026-09-19T17:00:00+02:00',
        temperature: 2,
        feelsLikeTemp: -1,
        symbol: 'd032',
        windSpeed: 10,
        windDir: 300,
        relHumidity: 88,
        pressure: 1012,
        uvIndex: 1,
        precipRate: 0.4,
        precipProb: 70,
      },
    },
    quotidien: {
      forecast: [
        { date: '2026-09-19', minTemp: -3, maxTemp: 4, symbol: 'd032', maxWindSpeed: 25, windDir: 300, precipAccum: 6 },
      ],
    },
    alertes: SANS_ALERTE,
  },
  {
    // fournaise — température ≥ 34 °C (dégagé sinon : le seuil de température prime, §5.2).
    lieu: { nom: 'Séville', region: 'Andalousie', coordonnees: { latitude: 37.39, longitude: -5.99 } },
    courant: {
      current: {
        time: '2026-09-19T17:00:00+02:00',
        temperature: 39,
        feelsLikeTemp: 41,
        symbol: 'd000',
        windSpeed: 8,
        windDir: 150,
        relHumidity: 20,
        pressure: 1013,
        uvIndex: 9,
        precipRate: 0,
        precipProb: 0,
      },
    },
    quotidien: {
      forecast: [
        { date: '2026-09-19', minTemp: 24, maxTemp: 41, symbol: 'd000', maxWindSpeed: 15, windDir: 150, precipAccum: 0 },
      ],
    },
    alertes: SANS_ALERTE,
  },
];
