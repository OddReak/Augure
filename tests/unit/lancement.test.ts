import { describe, expect, it, vi } from 'vitest';

/**
 * `lib/lancement.ts` (§7, phase 11) : le mouvement orchestré du lancement ne
 * doit jouer qu'une seule fois par exécution de l'application. Le module est
 * réimporté isolément (`vi.resetModules`) à chaque test pour repartir d'un
 * drapeau non consommé — exactement l'état d'un vrai lancement.
 */
describe('lancementAJouer (§7, mouvement orchestré)', () => {
  it('répond vrai au tout premier appel, faux ensuite', async () => {
    vi.resetModules();
    const { lancementAJouer } = await import('../../src/lib/lancement');
    expect(lancementAJouer()).toBe(true);
    expect(lancementAJouer()).toBe(false);
    expect(lancementAJouer()).toBe(false);
  });

  it('reste faux pour tout remontage ultérieur du même module (pas de rejeu)', async () => {
    vi.resetModules();
    const { lancementAJouer } = await import('../../src/lib/lancement');
    lancementAJouer();
    for (let i = 0; i < 5; i++) {
      expect(lancementAJouer()).toBe(false);
    }
  });
});
