import { useQuery } from '@tanstack/react-query';
import { adapterConditionCourante, adapterQuotidien } from '../../api/foreca';
import type { ForecaReponseCourante, ForecaReponseQuotidienne } from '../../api/foreca-types';
import type { IdSigneMeteo } from '../../domain/signes';
import type { CoordonneesGeo, Palier } from '../../domain/types';

interface ResumeLieu {
  palier: Palier;
  signe: IdSigneMeteo;
  temperatureC: number;
  minC?: number;
  maxC?: number;
}

async function recuperer<T>(url: string): Promise<T> {
  const reponse = await fetch(url);
  if (!reponse.ok) throw new Error(`Échec de la requête ${url} (${reponse.status})`);
  return (await reponse.json()) as T;
}

/**
 * Résumé léger d'un lieu pour une vignette (§6, `ecranLieux()`) : condition
 * courante + min/max du jour, sans la frise horaire complète — la vignette
 * n'affiche ni l'un ni l'autre. Chaque vignette porte son propre
 * `data-palier` (§5.2), calculé indépendamment des autres.
 */
export function useResumeLieu(coordonnees: CoordonneesGeo) {
  return useQuery<ResumeLieu>({
    queryKey: ['resume-lieu', coordonnees.latitude, coordonnees.longitude],
    queryFn: async () => {
      const [courant, quotidien] = await Promise.all([
        recuperer<ForecaReponseCourante>(`/api/current?lat=${coordonnees.latitude}&lon=${coordonnees.longitude}`),
        recuperer<ForecaReponseQuotidienne>(`/api/daily?lat=${coordonnees.latitude}&lon=${coordonnees.longitude}`),
      ]);
      const condition = adapterConditionCourante(courant, '');
      const jourDuJour = adapterQuotidien(quotidien)[0];
      return {
        palier: condition.palier,
        signe: condition.signe,
        temperatureC: condition.temperatureC,
        ...(jourDuJour ? { minC: jourDuJour.temperatureMinC, maxC: jourDuJour.temperatureMaxC } : {}),
      };
    },
    staleTime: 5 * 60_000,
  });
}
