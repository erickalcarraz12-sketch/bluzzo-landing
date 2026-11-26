// Service worker del panel: muestra las notificaciones push
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { titulo: 'Bluzzo', cuerpo: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.titulo || 'Bluzzo', {
    body: d.cuerpo || '', icon: '/img/icon-192.png', badge: '/img/icon-192.png', tag: d.tag || undefined, data: { url: d.url || '/admin' }
  }));
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const u = (e.notification.data && e.notification.data.url) || '/admin';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((l) => {
    for (const c of l) { if (c.url.indexOf('/admin') > -1 && 'focus' in c) return c.focus(); }
    return self.clients.openWindow(u);
  }));
});
