const CACHE_NAME = 'euclides-test-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/Logo.png',
  '/avatar_astro.jpg',
  '/avatar_cyber.jpg',
  '/avatar_einstein.jpg',
  '/avatar_pixel.jpg'
];

/**
 * Evento de instalação do Service Worker.
 * Abre o cache do PWA e baixa previamente os arquivos estáticos essenciais listados.
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

/**
 * Evento de ativação do Service Worker.
 * Limpa versões de cache antigas armazenadas no navegador e assume o controle das abas imediatamente.
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

/**
 * Intercepta requisições de rede.
 * Aplica a estratégia Stale-While-Revalidate: retorna do cache se disponível para carregamento
 * instantâneo e atualiza o cache em segundo plano buscando na rede.
 */
self.addEventListener('fetch', (event) => {
  // Only intercept GET requests from the same origin to avoid cors and post errors
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip caching API calls so that dynamic data remains fresh
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch in background to update cache (stale-while-revalidate)
        fetch(event.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return networkResponse;
      }).catch(() => {
        // Return cached page or fail gracefully
      });
    })
  );
});
