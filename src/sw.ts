/// <reference lib="webworker" />
// Service worker Workbox (`injectManifest`, voir vite.config.ts) : `generateSW`
// ne permet aucun code personnalisé, or la notification quotidienne (§10) a
// besoin d'un gestionnaire `push` pour afficher la notification reçue — sans
// lui, le message livré par le navigateur n'affiche jamais rien (voir
// JOURNAL.md). Le reste (précache, repli de navigation, attente explicite
// de `SKIP_WAITING`) reproduit à l'identique ce que `generateSW` générait
// auparavant (`registerType: 'prompt'`, §9 : jamais de skipWaiting()
// inconditionnel).

import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL, type PrecacheEntry } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';

declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: Array<PrecacheEntry | string> };

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();
registerRoute(new NavigationRoute(createHandlerBoundToURL('/index.html')));

self.addEventListener('message', (evenement) => {
  if (evenement.data && evenement.data.type === 'SKIP_WAITING') self.skipWaiting();
});

interface ChargeNotification {
  title: string;
  body: string;
}

self.addEventListener('push', (evenement) => {
  const charge = (evenement.data?.json() as Partial<ChargeNotification> | undefined) ?? {};
  const titre = charge.title ?? 'Augure';
  evenement.waitUntil(
    self.registration.showNotification(titre, {
      body: charge.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
    }),
  );
});

// Ramène l'utilisateur sur l'application au lieu de laisser la notification
// simplement disparaître au clic (comportement par défaut de la plupart des
// navigateurs sans ce gestionnaire).
self.addEventListener('notificationclick', (evenement) => {
  evenement.notification.close();
  evenement.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((fenetres) => {
      const existante = fenetres.find((f) => 'focus' in f);
      if (existante) return existante.focus();
      return self.clients.openWindow('/');
    }),
  );
});
