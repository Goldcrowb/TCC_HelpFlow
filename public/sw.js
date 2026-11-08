/* Service worker do HelpFlow: somente arquivos estáticos.
   Nunca armazena API, login, cookies ou respostas privadas no cache. */
const CACHE = 'helpflow-app-v2';
const PRINCIPAIS = ['/', '/index.html', '/manifest.webmanifest'];
self.addEventListener('install', (evento) => {
  evento.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRINCIPAIS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (evento) => {
  evento.waitUntil(Promise.all([
    caches.keys().then((chaves) => Promise.all(chaves.filter((chave) => chave !== CACHE).map((chave) => caches.delete(chave)))),
    self.clients.claim()
  ]));
});
self.addEventListener('fetch', (evento) => {
  const req = evento.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
  if (req.mode === 'navigate') {
    evento.respondWith(fetch(req).then((resp) => {
      if (resp.ok) { const copia = resp.clone(); void caches.open(CACHE).then((cache) => cache.put('/index.html', copia)); }
      return resp;
    }).catch(() => caches.match('/index.html')));
    return;
  }
  evento.respondWith(caches.match(req).then((cacheado) => cacheado || fetch(req).then((resp) => {
    if (resp.ok) { const copia = resp.clone(); void caches.open(CACHE).then((cache) => cache.put(req, copia)); }
    return resp;
  })));
});
