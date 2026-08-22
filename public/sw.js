const CACHE_NAME = 'xcrol-v6-no-skipwaiting';
const STATIC_ASSETS = [
  '/',
  '/favicon.png',
  '/favicon.ico',
  '/manifest.json',
  '/og-image.png',
];

// Install: pre-cache static assets
// Do NOT call skipWaiting() — let the new SW wait until all tabs are closed.
// This prevents mid-session cache swaps that cause unexpected page reloads
// (especially on mobile PWA tab-switch).
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Check if a URL points to a Vite hashed asset (contains content hash in filename)
function isHashedAsset(url) {
  return url.pathname.startsWith('/assets/') && /[-_.][a-zA-Z0-9]{6,}\.\w+$/.test(url.pathname);
}

// Fetch handler with tiered caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Never intercept .well-known paths (NIP-05, etc.) — serve directly from origin
  if (url.pathname.startsWith('/.well-known/')) return;

  // Never cache backend/auth/API calls. Caching authenticated GET responses can
  // replay a stale 401/403 or stale user payload after refresh and make the app
  // appear logged out even though the browser still has a valid session.
  if (
    url.pathname.startsWith('/rest/') ||
    url.pathname.startsWith('/functions/') ||
    url.pathname.startsWith('/auth/') ||
    url.pathname === '/user' ||
    url.pathname === '/token' ||
    url.hostname.includes('supabase')
  ) {
    event.respondWith(fetch(request));
    return;
  }

  // Cache-first with immutable treatment for hashed assets (/assets/*)
  // These filenames change on every build, so they're safe to cache forever
  if (isHashedAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Stale-while-revalidate for unhashed static files (favicon, audio, og-image, etc.)
  // Serve cached version instantly, then update cache in background
  if (
    url.pathname.startsWith('/audio/') ||
    url.pathname.startsWith('/video/') ||
    url.pathname === '/favicon.png' ||
    url.pathname === '/favicon.ico' ||
    url.pathname === '/og-image.png' ||
    url.pathname === '/manifest.json'
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        }).catch(() => cached);

        return cached || fetchPromise;
      })
    );
    return;
  }

  // Network-first for navigation requests. Serving stale HTML after a deploy can
  // load old JS chunks/auth code and strand signed-in users on a spinner.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/')))
    );
    return;
  }

  // Default: network-first for other requests
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
