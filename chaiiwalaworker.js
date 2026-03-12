// Service Worker for PWA
// Version 1.0.0

const CACHE_NAME = 'pwa-cache-v3';
const RUNTIME_CACHE = 'pwa-runtime-v3';

// Files to cache immediately on installation
const BASE = '/chaiiwala-bird';

const PRECACHE_URLS = [
  BASE + '/',
  BASE + '/index.html',
  BASE + '/game.html',
  BASE + '/style.css',
  BASE + '/game.css',
  BASE + '/script.js',
  BASE + '/game.js',
  BASE + '/manifest.json',
  BASE + '/offline.html',
  BASE + '/fonts/fonts.css',
  BASE + '/fonts/PressStart2P.woff2',
  BASE + '/fonts/FredokaOne.woff2',
  // Game images
  BASE + '/img/bottom_roll.png',
  BASE + '/img/burger.png',
  BASE + '/img/chips.png',
  BASE + '/img/game_bg_dark.jpg',
  BASE + '/img/game_over_dark.png',
  BASE + '/img/game_over_light.png',
  BASE + '/img/gamer_bg_light.png',
  BASE + '/img/home_bg_dark.png',
  BASE + '/img/home_bg_light.png',
  BASE + '/img/samosa.png',
  BASE + '/img/tea.png',
  BASE + '/img/top_roll.png',
];

// Install event - cache essential files
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Precaching App Shell');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting()) // Activate immediately
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            // Delete old caches that don't match current version
            return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE;
          })
          .map((cacheName) => {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => self.clients.claim()) // Take control of all pages
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // For navigation requests (HTML pages) - Cache First strategy
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            // Serve from cache immediately, refresh in background
            fetch(request).then((response) => {
              if (response && response.status === 200) {
                caches.open(CACHE_NAME).then((cache) => cache.put(request, response));
              }
            }).catch(() => {});
            return cachedResponse;
          }
          // Not in cache yet, try network
          return fetch(request)
            .then((response) => {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
              return response;
            })
            .catch(() => caches.match(BASE + '/offline.html'));
        })
    );
    return;
  }

  // For all other requests - Cache First strategy
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached version
          return cachedResponse;
        }

        // Not in cache, fetch from network
        return fetch(request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Cache the fetched response
            caches.open(RUNTIME_CACHE)
              .then((cache) => {
                cache.put(request, responseToCache);
              });

            return response;
          })
          .catch((error) => {
            console.log('Service Worker: Fetch failed:', error);
            // You can return a custom offline asset here if needed
          });
      })
  );
});

// Listen for messages from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    // Allow dynamic caching of URLs
    event.waitUntil(
      caches.open(RUNTIME_CACHE).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  }
});

// Background sync (if supported)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(
      // Your sync logic here
      console.log('Service Worker: Background sync triggered')
    );
  }
});

// Push notification (if supported)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New notification',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    vibrate: [200, 100, 200],
  };

  event.waitUntil(
    self.registration.showNotification('PWA Notification', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow('/')
  );
});