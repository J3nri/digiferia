// Service worker SOLO para el panel admin (alcance: /admin).
// No toca la web de los feriantes ni guarda datos de Supabase:
// siempre pide la versión nueva y usa la copia guardada solo si no hay señal.
const CACHE = 'df-admin-v1';
const ARCHIVOS = ['/admin.html', '/admin-192.png', '/admin-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('df-admin-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  // Supabase, fuentes y todo lo externo pasa directo, sin guardarse.
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  e.respondWith(
    fetch(req)
      .then(res => {
        if (res.ok) {
          const copia = res.clone();
          caches.open(CACHE).then(c => c.put(req, copia));
        }
        return res;
      })
      .catch(() => caches.match(req).then(r => r || caches.match('/admin.html')))
  );
});
