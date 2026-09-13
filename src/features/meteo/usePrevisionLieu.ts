import { useQuery } from '@tanstack/react-query';
import { adapterConditionCourante, adapterHoraire, adapterQuotidien } from '../../api/foreca';
import type { ForecaReponseCourante, ForecaReponseHoraire, ForecaReponseQuotidienne } from '../../api/foreca-types';
import { signeDuSymboleForeca } from '../../domain/symboles';
import type { PrevisionLieu } from '../../domain/types';
import { phrasePlaceholder } from './phrase';

interface OptionsPrevision {
  latitude: number;
  longitude: number;
  nomLieu: string;
}

async function recuperer<T>(url: string): Promise<T> {
  const reponse = await fetch(url);
  if (!reponse.ok) {
    throw new Error(`Échec de la requête ${url} (${reponse.status})`);
  }
  return (await reponse.json()) as T;
}

/**
 * Assemble une prévision complète depuis les fonctions `/api/*` (proxy
 * Foreca, phase 7 — servies par les fixtures MSW tant que `VITE_MOCK=1`,
 * §3). La position n'est pas encore branchée sur la chaîne de repli du §7 :
 * `latitude`/`longitude`/`nomLieu` sont pour l'instant fournis par l'appelant.
 */
export function usePrevisionLieu({ latitude, longitude, nomLieu }: OptionsPrevision) {
  return useQuery<PrevisionLieu>({
    queryKey: ['prevision', latitude, longitude],
    queryFn: async () => {
      const [courant, horaire, quotidien] = await Promise.all([
        recuperer<ForecaReponseCourante>(`/api/current?lat=${latitude}&lon=${longitude}`),
        recuperer<ForecaReponseHoraire>(`/api/hourly?lat=${latitude}&lon=${longitude}`),
        recuperer<ForecaReponseQuotidienne>(`/api/daily?lat=${latitude}&lon=${longitude}`),
      ]);

      const condition = adapterConditionCourante(
        courant,
        phrasePlaceholder(signeDuSymboleForeca(courant.current.symbol)),
      );

      return {
        lieu: { nom: nomLieu, coordonnees: { latitude, longitude } },
        courant: condition,
        horaire: adapterHoraire(horaire),
        quotidien: adapterQuotidien(quotidien),
        // Lever/coucher réels arrivent en phase 6 (calcul Meeus) ; valeurs de la fixture en attendant.
        leverSoleil: '07:39',
        coucherSoleil: '20:22',
      };
    },
  });
}
