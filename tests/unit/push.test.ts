import { describe, expect, it, vi } from 'vitest';
import { abonnerNotifications, estAbonneNotifications, pushDisponible } from '../../src/lib/push';

function stubNavigator(propriete: 'serviceWorker', valeur: unknown): void {
  Object.defineProperty(navigator, propriete, { value: valeur, configurable: true });
}

// `pushDisponible` lit `'PushManager' in window` / `'Notification' in window` (§10) : les
// stubber sur `navigator` par erreur les laisserait absents de `window`, faussant le test.
function stubWindow(propriete: 'PushManager' | 'Notification', valeur: unknown): void {
  Object.defineProperty(window, propriete, { value: valeur, configurable: true });
}

describe('push (§10)', () => {
  describe('pushDisponible', () => {
    it('faux si le navigateur ne connaît pas serviceWorker/PushManager/Notification', () => {
      stubNavigator('serviceWorker', undefined);
      expect(pushDisponible()).toBe(false);
    });

    it('vrai quand les trois API existent', () => {
      stubNavigator('serviceWorker', {});
      stubWindow('Notification', class {});
      stubWindow('PushManager', class {});
      expect(pushDisponible()).toBe(true);
    });
  });

  describe('estAbonneNotifications — lecture seule, jamais de demande de permission (§7, §9)', () => {
    it('faux si Push est indisponible', async () => {
      stubNavigator('serviceWorker', undefined);
      await expect(estAbonneNotifications()).resolves.toBe(false);
    });

    it('faux sans inscription de service worker', async () => {
      stubNavigator('serviceWorker', { getRegistration: vi.fn().mockResolvedValue(undefined) });
      stubWindow('Notification', class {});
      stubWindow('PushManager', class {});
      await expect(estAbonneNotifications()).resolves.toBe(false);
    });

    it('vrai avec un abonnement Push actif', async () => {
      stubNavigator('serviceWorker', {
        getRegistration: vi.fn().mockResolvedValue({
          pushManager: { getSubscription: vi.fn().mockResolvedValue({ endpoint: 'https://push.exemple/x' }) },
        }),
      });
      stubWindow('Notification', class {});
      stubWindow('PushManager', class {});
      await expect(estAbonneNotifications()).resolves.toBe(true);
    });
  });

  describe('abonnerNotifications — garde-fous avant toute demande de permission', () => {
    it('échoue explicitement sans configuration Supabase (VITE_SUPABASE_URL absent) — état réel du projet tant que la phase 10 n’a pas de clés', async () => {
      await expect(abonnerNotifications({ latitude: 44.74, longitude: -0.68, nomLieu: 'Cestas' })).rejects.toThrow(
        /Supabase non configuré/,
      );
    });
  });
});
