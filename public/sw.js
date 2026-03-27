// The 40th Brick - Service Worker for offline play
const CACHE_NAME = '40th-brick-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/constants.js',
  '/js/gamepad.js',
  '/js/save.js',
  '/js/network.js',
  '/js/helpers.js',
  '/js/main.js',
  '/js/entities/Player.js',
  '/js/data/achievements.js',
  '/js/data/quotes.js',
  '/js/data/personal-puzzles.js',
  '/js/scenes/BootScene.js',
  '/js/scenes/TitleScene.js',
  '/js/scenes/LobbyScene.js',
  '/js/scenes/WorldMapScene.js',
  '/js/scenes/AchievementScene.js',
  '/js/scenes/Chapter1Scene.js',
  '/js/scenes/Chapter2Scene.js',
  '/js/scenes/Chapter3Scene.js',
  '/js/scenes/FinaleScene.js'
];

// Install - cache all game assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Caching game assets');
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate - clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

// Fetch - cache first, network fallback
self.addEventListener('fetch', event => {
  // Skip socket.io and API requests
  if (event.request.url.includes('/socket.io/') ||
      event.request.url.includes('cdn.jsdelivr.net') ||
      event.request.url.includes('fonts.googleapis.com') ||
      event.request.url.includes('fonts.gstatic.com')) {
    return event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Cache new resources dynamically
        if (response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
