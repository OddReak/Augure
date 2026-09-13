import { useQuery } from '@tanstack/react-query';
import {
  adapterAvertissements,
  adapterConditionCourante,
  adapterHoraire,
  adapterQuotidien,
  fusionnerQualiteAir,
  vigilanceMax,
} from '../../api/foreca';
import type {
  ForecaReponseAvertissements,
  ForecaReponseCourante,
  ForecaReponseHoraire,
  ForecaReponseQualiteAir,
  ForecaReponseQuotidienne,
} from '../../api/foreca-types';
import { construireFrise } from '../../domain/frise';
import { decalageDe, versHeureLocale } from '../../domain/fuseau';
import { leverCoucherUtc } from '../../domain/soleil';
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
 * §3). `/api/air` et `/api/alerts` sont tolérants à l'échec : une panne sur
 * l'un ne doit pas faire échouer tout l'écran d'accueil pour une donnée
 * secondaire (qualité de l'air, vigilance) — `Promise.allSettled`, repli sur
 * « rien » plutôt que sur une erreur globale.
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

      const [airEtabli, alertesEtablies] = await Promise.allSettled([
        recuperer<ForecaReponseQualiteAir>(`/api/air?lat=${latitude}&lon=${longitude}`),
        recuperer<ForecaReponseAvertissements>(`/api/alerts?lat=${latitude}&lon=${longitude}`),
      ]);

      const avertissements =
        alertesEtablies.status === 'fulfilled' ? adapterAvertissements(alertesEtablies.value) : [];
      const vigilance = vigilanceMax(avertissements);

      const condition = adapterConditionCourante(
        courant,
        phrasePlaceholder(signeDuSymboleForeca(courant.current.symbol)),
        vigilance,
      );
      const coordonnees = { latitude, longitude };

      let pointsHoraires = adapterHoraire(horaire);
      if (airEtabli.status === 'fulfilled') {
        pointsHoraires = fusionnerQualiteAir(pointsHoraires, airEtabli.value);
      }

      // Lever/coucher réels du jour courant (§6, phase 6 : calcul Meeus — `domain/soleil.ts`),
      // affichés dans le fuseau porté par l'horodatage Foreca lui-même (pas de zone IANA connue
      // pour un couple lat/lon seul). `null` seulement en jour/nuit polaire (hors périmètre France).
      const decalage = decalageDe(condition.horodatage);
      const instants = leverCoucherUtc(new Date(), coordonnees);
      const leverSoleil = instants ? versHeureLocale(instants.leverUtc, decalage) : '--:--';
      const coucherSoleil = instants ? versHeureLocale(instants.coucherUtc, decalage) : '--:--';

      return {
        lieu: { nom: nomLieu, coordonnees },
        courant: condition,
        // Jalons lever/coucher et repères de jour insérés ici (§domain/frise.ts, phase 5/6) :
        // ni l'un ni l'autre ne viennent de Foreca, l'insertion est une seule fois pour tous les écrans.
        horaire: construireFrise(pointsHoraires, coordonnees),
        quotidien: adapterQuotidien(quotidien),
        leverSoleil,
        coucherSoleil,
        avertissements,
      };
    },
  });
}
