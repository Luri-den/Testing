/* editor-common.js: shared by every editor.
   1) Unsaved-changes warning: an editor counts as "unsaved" while its Download button is enabled and has not been clicked since your last edit. The hub shows a red dot on that tab.
   2) applySiteView(map): opens an editor map on the site's own start view (CENTER_LAT / CENTER_LNG / ZOOM in site.csv) unless the editor has already moved the map itself. */
(function () {
  "use strict";
  // "Unsaved" means: you edited something after the page loaded and have not clicked Download since.
  // Some editors switch their Download button on just because data finished loading, so the button alone is not proof of an edit.
  let edited = false, touched = false, last = null;
  const t0 = Date.now();
  const btn = () => document.getElementById("publishBtn") || document.getElementById("dlBtn");
  const dirty = () => { const b = btn(); return !!b && !b.disabled && edited; };
  function report() {
    const d = dirty();
    if (d === last) return;
    last = d;
    try { if (window.parent !== window) window.parent.postMessage({ type: "ets-dirty", dirty: d }, location.origin); } catch (e) {}
  }
  const later = () => setTimeout(report, 60);
  const ignoreField = el => !el || (el.type && /^(search|file)$/.test(el.type)) ||
    /search|filter|find|zoom/i.test((el.id || "") + " " + (el.name || "") + " " + (el.placeholder || ""));
  document.addEventListener("click", e => { const b = btn(); if (b && b.contains(e.target)) { edited = false; later(); } }, true);
  ["pointerdown", "keydown"].forEach(t => document.addEventListener(t, () => { touched = true; }, true));
  ["input", "change"].forEach(t => document.addEventListener(t, e => {
    const b = btn();
    if (Date.now() - t0 < 1500 || (b && b.contains(e.target)) || ignoreField(e.target)) return;
    edited = true; later();
  }, true));
  document.addEventListener("DOMContentLoaded", () => {
    const b = btn();
    if (b) new MutationObserver(() => { if (!b.disabled && touched) edited = true; later(); }).observe(b, { attributes: true, attributeFilter: ["disabled"] });
    setInterval(report, 1500);
  });
  // Only a page opened on its own warns before closing. Inside the hub, the hub does the warning (see tabs.html).
  window.addEventListener("beforeunload", e => { if (window.parent === window && dirty()) { e.preventDefault(); e.returnValue = ""; } });

  function applySiteView(map) {
    const c0 = map.getCenter();
    fetch("site.csv", { cache: "no-store" }).then(r => r.ok ? r.text() : "").then(t => {
      const kv = {};
      String(t).split(/\r?\n/).forEach(l => { const m = /^([A-Z_]+),(.*)$/.exec(l); if (m) kv[m[1]] = m[2].replace(/^"|"$/g, "").trim(); });
      const lat = parseFloat(kv.CENTER_LAT), lng = parseFloat(kv.CENTER_LNG);
      if (!isFinite(lat) || !isFinite(lng)) return;
      const c = map.getCenter();
      if (Math.abs(c.lng - c0.lng) > 1e-6 || Math.abs(c.lat - c0.lat) > 1e-6) return;
      const z = parseFloat(kv.ZOOM);
      map.jumpTo({ center: [lng, lat], zoom: isFinite(z) ? z : 10 });
    }).catch(() => {});
  }
  window.ETSCommon = { applySiteView, isDirty: dirty };
})();
