/* backdrop.js: use your own image or drawing as the map, instead of street tiles.

   Everything else (places, spots, tours, events, photos, audio, QR links) works on top of it exactly as on the street map, because it only
   needs coordinates. The picture is simply laid on the map by its four corners, the same way the old-map pictures are.

   backdrop.json (all optional except the picture):
     {
       "title": "Wayne County Historical Museum",
       "background": "#ffffff",                      the color around the picture
       "floors": [ { "id": "ground", "name": "Ground floor", "image": "plans/ground.svg" },
                   { "id": "upper",  "name": "Upper floor",  "image": "plans/upper.svg" } ],
       "image": "plans/site.svg",                    for a single picture (instead of floors)
       "scale": { "across": 100, "unit": "ft" },     the real width of the whole picture, so a scale bar can be drawn
       "corners": [[lng,lat],[lng,lat],[lng,lat],[lng,lat]],   top-left, top-right, bottom-right, bottom-left: ties the picture to the real world
       "credit": "Plan drawn by ..."
     }
   With "corners" the plan sits at its true place (GPS dot, Open in Maps and the Near Me list work there). Without them it sits on a made-up
   patch of the globe, and everything that needs a real location is switched off.

   In places.csv, childmarkers.csv and spots.csv an optional FLOOR column (a floor's id or name) shows a pin on that floor only. Blank = every floor.  */
(function () {
  "use strict";
  const FICTION = { center: [0.0, 0.0], width: 0.006 };   // a made-up patch near 0,0, about 670 m wide: puts a plan in the zoom range the map is tuned for
  const MAX_SIDE = 4096;                                  // phones struggle with a single picture bigger than this
  const norm = v => String(v == null ? "" : v).trim().toLowerCase();
  const ok = n => typeof n === "number" && isFinite(n);
  let current = null;

  /* ---------- reading backdrop.json ---------- */
  function normalize(raw) {
    if (!raw || typeof raw !== "object") return null;
    let floors = Array.isArray(raw.floors) ? raw.floors.filter(f => f && f.image).map((f, i) => ({ id: String(f.id || "floor" + (i + 1)), name: String(f.name || f.id || "Floor " + (i + 1)), image: String(f.image) })) : [];
    if (!floors.length && raw.image) floors = [{ id: "main", name: String(raw.title || ""), image: String(raw.image) }];
    if (!floors.length) return null;
    const c = raw.corners;
    const corners = Array.isArray(c) && c.length === 4 && c.every(p => Array.isArray(p) && ok(+p[0]) && ok(+p[1])) ? c.map(p => [+p[0], +p[1]]) : null;
    const s = raw.scale && +raw.scale.across > 0 ? { across: +raw.scale.across, unit: /^(m|meter|metre)s?$/i.test(raw.scale.unit || "") ? "m" : "ft" } : null;
    return { title: String(raw.title || ""), background: /^#[0-9a-f]{3,8}$/i.test(raw.background || "") ? raw.background : "#ffffff", floors, corners, anchored: !!corners && raw.anchored !== false, scale: s, credit: String(raw.credit || ""), file: "backdrop.json" };
  }
  function load(fetchFn, file) {
    const f = file || "backdrop.json";
    return (fetchFn || ((u, o) => fetch(u, o)))(f, { cache: "no-store" }).then(r => r.ok ? r.json() : null).then(j => { const c = normalize(j); if (c) c.file = f; return c; }).catch(() => null);
  }

  /* ---------- turning the picture into something the map can show ---------- */
  function svgSize(doc) {
    const el = doc.documentElement;
    const vb = (el.getAttribute("viewBox") || "").split(/[\s,]+/).map(Number);
    let w = parseFloat(el.getAttribute("width")), h = parseFloat(el.getAttribute("height"));
    if (vb.length === 4 && vb.every(isFinite) && vb[2] > 0 && vb[3] > 0) { if (!(w > 0) || /%/.test(el.getAttribute("width") || "")) w = vb[2]; if (!(h > 0) || /%/.test(el.getAttribute("height") || "")) h = vb[3]; }
    return { w: w > 0 ? w : 1000, h: h > 0 ? h : 750, vb: vb.length === 4 && vb.every(isFinite) ? vb : null };
  }
  const loadImg = url => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error("could not read the picture " + url)); i.src = url; });
  /* A drawing (.svg) is painted to a picture at a size that suits phones; a photo or scan that is too big is shrunk to the same limit. */
  async function rasterize(url, maxSide) {
    maxSide = maxSide || MAX_SIDE;
    if (/\.svg(\?|#|$)/i.test(url)) {
      const r = await fetch(url); if (!r.ok) throw new Error("could not load " + url + " (" + r.status + ")");
      const doc = new DOMParser().parseFromString(await r.text(), "image/svg+xml");
      if (doc.querySelector("parsererror")) throw new Error(url + " is not a valid SVG");
      const sz = svgSize(doc), k = Math.min(1, maxSide / Math.max(sz.w, sz.h)) || 1, up = Math.max(1, Math.min(2, maxSide / Math.max(sz.w, sz.h)));
      const W = Math.round(sz.w * (k < 1 ? k : up)), H = Math.round(sz.h * (k < 1 ? k : up));
      const el = doc.documentElement; el.setAttribute("width", W); el.setAttribute("height", H); if (!sz.vb) el.setAttribute("viewBox", "0 0 " + sz.w + " " + sz.h);
      const blob = new Blob([new XMLSerializer().serializeToString(doc)], { type: "image/svg+xml;charset=utf-8" }), bu = URL.createObjectURL(blob);
      try {
        const img = await loadImg(bu), c = document.createElement("canvas"); c.width = W; c.height = H;
        c.getContext("2d").drawImage(img, 0, 0, W, H);
        return { url: c.toDataURL("image/png"), w: W, h: H };
      } finally { URL.revokeObjectURL(bu); }
    }
    const img = await loadImg(url), nw = img.naturalWidth, nh = img.naturalHeight;
    if (Math.max(nw, nh) <= maxSide) return { url, w: nw, h: nh };
    const k = maxSide / Math.max(nw, nh), W = Math.round(nw * k), H = Math.round(nh * k), c = document.createElement("canvas"); c.width = W; c.height = H;
    c.getContext("2d").drawImage(img, 0, 0, W, H);
    return { url: c.toDataURL("image/jpeg", 0.88), w: W, h: H, shrunk: true };
  }

  /* ---------- where the picture sits on the globe ---------- */
  function cornersFor(cfg, w, h) {
    if (cfg.corners) return cfg.corners;
    const cx = FICTION.center[0], cy = FICTION.center[1], hw = FICTION.width / 2;
    const hh = hw * (h / w) * Math.cos(cy * Math.PI / 180);       // the map stretches north-south away from the equator; this keeps the picture's proportions
    return [[cx - hw, cy + hh], [cx + hw, cy + hh], [cx + hw, cy - hh], [cx - hw, cy - hh]];
  }
  const boundsOf = cs => { const xs = cs.map(c => c[0]), ys = cs.map(c => c[1]); return [[Math.min(...xs), Math.min(...ys)], [Math.max(...xs), Math.max(...ys)]]; };
  // a position inside the picture (u, v from 0 to 1, from the top-left) to a map position
  const lerp = (a, b, t) => a + (b - a) * t;
  function toLngLat(cs, u, v) { const t = [lerp(cs[0][0], cs[1][0], u), lerp(cs[0][1], cs[1][1], u)], b = [lerp(cs[3][0], cs[2][0], u), lerp(cs[3][1], cs[2][1], u)]; return [lerp(t[0], b[0], v), lerp(t[1], b[1], v)]; }

  /* ---------- the controls it adds ---------- */
  function injectStyle() {
    if (document.getElementById("bdStyle")) return;
    const s = document.createElement("style"); s.id = "bdStyle";
    s.textContent = ".floorBar{position:absolute;left:10px;top:50%;transform:translateY(-50%);z-index:5;display:flex;flex-direction:column-reverse;gap:6px;max-height:60%;overflow:auto}" +
      ".floorBar button{min-width:44px;min-height:44px;padding:6px 12px;border:2px solid rgba(0,0,0,.25);border-radius:10px;background:#fff;color:#222;font:600 14px system-ui,sans-serif;cursor:pointer;text-align:left}" +
      ".floorBar button[aria-pressed=true]{background:var(--ets-accent,#B45309);color:var(--ets-on-accent,#fff);border-color:transparent}" +
      ".bdScale{position:absolute;left:10px;bottom:8px;z-index:5;font:12px system-ui,sans-serif;color:#222;background:rgba(255,255,255,.85);padding:2px 6px;border-radius:4px;pointer-events:none}" +
      ".bdScale i{display:block;height:5px;border:2px solid #222;border-top:0;margin-top:2px}";
    document.head.appendChild(s);
  }
  const NICE = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000];

  /* ---------- putting it on the map ---------- */
  async function install(map, cfg, opts) {
    opts = opts || {};
    if (!map || !cfg) return null;
    injectStyle();
    const cache = {};                                                   // floor id -> { url, w, h }
    const getFloor = async f => cache[f.id] || (cache[f.id] = await rasterize(opts.url ? opts.url(f.image) : f.image, cfg.maxPixels));
    const first = await getFloor(cfg.floors[0]);
    const cs = cornersFor(cfg, first.w, first.h), b = boundsOf(cs);
    const mid = [(b[0][0] + b[1][0]) / 2, (b[0][1] + b[1][1]) / 2];
    const padX = (b[1][0] - b[0][0]) * 0.25, padY = (b[1][1] - b[0][1]) * 0.25;
    const maxBounds = [[b[0][0] - padX, b[0][1] - padY], [b[1][0] + padX, b[1][1] + padY]];
    const cam = map.cameraForBounds ? map.cameraForBounds(b, { padding: 24 }) : null;
    const ctl = { cfg, corners: cs, bounds: b, maxBounds, center: cam ? [cam.center.lng !== undefined ? cam.center.lng : cam.center[0], cam.center.lat !== undefined ? cam.center.lat : cam.center[1]] : mid,
      zoom: cam ? cam.zoom : 17, anchored: cfg.anchored, scale: cfg.scale, floors: cfg.floors, floor: cfg.floors[0], listeners: [] };
    ctl.minZoom = Math.max(0, ctl.zoom - 1.2); ctl.maxZoom = Math.min(22, ctl.zoom + 4);
    // meters of real ground per meter of made-up ground, so distances and the scale bar are true to the building
    const realAcross = cfg.scale ? cfg.scale.across * (cfg.scale.unit === "ft" ? 0.3048 : 1) : 0;
    const fictAcross = Math.abs(cs[1][0] - cs[0][0]) * 111319.49 * Math.cos(mid[1] * Math.PI / 180);
    ctl.realPerFict = cfg.anchored ? 1 : (realAcross && fictAcross ? realAcross / fictAcross : 0);

    const SRC = "bd-plan", LAY = "bd-plan";
    const log = opts.log || (() => {});
    const order = () => (map.getStyle && map.getStyle() && map.getStyle().layers ? map.getStyle().layers.map(l => l.id) : []);
    const draw = async () => {
      const r = await getFloor(ctl.floor);
      if (map.getLayer(LAY)) map.removeLayer(LAY);
      if (map.getSource(SRC)) map.removeSource(SRC);
      const bottom = order().filter(id => id !== LAY && id !== "osm")[0];       // the plan goes at the very bottom: under every line, outline and tint the page adds
      map.addSource(SRC, { type: "image", url: r.url, coordinates: cs });
      map.addLayer({ id: LAY, type: "raster", source: SRC, paint: { "raster-opacity": 1, "raster-fade-duration": 0, "raster-resampling": "linear" } }, bottom);
      log("BACKDROP: plan \"" + ctl.floor.name + "\" given to the map (" + r.w + " x " + r.h + " px). Layers, bottom to top: " + order().join(" > "));
    };
    if (map.getLayer && map.getLayer("osm")) map.removeLayer("osm");              // no street tiles are ever requested
    if (map.getSource && map.getSource("osm")) map.removeSource("osm");
    try { map.getContainer().style.backgroundColor = cfg.background; } catch (e) {}           // the color around the plan
    if (map.on) {                                                                           // say, in the debug panel, whether the map really loaded the picture
      const t0 = Date.now(); let said = false;
      map.on("sourcedata", e => { if (!said && e && e.sourceId === SRC && e.isSourceLoaded) { said = true; log("BACKDROP: the map loaded the plan picture (" + (Date.now() - t0) + " ms)"); } });
      setTimeout(() => { if (!said) log("BACKDROP: the map has not reported loading the plan picture after 6 seconds. If the plan is not visible, send this panel."); }, 6000);
    }
    await draw();

    ctl.setFloor = async id => {
      const f = cfg.floors.find(x => norm(x.id) === norm(id) || norm(x.name) === norm(id)); if (!f || f === ctl.floor) return;
      ctl.floor = f; await draw(); syncBar();
      ctl.listeners.forEach(fn => { try { fn(f); } catch (e) {} });
      window.dispatchEvent(new CustomEvent("ets-floor", { detail: { id: f.id, name: f.name } }));
    };
    ctl.onChange = fn => ctl.listeners.push(fn);
    // a pin shows on a floor if its FLOOR column is blank, or names that floor (several can be listed with | or ,)
    ctl.onFloor = row => {
      const v = norm(row && row.FLOOR); if (!v || cfg.floors.length < 2) return true;
      return v.split(/[|,;]/).map(s => s.trim()).some(s => s === norm(ctl.floor.id) || s === norm(ctl.floor.name));
    };
    // jump to the floor a pin lives on (used when a visitor opens a pin, a story or a tour stop that is upstairs)
    ctl.showFloorFor = row => {
      const v = norm(row && row.FLOOR); if (!v) return;
      const f = v.split(/[|,;]/).map(s => s.trim()).map(s => cfg.floors.find(x => norm(x.id) === s || norm(x.name) === s)).find(Boolean);
      if (f) ctl.setFloor(f.id);
    };
    ctl.toLngLat = (u, v) => toLngLat(cs, u, v);
    ctl.files = () => [cfg.file].concat(cfg.floors.map(f => f.image));
    ctl.preload = () => Promise.all(cfg.floors.map(getFloor)).catch(() => {});

    let bar = null;
    function syncBar() { if (bar) bar.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.id === ctl.floor.id))); }
    ctl.floorBar = host => {
      if (cfg.floors.length < 2 || !host) return null;
      bar = document.createElement("div"); bar.className = "floorBar"; bar.setAttribute("role", "group"); bar.setAttribute("aria-label", opts.floorsLabel || "Floors");
      cfg.floors.forEach(f => { const b = document.createElement("button"); b.type = "button"; b.dataset.id = f.id; b.textContent = f.name; b.onclick = () => ctl.setFloor(f.id); bar.appendChild(b); });
      host.appendChild(bar); syncBar(); return bar;
    };
    ctl.scaleBar = host => {
      if (!ctl.realPerFict && !cfg.anchored || !host) return null;
      const el = document.createElement("div"); el.className = "bdScale"; el.setAttribute("aria-hidden", "true"); el.innerHTML = "<span></span><i></i>"; host.appendChild(el);
      const unit = cfg.scale ? cfg.scale.unit : "ft";
      const upd = () => {
        const z = map.getZoom(), lat = map.getCenter().lat, k = ctl.realPerFict || 1;
        const mPerPx = 78271.517 * Math.cos(lat * Math.PI / 180) / Math.pow(2, z) * k, perPx = unit === "ft" ? mPerPx / 0.3048 : mPerPx;
        const target = perPx * 110, n = NICE.filter(v => v <= target).pop() || NICE[0];
        el.querySelector("i").style.width = Math.max(20, n / perPx) + "px"; el.querySelector("span").textContent = n + " " + unit;
      };
      map.on("move", upd); upd(); return el;
    };
    current = ctl;
    return ctl;
  }

  window.Backdrop = { load, normalize, install, rasterize, cornersFor, toLngLat, active: () => current, FICTION };
})();
