// Service Worker for School Management System Performance Optimization

const CACHE_NAME = 'school-management-v1.2';
const STATIC_CACHE = 'static-v1.2';
const DYNAMIC_CACHE = 'dynamic-v1.2';

// Files to cache immediately
const STATIC_FILES = [
    '/',
    '/login.html',
    '/dashboard.html',
    '/modules/reports.html',
    '/modules/fees-payment.html',
    '/modules/staff-payroll.html',
    '/modules/procurement.html',
    '/modules/settings.html',
    '/css/performance-styles.css',
    '/css/themes/light-theme.css',
    '/css/themes/dark-theme.css',
    '/css/themes/blue-theme.css',
    '/js/performance-optimizer.js',
    '/js/global-theme-manager.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Dynamic files to cache on request
const DYNAMIC_FILES = [
    '/js/modules/',
    '/css/modules/',
    '/api/'
];

// Install event - cache static files
self.addEventListener('install', event => {
    console.log('Service Worker installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('Caching static files...');
                return cache.addAll(STATIC_FILES.map(url => {
                    // Handle external URLs
                    if (url.startsWith('http')) {
                        return new Request(url, { mode: 'cors' });
                    }
                    return url;
                }));
            })
            .catch(error => {
                console.error('Error caching static files:', error);
            })
    );
    
    // Skip waiting to activate immediately
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('Service Worker activating...');
    
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    
    // Take control of all clients immediately
    self.clients.claim();
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip chrome-extension and other non-http(s) requests
    if (!url.protocol.startsWith('http')) {
        return;
    }
    
    event.respondWith(
        handleFetch(request)
    );
});

// Handle fetch with caching strategy
async function handleFetch(request) {
    const url = new URL(request.url);
    
    try {
        // Strategy 1: Cache First for static assets
        if (isStaticAsset(request)) {
            return await cacheFirst(request);
        }
        
        // Strategy 2: Network First for API calls
        if (isApiCall(request)) {
            return await networkFirst(request);
        }
        
        // Strategy 3: Stale While Revalidate for HTML pages
        if (isHtmlPage(request)) {
            return await staleWhileRevalidate(request);
        }
        
        // Default: Network First
        return await networkFirst(request);
        
    } catch (error) {
        console.error('Fetch error:', error);
        
        // Return offline fallback if available
        return await getOfflineFallback(request);
    }
}

// Cache First strategy
async function cacheFirst(request) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
        return cachedResponse;
    }
    
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('Network error in cacheFirst:', error);
        throw error;
    }
}

// Network First strategy
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('Network failed, trying cache:', request.url);
        
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        throw error;
    }
}

// Stale While Revalidate strategy
async function staleWhileRevalidate(request) {
    const cachedResponse = await caches.match(request);
    
    const fetchPromise = fetch(request).then(networkResponse => {
        if (networkResponse.ok) {
            const cache = caches.open(DYNAMIC_CACHE);
            cache.then(c => c.put(request, networkResponse.clone()));
        }
        return networkResponse;
    }).catch(error => {
        console.error('Network error in staleWhileRevalidate:', error);
        return cachedResponse;
    });
    
    return cachedResponse || fetchPromise;
}

// Get offline fallback
async function getOfflineFallback(request) {
    if (request.destination === 'document') {
        const cachedResponse = await caches.match('/offline.html');
        if (cachedResponse) {
            return cachedResponse;
        }
    }
    
    // Return a basic offline response
    return new Response('Offline - Content not available', {
        status: 503,
        statusText: 'Service Unavailable',
        headers: {
            'Content-Type': 'text/plain'
        }
    });
}

// Helper functions
function isStaticAsset(request) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    return (
        pathname.includes('/css/') ||
        pathname.includes('/js/') ||
        pathname.includes('/images/') ||
        pathname.includes('/fonts/') ||
        pathname.endsWith('.css') ||
        pathname.endsWith('.js') ||
        pathname.endsWith('.png') ||
        pathname.endsWith('.jpg') ||
        pathname.endsWith('.jpeg') ||
        pathname.endsWith('.gif') ||
        pathname.endsWith('.svg') ||
        pathname.endsWith('.woff') ||
        pathname.endsWith('.woff2') ||
        url.hostname.includes('cdnjs.cloudflare.com') ||
        url.hostname.includes('cdn.jsdelivr.net')
    );
}

function isApiCall(request) {
    const url = new URL(request.url);
    return url.pathname.includes('/api/');
}

function isHtmlPage(request) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    return (
        request.destination === 'document' ||
        pathname.endsWith('.html') ||
        pathname === '/' ||
        !pathname.includes('.')
    );
}

// Background sync for offline actions
self.addEventListener('sync', event => {
    console.log('Background sync triggered:', event.tag);
    
    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

async function doBackgroundSync() {
    try {
        // Sync any pending data
        const pendingData = await getStoredData('pendingSync');
        
        if (pendingData && pendingData.length > 0) {
            for (const item of pendingData) {
                try {
                    await fetch(item.url, {
                        method: item.method,
                        headers: item.headers,
                        body: item.body
                    });
                    
                    // Remove from pending sync
                    await removeFromPendingSync(item.id);
                } catch (error) {
                    console.error('Sync failed for item:', item.id, error);
                }
            }
        }
    } catch (error) {
        console.error('Background sync error:', error);
    }
}

// Push notifications
self.addEventListener('push', event => {
    console.log('Push notification received');
    
    const options = {
        body: event.data ? event.data.text() : 'New notification',
        icon: '/images/icon-192x192.png',
        badge: '/images/badge-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'View',
                icon: '/images/checkmark.png'
            },
            {
                action: 'close',
                title: 'Close',
                icon: '/images/xmark.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('School Management System', options)
    );
});

// Notification click handling
self.addEventListener('notificationclick', event => {
    console.log('Notification clicked:', event.action);
    
    event.notification.close();
    
    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Message handling from main thread
self.addEventListener('message', event => {
    console.log('Service Worker received message:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({ version: CACHE_NAME });
    }
    
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(clearAllCaches());
    }
});

// Clear all caches
async function clearAllCaches() {
    const cacheNames = await caches.keys();
    await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
    );
    console.log('All caches cleared');
}

// Utility functions for IndexedDB operations
async function getStoredData(storeName) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('SchoolManagementDB', 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const getRequest = store.getAll();
            
            getRequest.onsuccess = () => resolve(getRequest.result);
            getRequest.onerror = () => reject(getRequest.error);
        };
    });
}

async function removeFromPendingSync(id) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('SchoolManagementDB', 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(['pendingSync'], 'readwrite');
            const store = transaction.objectStore('pendingSync');
            const deleteRequest = store.delete(id);
            
            deleteRequest.onsuccess = () => resolve();
            deleteRequest.onerror = () => reject(deleteRequest.error);
        };
    });
}

// Periodic cleanup
setInterval(() => {
    // Clean up old cache entries
    caches.open(DYNAMIC_CACHE).then(cache => {
        cache.keys().then(requests => {
            if (requests.length > 100) {
                // Remove oldest entries
                const toDelete = requests.slice(0, requests.length - 50);
                toDelete.forEach(request => cache.delete(request));
            }
        });
    });
}, 300000); // Every 5 minutes

console.log('Service Worker loaded successfully');
