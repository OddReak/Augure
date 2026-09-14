import { useQuery } from '@tanstack/react-query';
import { adapterConditionCourante } from '../../api/foreca';
import type { ForecaReponseCourante } from '../../api/foreca-types';
import type { CoordonneesGeo } from '../../domain/types';

/**
 * Température courante seule, pour une ligne de résultat de recherche (§6 :
 * « les résultats affichent déjà la température, parce qu'un nom de ville
 * seul ne permet pas de choisir entre deux homonymes »). Volontairement plus
 * léger que `useResumeLieu` : pas d'appel `/api/daily` ici, pour ne pas
 * doubler le coût en quota (§4.1) d'une recherche qui affiche plusieurs
 * résultats à la fois.
 */
export function useTemperatureActuelle(coordonnees: CoordonneesGeo) {
  return useQuery({
    queryKey: ['temperature-actuelle', coordonnees.latitude, coordonnees.longitude],
    queryFn: async () => {
      const reponse = await fetch(`/api/current?lat=${coordonnees.latitude}&lon=${coordonnees.longitude}`);
      if (!reponse.ok) throw new Error(`Échec de /api/current (${reponse.status})`);
      const corps = (await reponse.json()) as ForecaReponseCourante;
      const condition = adapterConditionCourante(corps, '');
      return { temperatureC: condition.temperatureC, signe: condition.signe };
    },
    staleTime: 5 * 60_000,
  });
}
