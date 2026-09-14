import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { definirBadgeVigilance } from '../../src/lib/badge';

/**
 * §11 : badge d'application reflétant la vigilance officielle active,
 * visible même l'application fermée — un signal que la notification
 * quotidienne (§10) ne couvre pas seule.
 */
describe('definirBadgeVigilance (§11)', () => {
  let setAppBadge: ReturnType<typeof vi.fn>;
  let clearAppBadge: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setAppBadge = vi.fn().mockResolvedValue(undefined);
    clearAppBadge = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { setAppBadge, clearAppBadge });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('efface le badge quand la vigilance retombe à « aucune »', () => {
    definirBadgeVigilance('aucune');
    expect(clearAppBadge).toHaveBeenCalledOnce();
    expect(setAppBadge).not.toHaveBeenCalled();
  });

  it.each([
    ['jaune', 1],
    ['orange', 2],
    ['rouge', 3],
  ] as const)('pose le badge %s avec la priorité %i', (niveau, priorite) => {
    definirBadgeVigilance(niveau);
    expect(setAppBadge).toHaveBeenCalledWith(priorite);
    expect(clearAppBadge).not.toHaveBeenCalled();
  });

  it('ne plante jamais quand l’API Badging n’est pas exposée (Safari)', () => {
    Object.assign(navigator, { setAppBadge: undefined, clearAppBadge: undefined });
    expect(() => definirBadgeVigilance('rouge')).not.toThrow();
    expect(() => definirBadgeVigilance('aucune')).not.toThrow();
  });

  it('n’étouffe pas un rejet de la promesse renvoyée par le navigateur', async () => {
    setAppBadge.mockRejectedValueOnce(new Error('refusé'));
    expect(() => definirBadgeVigilance('orange')).not.toThrow();
    // Laisse le microtask de rejet s'exécuter sans qu'il remonte en rejet non intercepté.
    await Promise.resolve();
    await Promise.resolve();
  });
});
