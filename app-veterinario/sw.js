const CACHE_NAME = 'sembriogan-vet-v1';
const urlsToCache = [
    './',
    './index.html',
    './dashboard.html',
    './js/login.js',
    './js/dashboard.js',
    './manifest.json'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', event => {
    // Si no hay internet, devuelve los archivos guardados en caché
    event.respondWith(
        caches.match(event.request).then(response => response || fetch(event.request))
    );
});