const CACHE_NAME = 'tookmue-v24-358menus';
const IMAGE_CACHE_NAME = 'tookmue-images-v1';

const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './admin.html',
  './menus.json',
  './manifest.json',
  './privacy.html',
  './truemoney-qr.jpg',
  './og-cover.jpg',
  './mascot-pinto.png',
  './logo-tookmue.png',
  './icon-192.png',
  './icon-512.png',
  './icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  const allowedCaches = [CACHE_NAME, IMAGE_CACHE_NAME];
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => !allowedCaches.includes(k)).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // 1. HTML navigation, menus.json, app.js & styles.css -> Network-First (อัปเดตโค้ดและเมนูล่าสุดทันทีเมื่อมีเน็ต)
  if (event.request.mode === 'navigate' || url.pathname.endsWith('/menus.json') || url.pathname.endsWith('/app.js') || url.pathname.endsWith('/styles.css')) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          if (res && res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return res;
        })
        .catch(() => caches.match(event.request).then((r) => r || caches.match('./index.html') || caches.match('./')))
    );
    return;
  }

  // 2. โฟลเดอร์ images/ -> Cache-First แบบ Runtime Caching (โหลดครั้งแรกแล้วเก็บแคชอัตโนมัติ)
  if (url.pathname.includes('/images/')) {
    event.respondWith(
      caches.open(IMAGE_CACHE_NAME).then((cache) =>
        cache.match(event.request).then((cached) => {
          if (cached) return cached;
          return fetch(event.request).then((res) => {
            if (res && res.ok) {
              cache.put(event.request, res.clone());
            }
            return res;
          });
        })
      )
    );
    return;
  }

  // 3. ไฟล์ระบบอื่นๆ -> Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((res) => {
          if (res && res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return res;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
