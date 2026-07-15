// Cache-first service worker. All content is static/bundled at build time,
// so once an asset is cached it is served from cache and only re-fetched
// on a cache-name bump (see CACHE_NAME below).
const CACHE_NAME = 'ordinariate-daily-prayer-v5';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/favicon-32.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  // Referenced only via CSS @font-face url(), so discoverBuildAssets()
  // below (which scans index.html's src/href attributes) can't find them.
  './fonts/cormorant-garamond-500.woff2',
  './fonts/cormorant-garamond-600.woff2',
  './fonts/cormorant-garamond-500-italic.woff2',
  './fonts/eb-garamond-400.woff2',
  './fonts/eb-garamond-500.woff2',
  './fonts/eb-garamond-600.woff2',
  './fonts/eb-garamond-400-italic.woff2',
];

// The built JS/CSS bundle filenames are content-hashed by Vite, so they
// can't be hardcoded above - they change every build. Instead, fetch the
// built index.html at install time and pull the actual asset URLs it
// references out of it, so the whole app (including the several-MB bundle
// carrying every psalm and scripture reading) is guaranteed to be cached
// before this service worker activates, rather than only opportunistically
// after whichever requests happen to succeed first (the old behaviour -
// see the fetch handler below, which still does this as a fallback for
// anything this misses).
async function discoverBuildAssets() {
  const response = await fetch('./index.html');
  const html = await response.text();
  return [...html.matchAll(/(?:src|href)="(\.\/assets\/[^"]+)"/g)].map((match) => match[1]);
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const buildAssets = await discoverBuildAssets();
      await cache.addAll([...APP_SHELL, ...buildAssets]);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      });
    }),
  );
});
