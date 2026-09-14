/**
 * Formes brutes des réponses Foreca (§4.1).
 *
 * Enveloppes (`current` / `forecast` / `locations` / `warnings`) vérifiées en
 * phase 7 contre une source indépendante du document maître : le client
 * open-source `mr-ransel/ha-foreca-weather` (intégration Home Assistant pour
 * l'API RapidAPI de Foreca), dont le code interroge exactement les mêmes
 * routes que celles listées ici et lit `data.current`, `data.forecast`,
 * `data.locations` — et la documentation publique de
 * corporate.foreca.com/en/api-technical-details (recherche web, phase 7).
 * Ceci corrige l'hypothèse de la phase 3 (`hourly`/`daily` comme clés
 * d'enveloppe) : Foreca utilise en réalité `forecast` pour les deux, la
 * distinction se faisant par l'URL de la requête, pas par le corps de la
 * réponse.
 *
 * Restent des hypothèses non confirmées par un exemple de réponse réel
 * (marqué dans JOURNAL.md, à corriger dès qu'une clé et une vraie réponse
 * sont disponibles) : la forme exacte de `warning/{location}` (l'existence
 * des champs `significance`/`type`/`from`/`to` est déduite de la description
 * textuelle de corporate.foreca.com/en/weather-data/weather-warnings-details,
 * pas d'un JSON observé).
 *
 * `current`/`forecast`/`air-quality` en revanche sont désormais vérifiés
 * contre de vraies réponses (§11, post-livraison, une clé Foreca étant
 * devenue disponible) : les noms de champs ci-dessous sont recopiés
 * verbatim d'appels réels, pas déduits. Point notable, qui a produit un bug
 * réel avant sa découverte (JOURNAL.md) : `forecast/hourly` et
 * `forecast/daily` ne renvoient `uvIndex`/`relHumidity`/`pressure`/`dewPoint`/
 * `visibility` (et une dizaine d'autres champs) que si la requête porte
 * `dataset=full` (`api/hourly.ts`, `api/daily.ts`) — `current` les renvoie
 * par défaut, sans ce paramètre.
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
  /** Point de rosée (§11, post-livraison — vérifié en réel, présent sans paramètre supplémentaire). */
  dewPoint: number;
  /** Visibilité en mètres (§11, idem). */
  visibility: number;
}

export interface ForecaReponseCourante {
  current: ForecaPeriodeCourante;
}

export interface ForecaPeriodeHoraire extends ForecaPeriodeCourante {
  precipAccum: number;
  snowAccum: number;
}

export interface ForecaReponseHoraire {
  forecast: ForecaPeriodeHoraire[];
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
  forecast: ForecaPeriodeQuotidienne[];
}

/**
 * Recherche de lieux (`location/search/{query}`). Champs vérifiés contre
 * corporate.foreca.com/en/api-technical-details (§ « Using location name to
 * search for weather forecast ») : chaque résultat porte un `id` réutilisable
 * tel quel comme `{location}` (§4.1, voie « identifiant »).
 */
export interface ForecaLieu {
  id: string;
  name: string;
  country?: string;
  adminArea?: string;
  lat: number;
  lon: number;
}

export interface ForecaReponseRecherche {
  locations: ForecaLieu[];
}

/**
 * Qualité de l'air (`air-quality/forecast/hourly/{location}`), vérifiée en
 * réel (§11, post-livraison) : `AQI` est bien le barème **américain EPA**
 * (0-500), confirmé par corporate.foreca.com et par une vraie réponse — pas
 * l'EAQI européen que le document maître impose à l'affichage (§5.2), un
 * écart réel entre méthodologies. `src/domain/qualiteAir.ts` fait la
 * conversion ordinale ; voir DECISIONS.md.
 *
 * `AQI` est le maximum des six sous-indices par polluant ci-dessous (aussi
 * sur le barème EPA 0-500 chacun) — `pollutant`/`pollutantPhrase` nomment
 * celui qui domine. Alimente la vue détaillée de la qualité de l'air
 * (`src/app/QualiteAir.tsx`, §11).
 */
export interface ForecaPeriodeQualiteAir {
  time: string;
  AQI: number;
  pollutant: string;
  pollutantPhrase: string;
  AQI_CO: number;
  AQI_NO2: number;
  AQI_O3: number;
  AQI_SO2: number;
  AQI_PM10: number;
  AQI_PM2P5: number;
}

export interface ForecaReponseQualiteAir {
  forecast: ForecaPeriodeQualiteAir[];
}

/**
 * Avertissements officiels (`warning/{location}`). Forme déduite de la
 * description textuelle de Foreca (« generic significance level, generic
 * warning class, detailed event description ») — aucun exemple JSON observé,
 * noms de champs choisis par cohérence avec le reste de l'API (`from`/`to`
 * comme les autres endpoints temporels). À corriger en priorité dès qu'une
 * vraie réponse est enregistrée.
 */
export interface ForecaAvertissement {
  id: string;
  significance: string;
  type: string;
  from: string;
  to: string;
  description?: string;
}

export interface ForecaReponseAvertissements {
  warnings: ForecaAvertissement[];
}
