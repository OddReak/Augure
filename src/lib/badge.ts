import type { NiveauVigilance } from '../domain/types';

const PRIORITE_VIGILANCE: Record<NiveauVigilance, number> = { aucune: 0, jaune: 1, orange: 2, rouge: 3 };

/**
 * Badge d'application (§11, finition) : reflète la vigilance officielle
 * active sur l'icône, visible même l'application fermée ou en arrière-plan
 * (Badging API) — un signal que la notification quotidienne (§10) ne couvre
 * pas seule, celle-ci n'étant envoyée qu'une fois par jour à heure fixe. Le
 * nombre posé est la priorité du niveau (jaune = 1 … rouge = 3, voir
 * `PRIORITE_VIGILANCE` de `api/foreca.ts`, dupliquée ici pour ne pas faire
 * dépendre `lib/` de `api/`) : plus informatif qu'un simple point pour qui
 * regarde son écran d'accueil sans ouvrir l'application.
 *
 * Silencieux si l'API n'est pas exposée par le navigateur (Safari ne
 * l'implémente pas à ce jour, voir MDN) — jamais d'erreur non interceptée
 * pour une amélioration progressive.
 */
export function definirBadgeVigilance(niveau: NiveauVigilance): void {
  if (typeof navigator === 'undefined') {
    return;
  }
  if (niveau === 'aucune') {
    if (typeof navigator.clearAppBadge === 'function') {
      void navigator.clearAppBadge().catch(() => {});
    }
    return;
  }
  if (typeof navigator.setAppBadge === 'function') {
    void navigator.setAppBadge(PRIORITE_VIGILANCE[niveau]).catch(() => {});
  }
}
