/* History map — offline cache worker */

const VERSION = "v3-2026-11";
const SHELL_CACHE = "shell-" + VERSION;
const TILE_CACHE  = "tiles-" + VERSION;

const SHELL = [
  "./",
  "Demo2a.html", "Demo2.html",
  "welcome-themes.js", "marker-shapes.js", "marker-fill.js",
  "schedule.js", "announcements.js", "ets-config.js", "icons.js", "lines-style.js"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(SHELL_CACHE).then(c => c.addAll(SHELL).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== SHELL_CACHE && k !== TILE_CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

function isTile(url){
  return /tile\.openstreetmap\.org|basemap\.nationalmap\.gov|arcgis\.com\/.*Imagery/.test(url);
}

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Tiles: cache-first
  if (isTile(req.url)){
    e.respondWith((async () => {
      const cache = await caches.open(TILE_CACHE);
      const hit = await cache.match(req);
      if (hit) return hit;
      try {
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
      } catch(err){
        return hit || Response.error();
      }
    })());
    return;
  }

  // Same-origin data & shell: network-first, cache fallback
  if (url.origin === location.origin){
    e.respondWith((async () => {
      const cache = await caches.open(SHELL_CACHE);
      try {
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
      } catch(err){
        const hit = await cache.match(req);
        if (hit) return hit;
        return new Response("Offline", { status: 503 });
      }
    })());
    return;
  }
});

// Precache handler — called from the page
self.addEventListener("message", e => {
  const msg = e.data || {};
  if (msg.type !== "PRECACHE") return;
  (async () => {
    const cache = await caches.open(SHELL_CACHE);
    for (const f of msg.files){
      try {
        const res = await fetch(f, { cache:"reload" });
        if (res.ok) await cache.put(f, res.clone());
      } catch(err){}
    }
    // Optionally precache tiles: bounds + zoom range — kept simple here
    // (a full tile prefetch is heavy; leave for a future release)
    self.clients.matchAll().then(cs => cs.forEach(c => c.postMessage({ type:"PRECACHE_DONE" })));
  })();
});
