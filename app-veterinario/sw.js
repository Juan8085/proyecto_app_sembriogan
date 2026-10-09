const CACHE_NAME = 'sembriogan-vet-v9';

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

// --- SISTEMA DE NOTIFICACIONES PUSH ---

// 1. Escuchar cuando llega una notificación desde el servidor
self.addEventListener('push', event => {
    // Extraemos los datos que mandó el Node.js
    const data = event.data ? event.data.json() : { title: 'Alerta Sembriogan', body: 'Tienes una nueva notificación' };
    
    const opciones = {
        body: data.body,
        icon: './img/logo.png', // Tu logo
        badge: './img/logo.png', // Iconito pequeño para la barra de estado
        vibrate: [200, 100, 200, 100, 200, 100, 200], // Patrón de vibración
        data: { url: data.url || './dashboard.html' } // A dónde ir al hacer clic
    };

    // Mostrar la notificación en la pantalla
    event.waitUntil(
        self.registration.showNotification(data.title, opciones)
    );
});

// 2. Escuchar cuando el veterinario TOCA la notificación
self.addEventListener('notificationclick', event => {
    event.notification.close(); // Cerramos la notificación
    
    // Abrimos la PWA en la vista correspondiente
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});