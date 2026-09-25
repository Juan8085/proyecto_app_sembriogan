const CACHE_NAME = 'sembriogan-vet-v5'; // Cambiamos la versión para forzar actualización

// RUTAS RELATIVAS (El punto inicial es la clave para Live Server)
const urlsToCache = [
    './',
    './index.html',
    './dashboard.html',
    './registro.html',
    './css/styles.css',
    './js/login.js',
    './img/logo.png',
    './manifest.json',
    './catalogo.html'
];

self.addEventListener('install', event => {
    self.skipWaiting(); 
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cacheando PWA (Versión 4)...');
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Borrando caché antiguo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim(); 
});

self.addEventListener('fetch', event => {
    // 1. Ignorar la API del backend para que no intente cachearla
    if (event.request.url.includes('/api/')) return;

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // 2. Si el archivo está en el caché, lo devuelve (Incluso sin internet)
                if (response) return response;

                // 3. Si no está, va a internet
                return fetch(event.request).catch(() => {
                    // 4. Si internet falla (offline), intercepta la navegación y sirve las páginas base
                    if (event.request.mode === 'navigate') {
                        const url = new URL(event.request.url);
                        if (url.pathname.includes('registro')) return caches.match('./registro.html');
                        if (url.pathname.includes('dashboard')) return caches.match('./dashboard.html');
                        return caches.match('./index.html');
                    }
                });
            })
    );
});