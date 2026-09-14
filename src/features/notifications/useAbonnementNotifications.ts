import { useEffect, useState } from 'react';
import { abonnerNotifications, desabonnerNotifications, estAbonneNotifications } from '../../lib/push';
import { useMagasinUi } from '../../lib/magasin';
import { estAutonome, estIosDispositif } from '../../lib/plateforme';

interface LieuAbonnement {
  latitude: number;
  longitude: number;
  nomLieu: string;
}

interface EtatAbonnement {
  /** État réel de l'abonnement navigateur (`PushManager`), pas une préférence enregistrée à part (§8, principe déjà appliqué à « Position en direct » : jamais un faux interrupteur). `null` tant que la vérification initiale (asynchrone) n'a pas répondu. */
  abonne: boolean | null;
  enCours: boolean;
  erreur: string | null;
  /** Bascule l'abonnement. Sur iOS hors mode autonome, ouvre la feuille d'installation au lieu de demander une permission qui échouerait en silence (§10). */
  basculer: () => void;
}

export function useAbonnementNotifications(lieu: LieuAbonnement): EtatAbonnement {
  const [abonne, setAbonne] = useState<boolean | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const forcerInstallation = useMagasinUi((etat) => etat.forcerInstallation);

  useEffect(() => {
    // Lecture seule (§7, §9) : vérifie l'état réel, ne demande jamais de permission au montage.
    void estAbonneNotifications().then(setAbonne);
  }, []);

  function basculer(): void {
    if (estIosDispositif() && !estAutonome()) {
      // Le Web Push exige l'installation sur iOS (§10) : la feuille d'installation
      // remplace la demande, qui échouerait en silence dans Safari.
      forcerInstallation();
      return;
    }

    setEnCours(true);
    setErreur(null);
    const action = abonne ? desabonnerNotifications() : abonnerNotifications(lieu);
    action
      .then(() => setAbonne((etat) => !etat))
      .catch((e: unknown) => setErreur(e instanceof Error ? e.message : String(e)))
      .finally(() => setEnCours(false));
  }

  return { abonne, enCours, erreur, basculer };
}
