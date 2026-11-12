/* photo-resize.js: shrinks big photos in the browser before they are added to the site.
   Shared by editor.html and spots.html. Turn it on or off (and pick the size) with the checkbox under
   "Upload photo". The choice is remembered on that computer. Your original file is never changed. */
(function () {
  const KEY = "photo_resize_v1";
  const DEFAULTS = { on: true, max: 1600, quality: 0.85 };
  const settings = () => { try { return Object.assign({}, DEFAULTS, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) { return Object.assign({}, DEFAULTS); } };
  const save = s => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} };
  const fmt = b => b >= 1048576 ? (b / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(b / 1024)) + " KB";
  const extOf = f => ((String(f.name || "").split(".").pop() || "jpg").toLowerCase()).replace(/[^a-z0-9]/g, "") || "jpg";

  async function decode(file) {
    try { return await createImageBitmap(file, { imageOrientation: "from-image" }); }
    catch (e) { return await createImageBitmap(file); }
  }
  function hasAlpha(bmp) {
    const c = document.createElement("canvas"); c.width = c.height = 64;
    const g = c.getContext("2d", { willReadFrequently: true });
    g.drawImage(bmp, 0, 0, 64, 64);
    const d = g.getImageData(0, 0, 64, 64).data;
    for (let i = 3; i < d.length; i += 4) if (d[i] < 250) return true;
    return false;
  }
  // Returns { blob, ext, resized, before, after, from, to, why }. Falls back to the original file when anything is unusual.
  async function process(file) {
    const s = settings();
    const keep = why => ({ blob: file, ext: extOf(file), resized: false, why, before: file.size, after: file.size });
    if (!s.on) return keep("off");
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return keep("type");   // gif, svg, heic and others are left alone
    let bmp;
    try { bmp = await decode(file); } catch (e) { return keep("unreadable"); }
    try {
      const long = Math.max(bmp.width, bmp.height);
      const tooBig = long > s.max, heavy = file.size > 1.2 * 1048576;
      if (!tooBig && !heavy) return keep("small");
      const k = tooBig ? s.max / long : 1;
      const w = Math.max(1, Math.round(bmp.width * k)), h = Math.max(1, Math.round(bmp.height * k));
      const type = file.type === "image/png" && hasAlpha(bmp) ? "image/png" : "image/jpeg";   // keep see-through PNGs, otherwise JPEG is far smaller
      const c = document.createElement("canvas"); c.width = w; c.height = h;
      const g = c.getContext("2d");
      g.imageSmoothingQuality = "high";
      if (type === "image/jpeg") { g.fillStyle = "#ffffff"; g.fillRect(0, 0, w, h); }
      g.drawImage(bmp, 0, 0, w, h);
      const blob = await new Promise(res => c.toBlob(res, type, s.quality));
      if (!blob || blob.size >= file.size) return keep("already small");
      return { blob, ext: type === "image/png" ? "png" : "jpg", resized: true, before: file.size, after: blob.size, from: bmp.width + "×" + bmp.height, to: w + "×" + h };
    } finally { if (bmp.close) bmp.close(); }
  }
  function describe(r) {
    if (r.resized) return "shrunk " + fmt(r.before) + " to " + fmt(r.after) + " (" + r.from + " to " + r.to + ")";
    if (r.why === "off") return "added as is (shrinking is off)";
    if (r.why === "small") return "already small (" + fmt(r.before) + "), added as is";
    if (r.why === "type") return "added as is (" + fmt(r.before) + ")";
    return "added as is (" + fmt(r.before) + ")";
  }
  const controlHtml = () => '<label class="sub pr-box" style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin:6px 0">' +
    '<input type="checkbox" class="pr-on"> Shrink big photos to <select class="pr-max" style="width:auto;padding:2px"><option value="1200">1200</option><option value="1600">1600</option><option value="2000">2000</option></select> pixels wide when I add them' +
    ' <span style="color:#777">(recommended: faster on phones)</span></label>';
  function wire(root) {
    const on = root.querySelector(".pr-on"), mx = root.querySelector(".pr-max");
    if (!on || !mx) return;
    const s = settings();
    on.checked = !!s.on; mx.value = String(s.max); mx.disabled = !s.on;
    const change = () => { const n = settings(); n.on = on.checked; n.max = +mx.value; mx.disabled = !n.on; save(n); };
    on.onchange = change; mx.onchange = change;
  }
  window.PhotoResize = { process, describe, controlHtml, wire, settings };
})();
