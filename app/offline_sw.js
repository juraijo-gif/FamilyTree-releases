// Keeps the Family Tree web app working offline. Every file of the app is
// saved on the phone at install; fonts are saved the first time they load.
const VERSION = '79';
const CACHE = 'family-tree-' + VERSION;
const FILES = ["./", ".last_build_id", "assets/AssetManifest.bin", "assets/AssetManifest.bin.json", "assets/FontManifest.json", "assets/NOTICES", "assets/assets/fonts/NotoSansMalayalam.ttf", "assets/assets/update_form.html", "assets/assets/viewer.html", "assets/assets/world_land.geojson", "assets/fonts/MaterialIcons-Regular.otf", "assets/fonts/fallback/Roboto-Regular.ttf", "assets/shaders/ink_sparkle.frag", "assets/shaders/stretch_effect.frag", "canvaskit/canvaskit.js", "canvaskit/canvaskit.wasm", "favicon.png", "flutter.js", "flutter_bootstrap.js", "icons/Icon-192.png", "icons/Icon-512.png", "icons/Icon-maskable-192.png", "icons/Icon-maskable-512.png", "icons/apple-touch-icon.png", "index.html", "main.dart.js", "manifest.json", "sqflite_sw.js", "sqlite3.wasm", "version.json"];

self.addEventListener('install', (e) => {
  // Download every file fresh (never from the browser's short-term cache), and
  // don't let one missing file block the whole update.
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.allSettled(FILES.map((f) =>
        fetch(new Request(f, { cache: 'reload' })).then((res) => (res.ok ? c.put(f, res) : null)))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('message', (e) => {
  if (e.data === 'version' && e.source) e.source.postMessage({ version: VERSION });
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('family-tree-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  // Pages: try the internet first (to get updates), fall back to the saved copy.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put('./', copy));
        return res;
      }).catch(() => caches.match('./').then((r) => r || caches.match('index.html')))
    );
    return;
  }
  // Everything else: the saved copy first, so it is fast and works offline.
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req).then((res) => {
      if (res && (res.ok || res.type === 'opaque')) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
      }
      return res;
    }))
  );
});
