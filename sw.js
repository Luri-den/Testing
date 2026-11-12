/* History map: offline cache worker

   What is kept, and how:
     pages, scripts, data (csv/json) ... network first, always asking the server whether the file has changed; if a saved copy exists
                                          and the signal is slow (4 seconds) or gone, the saved copy is used. With nothing saved yet,
                                          it waits for the network as long as it takes
     photos, icons, videos ............... shown from the saved copy at once, and refreshed in the background
     map background tiles ................ saved copy first; only the most recent 500 are kept
     very large files (over 4 MB) ........ never saved here (the old-map pictures), so they cannot fill a phone
     audio clips ......................... kept like photos, and played from the saved copy in pieces (so they start, skip and play offline)
     video seeking ....................... left to the browser (range requests are not saved)
*/

const VERSION = "v9-2026-11";
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
  "schedule.js", "announcements.js", "labels.js", "tour-camera.js", "tour-info.js", "here.js", "media.js", "ets-config.js", "icons.js", "lines-style.js", "spot-markers.js",
  "manifest.json"
];

const isTile  = url => /tile\.openstreetmap\.org|basemap\.nationalmap\.gov|arcgis\.com\/.*Imagery/.test(url);
const isAudio = path => /\.(mp3|m4a|aac|ogg|oga|opus|wav|weba)$/i.test(path);
const isImage = path => /\.(jpe?g|png|webp|gif|svg|ico|mp4|webm)$/i.test(path) || isAudio(path);

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
    fetch(request, { cache: "no-cache" }).then(r => { clearTimeout(t); resolve(r); }, e => { clearTimeout(t); reject(e); });
  });
}

// A saved audio clip, cut to the piece the player asked for. If the clip is not saved, the network answers the request itself.
async function rangeFromSaved(req) {
  const cache = await caches.open(IMG_CACHE);
  const hit = await cache.match(req.url);
  if (!hit) return fetch(req);
  const blob = await hit.blob(), size = blob.size, m = /bytes=(\d*)-(\d*)/.exec(req.headers.get("range") || "");
  let start = 0, end = size - 1;
  if (m) {
    if (m[1] !== "") { start = +m[1]; if (m[2] !== "") end = Math.min(+m[2], size - 1); }
    else if (m[2] !== "") start = Math.max(0, size - +m[2]);                // "the last N bytes"
  }
  if (start >= size || start > end) return new Response(null, { status: 416, headers: { "Content-Range": "bytes */" + size } });
  return new Response(blob.slice(start, end + 1), { status: 206, statusText: "Partial Content", headers: {
    "Content-Type": hit.headers.get("Content-Type") || blob.type || "audio/mpeg", "Content-Range": "bytes " + start + "-" + end + "/" + size,
    "Content-Length": String(end - start + 1), "Accept-Ranges": "bytes" } });
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
  const url = new URL(req.url);
  if (req.headers.has("range")) {                                             // audio and video ask for pieces so they can start and skip around
    if (url.origin === location.origin && isAudio(url.pathname)) e.respondWith(rangeFromSaved(req));   // a saved clip is served in pieces, so it plays offline
    return;                                                                   // anything else: the browser handles it
  }

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

  // Pages, scripts and data
  e.respondWith((async () => {
    const cache = await caches.open(SHELL_CACHE);
    const saved = () => cache.match(req).then(h => h || cache.match(req, { ignoreSearch: true }));
    const hit = await saved();

    // Nothing saved yet (the first visit): there is nothing to fall back on, so wait for the network as long as it takes.
    if (!hit) {
      try {
        const res = await fetch(req, { cache: "no-cache" });
        if (res.ok) saveCopy(cache, req, res);
        return res;
      } catch (err) {
        if (req.mode === "navigate") { const page = await cache.match("Demo2a.html"); if (page) return page; }
        return Response.error();                                              // the page sees an ordinary network failure, as if there were no worker
      }
    }

    // A saved copy exists. If the signal was just too slow, use it straight away and refresh it quietly.
    if (Date.now() < badNetUntil) {
      e.waitUntil(fetchWithin(req, 20000).then(r => { if (r.ok) return saveCopy(cache, req, r); }).catch(() => {}));
      return hit;
    }
    // Otherwise ask the network, but only wait a few seconds before using the saved copy.
    try {
      const res = await fetchWithin(req, NET_WAIT);
      if (res.ok) saveCopy(cache, req, res);
      return res;
    } catch (err) {
      if (err && err.message === "slow network") badNetUntil = Date.now() + BAD_NET_FOR;
      return hit;
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
