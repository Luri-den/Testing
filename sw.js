/* History map: offline cache worker

   What is kept, and how:
     pages, scripts, data (csv/json) ... network first, but only wait 4 seconds; a slow or missing signal falls back to the saved copy
     photos, icons, videos ............... shown from the saved copy at once, and refreshed in the background
     map background tiles ................ saved copy first; only the most recent 500 are kept
     very large files (over 4 MB) ........ never saved here (the old-map pictures), so they cannot fill a phone
     audio and video seeking ............. left to the browser (these are "range" requests and cannot be saved in pieces)
*/

const VERSION = "v6-2026-11";
const SHELL_CACHE = "shell-" + VERSION;
const IMG_CACHE   = "img-" + VERSION;
const TILE_CACHE  = "tiles-" + VERSION;

const MAX_TILES   = 500;               // map background tiles kept
const BIG_FILE    = 4 * 1024 * 1024;   // anything bigger than this is not saved
const NET_WAIT    = 4000;              // how long to wait for the network before using the saved copy (ms)
const BAD_NET_FOR = 30000;             // after one timeout, use saved copies straight away for this long (ms), refreshing in the background
let badNetUntil = 0;

const SHELL = [
  "./",
  "Demo2a.html",
  "welcome-themes.js", "marker-shapes.js", "marker-fill.js",
  "schedule.js", "announcements.js", "labels.js", "tour-camera.js", "tour-info.js", "ets-config.js", "icons.js", "lines-style.js", "spot-markers.js",
  "manifest.json"
];

const isTile  = url => /tile\.openstreetmap\.org|basemap\.nationalmap\.gov|arcgis\.com\/.*Imagery/.test(url);
const isImage = path => /\.(jpe?g|png|webp|gif|svg|ico|mp4|webm|mp3|m4a|ogg)$/i.test(path);

/* ---------- helpers (kept simple so they can be tested on their own) ---------- */

// Save a copy only if it is a complete, reasonably small answer.
async function saveCopy(cache, request, response) {
  try {
    if (!response || response.status !== 200) return;                       // not a full answer (errors, partial content)
    const len = parseInt(response.headers.get("content-length") || "0", 10);
    if (len > BIG_FILE) return;                                              // too big to keep
    await cache.put(request, response.clone());
  } catch (e) { /* storage full or similar: carry on without saving */ }
}

// Keep only the newest `max` entries.
async function trimCache(cache, max) {
  try {
    const keys = await cache.keys();
    for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
  } catch (e) {}
}

// Ask the network, but give up after `ms` so a bad signal does not leave the page waiting.
function fetchWithin(request, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("slow network")), ms);
    fetch(request).then(r => { clearTimeout(t); resolve(r); }, e => { clearTimeout(t); reject(e); });
  });
}

/* ---------- install / activate ---------- */

self.addEventListener("install", e => {
  e.waitUntil((async () => {
    const c = await caches.open(SHELL_CACHE);
    await Promise.all(SHELL.map(u => c.add(u).catch(() => {})));             // one missing file must not stop the rest
  })());
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    const keep = [SHELL_CACHE, IMG_CACHE, TILE_CACHE];
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => !keep.includes(k)).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

/* ---------- every request ---------- */

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  if (req.headers.has("range")) return;                                       // audio and video seeking: the browser handles it
  const url = new URL(req.url);

  // Map background tiles: saved copy first, then the network; keep the newest 500
  if (isTile(req.url)) {
    e.respondWith((async () => {
      const cache = await caches.open(TILE_CACHE);
      const hit = await cache.match(req);
      if (hit) return hit;
      try {
        const res = await fetch(req);
        if (res.ok) { await saveCopy(cache, req, res); trimCache(cache, MAX_TILES); }
        return res;
      } catch (err) { return Response.error(); }
    })());
    return;
  }

  if (url.origin !== location.origin) return;

  // Photos, icons, videos: show the saved copy at once, and refresh it in the background
  if (isImage(url.pathname)) {
    e.respondWith((async () => {
      const cache = await caches.open(IMG_CACHE);
      const hit = await cache.match(req);
      const refresh = fetch(req).then(async res => { if (res.ok) await saveCopy(cache, req, res); return res; }).catch(() => null);
      if (hit) { e.waitUntil(refresh); return hit; }
      const res = await refresh;
      return res || new Response("Offline", { status: 503 });
    })());
    return;
  }

  // Pages, scripts and data: the network when it answers quickly, otherwise the saved copy
  e.respondWith((async () => {
    const cache = await caches.open(SHELL_CACHE);
    const saved = () => cache.match(req).then(h => h || cache.match(req, { ignoreSearch: true }));
    if (Date.now() < badNetUntil) {                                           // the signal was just too slow: do not make every file wait again
      const hit = await saved();
      if (hit) { e.waitUntil(fetchWithin(req, 20000).then(r => { if (r.ok) return saveCopy(cache, req, r); }).catch(() => {})); return hit; }
    }
    try {
      const res = await fetchWithin(req, NET_WAIT);
      if (res.ok) saveCopy(cache, req, res);
      return res;
    } catch (err) {
      if (err && err.message === "slow network") badNetUntil = Date.now() + BAD_NET_FOR;
      const hit = await saved();
      if (hit) return hit;
      if (req.mode === "navigate") { const page = await cache.match("Demo2a.html"); if (page) return page; }
      return new Response("Offline", { status: 503 });
    }
  })());
});

/* ---------- "Save this map for offline use" ---------- */

self.addEventListener("message", e => {
  const msg = e.data || {};
  if (msg.type !== "PRECACHE") return;
  e.waitUntil((async () => {
    const files = Array.isArray(msg.files) ? msg.files : [];
    const shell = await caches.open(SHELL_CACHE), imgs = await caches.open(IMG_CACHE);
    let done = 0, failed = 0;
    const tell = m => self.clients.matchAll().then(cs => cs.forEach(c => c.postMessage(m)));
    for (const f of files) {
      try {
        const res = await fetch(f, { cache: "reload" });
        if (res.ok) await saveCopy(isImage(String(f).split("?")[0]) ? imgs : shell, new Request(f), res); else if (res.status !== 404) failed++;   // a file that simply does not exist (no events yet, for example) is not a failure
      } catch (err) { failed++; }
      done++;
      if (done % 3 === 0 || done === files.length) tell({ type: "PRECACHE_PROGRESS", done, total: files.length });
    }
    tell({ type: "PRECACHE_DONE", total: files.length, failed });
  })());
});
