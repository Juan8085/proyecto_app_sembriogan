const CACHE_NAME = 'sembriogan-vet-v6'; // Subimos a v6 para forzar el reinicio total

// RUTAS RELATIVAS
const urlsToCache = [
    './',
    './index.html',
    './dashboard.html',
    './registro.html',
    './catalogo.html', // Añadido
    './chat.html',     // Añadido el asistente IA
    './css/styles.css',
    './js/login.js',
    './img/logo.png',
    './manifest.json'
];

self.addEventListener('install', event => {
    self.skipWaiting(); 
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log(`Cacheando PWA (${CACHE_NAME})...`);
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
        // ignoreSearch: true evita que pequeños cambios en la URL engañen al caché
        caches.match(event.request, { ignoreSearch: true })
            .then(response => {
                // 2. Si el archivo está en el caché, lo devuelve inmediatamente
                if (response) return response;

                // 3. Si no está, lo busca en internet
                return fetch(event.request).then(fetchResponse => {
                    // CACHÉ DINÁMICO: Guarda automáticamente en caché cualquier archivo nuevo que se visite
                    return caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, fetchResponse.clone());
                        return fetchResponse;
                    });
                }).catch(() => {
                    // 4. SI NO HAY INTERNET (OFFLINE)
                    if (event.request.mode === 'navigate') {
                        const url = new URL(event.request.url);
                        
                        // Fallbacks blindados para cada vista de la App
                        if (url.pathname.includes('registro')) return caches.match('./registro.html');
                        if (url.pathname.includes('catalogo')) return caches.match('./catalogo.html');
                        if (url.pathname.includes('chat')) return caches.match('./chat.html');
                        if (url.pathname.includes('dashboard')) return caches.match('./dashboard.html');
                        
                        // Por defecto devuelve al inicio
                        return caches.match('./index.html');
                    }
                });
            })
    );
});