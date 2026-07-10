const CACHE_NAME = 'obs-pas-v3';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './icon-512.png' // Make sure your icon is explicitly cached for offline loading
];

// Install Event: Cache core assets immediately
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(ASSETS_TO_CACHE);
        }).then(() => self.skipWaiting()) 
    );
});

// Activate Event: Clean up old caches and take control immediately
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim()) 
    );
});

// Fetch Event: Network-First for Navigation (HTML), Cache-First for Assets
self.addEventListener('fetch', event => {
    // If the browser is requesting a webpage (index.html)
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then(networkResponse => {
                    // Save the newest version from GitHub/Netlify to the cache
                    return caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });
                })
                .catch(() => {
                    // If offline, serve the last saved version from cache
                    return caches.match(event.request);
                })
        );
        return;
    }

    // For everything else (images, manifest), try the cache first, then the network
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            return cachedResponse || fetch(event.request);
        })
    );
});
