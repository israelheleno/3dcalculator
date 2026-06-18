const CACHE_NAME = 'calc3d-v5.1';
const urlsToCache = [
  '/3dcalculator/',
  '/3dcalculator/index.html',
  '/3dcalculator/style.css',
  '/3dcalculator/app.js',
  '/3dcalculator/manifest.json',
  '/3dcalculator/privacidade.html',
  '/3dcalculator/icon-192.png',
  '/3dcalculator/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});