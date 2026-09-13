/**
 * Conversion de l'AQI américain (EPA), fourni par Foreca (§4.1), vers la
 * bande EAQI européenne à six niveaux qu'impose l'affichage (§5.2,
 * `ECH_AIR`). Les deux barèmes ne sont pas mathématiquement équivalents
 * (méthodologies et polluants pondérés différemment) : cette fonction fait
 * correspondre les catégories qualitatives dans l'ordre — « Good » ↔ bon,
 * « Hazardous » ↔ extrême — plutôt que de convertir une valeur continue.
 *
 * Seuils EPA (0-50 Good, 51-100 Moderate, 101-150 Unhealthy for Sensitive
 * Groups, 151-200 Unhealthy, 201-300 Very Unhealthy, 301-500 Hazardous) :
 * connaissance publique de la norme, pas une lecture Foreca.
 *
 * Non vérifié en réel (JOURNAL.md, phase 7) : à corriger si une réponse
 * Foreca réelle expose plutôt les concentrations brutes des polluants, ce
 * qui permettrait de calculer l'EAQI selon le barème officiel de l'Agence
 * européenne de l'environnement au lieu de cette correspondance ordinale.
 */
export function eaqiDepuisAqiUs(aqiUs: number): number {
  if (aqiUs <= 50) return 1;
  if (aqiUs <= 100) return 2;
  if (aqiUs <= 150) return 3;
  if (aqiUs <= 200) return 4;
  if (aqiUs <= 300) return 5;
  return 6;
}
