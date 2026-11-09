// Retire the legacy cache without touching IndexedDB learning progress.
self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    await caches.delete('ascent-v1');
    await self.clients.claim();
    await self.registration.unregister();
  })());
});
