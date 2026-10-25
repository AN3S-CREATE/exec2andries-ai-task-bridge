// Service Worker for Exec2Andries Mobile App
const CACHE_NAME = 'exec2andries-v1.0.0';
const RUNTIME_CACHE = 'exec2andries-runtime';

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precaching app shell');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE;
            })
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - network first, then cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // API requests - network only (always fresh data)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .catch(() => {
          return new Response(
            JSON.stringify({ error: 'Offline - API unavailable' }),
            { 
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        })
    );
    return;
  }

  // App shell - cache first, then network
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached version and update in background
          fetch(request)
            .then((response) => {
              if (response && response.status === 200) {
                caches.open(RUNTIME_CACHE).then((cache) => {
                  cache.put(request, response.clone());
                });
              }
            })
            .catch(() => {});
          
          return cachedResponse;
        }

        // Not in cache - fetch from network
        return fetch(request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            // Clone and cache the response
            const responseToCache = response.clone();
            caches.open(RUNTIME_CACHE)
              .then((cache) => {
                cache.put(request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Offline fallback
            if (request.destination === 'document') {
              return caches.match('/index.html');
            }
          });
      })
  );
});

// Background sync for offline task creation
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-tasks') {
    event.waitUntil(syncTasks());
  }
});

async function syncTasks() {
  try {
    // Get pending tasks from IndexedDB
    const pendingTasks = await getPendingTasks();
    
    // Upload each task
    for (const task of pendingTasks) {
      await fetch('/api/taskade/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task)
      });
      
      // Remove from pending queue
      await removePendingTask(task.id);
    }
    
    console.log('[SW] Background sync completed');
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
    throw error; // Retry on next sync
  }
}

// Helper functions for IndexedDB (placeholder)
async function getPendingTasks() {
  // In production, fetch from IndexedDB
  return [];
}

async function removePendingTask(taskId) {
  // In production, remove from IndexedDB
}

// Push notification handler
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New task update',
    icon: '/icon-192.png',
    badge: '/icon-72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Task',
        icon: '/icon-96.png'
      },
      {
        action: 'close',
        title: 'Dismiss',
        icon: '/icon-96.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Exec2Andries', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

console.log('[SW] Service worker loaded');