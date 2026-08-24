const CACHE = 'jahorin-trismegistus-skillui-v6';
const CORE = [
  '/',
  '/manifest.json',
  '/repo-pages.json',
  '/css/mercury.css',
  '/css/skillui.css',
  '/css/jahorin-production.css',
  '/css/jahorin-gate.css',
  '/js/runtime.js',
  '/js/skillui-shell.js',
  '/js/capability.js',
  '/js/jahorin-files.js',
  '/js/jahorin-shell.js',
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
    // Core cache remains usable even if manifest expansion fails during install.
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

  if (request.method !== 'GET' || url.pathname.startsWith('/api/') || url.pathname.startsWith('/ws/')) return;

  event.respondWith((async () => {
    if (request.mode === 'navigate') {
      try {
        const response = await fetch(request);
        if (response.ok && url.origin === self.location.origin) {
          const cache = await caches.open(CACHE);
          cache.put(request, response.clone());
        }
        return response;
      } catch {
        return (await caches.match(request)) || (await caches.match('/')) || Response.error();
      }
    }

    const cached = await caches.match(request);
    if (cached) {
      fetch(request).then(async response => {
        if (response.ok && url.origin === self.location.origin) {
          const cache = await caches.open(CACHE);
          cache.put(request, response.clone());
        }
      }).catch(() => {});
      return cached;
    }

    try {
      const response = await fetch(request);
      if (response.ok && url.origin === self.location.origin) {
        const cache = await caches.open(CACHE);
        cache.put(request, response.clone());
      }
      return response;
    } catch {
      return Response.error();
    }
  })());
});
