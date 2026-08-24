const CACHE = 'jahorin-mercury-skillui-v4.1-billing';
const CORE = [
  '/',
  '/manifest.json',
  '/repo-pages.json',
  '/css/mercury.css',
  '/css/skillui.css',
  '/js/runtime.js',
  '/js/skillui-shell.js',
  '/js/capability.js',
  '/home/',
  '/interweb/',
  '/code/',
  '/scribe/',
  '/gid/',
  '/syncori/',
  '/syncori/audio/',
  '/syncori/optics/'
];

async function preCache() {
  const cache = await caches.open(CACHE);
  await Promise.all(CORE.map(path => cache.add(path).catch(() => null)));

  try {
    const response = await fetch('/repo-pages.json', { cache: 'no-store' });
    const manifest = await response.json();
    const paths = manifest.pages.flatMap(page => [page.route, `/${page.path}`]);
    await Promise.all(paths.map(path => cache.add(path).catch(() => null)));
  } catch {
    // Core cache remains usable if manifest expansion is temporarily unavailable.
  }
}

self.addEventListener('install', event => {
  event.waitUntil(preCache().then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.pathname.startsWith('/api/')) return;

  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;

    try {
      const response = await fetch(request);
      if (response.ok && url.origin === self.location.origin) {
        const cache = await caches.open(CACHE);
        cache.put(request, response.clone());
      }
      return response;
    } catch {
      if (request.mode === 'navigate') {
        return caches.match('/') || Response.error();
      }
      return Response.error();
    }
  })());
});
