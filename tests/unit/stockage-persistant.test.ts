import { describe, expect, it, vi } from 'vitest';
import { demanderStockagePersistant } from '../../src/lib/stockagePersistant';

function stubStorage(impl: Partial<StorageManager> | undefined): void {
  Object.defineProperty(navigator, 'storage', { value: impl, configurable: true });
}

describe('demanderStockagePersistant (§7 : navigator.storage.persist() au premier lancement)', () => {
  it('ne redemande rien si le stockage est déjà persistant', async () => {
    const persist = vi.fn();
    stubStorage({ persisted: vi.fn().mockResolvedValue(true), persist });

    await expect(demanderStockagePersistant()).resolves.toBe(true);
    expect(persist).not.toHaveBeenCalled();
  });

  it('appelle persist() si le stockage ne l’est pas encore, renvoie sa réponse', async () => {
    const persist = vi.fn().mockResolvedValue(true);
    stubStorage({ persisted: vi.fn().mockResolvedValue(false), persist });

    await expect(demanderStockagePersistant()).resolves.toBe(true);
    expect(persist).toHaveBeenCalledOnce();
  });

  it('rapporte un refus sans planter', async () => {
    stubStorage({ persisted: vi.fn().mockResolvedValue(false), persist: vi.fn().mockResolvedValue(false) });
    await expect(demanderStockagePersistant()).resolves.toBe(false);
  });

  it('renvoie false sans planter sur un navigateur qui ne connaît pas l’API', async () => {
    stubStorage(undefined);
    await expect(demanderStockagePersistant()).resolves.toBe(false);
  });
});
