/* workspace.js: "Design Event" mode.
   When you are designing an event, the editors read their files from events/<name>/ and publish back into it,
   so the live map is never touched. Pick the event on the Events tab ("Design this event"). The choice lasts
   until you close the browser tab, so it can never stay switched on by accident.
   An editor page calls Workspace.install() near the top of its <head> to follow the event's folder. */
(function () {
  "use strict";
  const KEY = "ets_workspace";
  const FALLBACK_DATA = ["site.csv","locations.csv","childmarkers.csv","categories.csv","spots.csv","tours.csv","tourstops.csv","lines.geojson","stamps.csv","tasks.csv","prizes.csv","photos.csv","shapes.csv","overlays.json","border.geojson"];
  const DATA = (window.ETS_CONFIG && window.ETS_CONFIG.DATA) || FALLBACK_DATA;   // the list lives in ets-config.js
  const ASSET = /^(photos|spots|stories|anims)\//;
  const valid = s => /^[a-z0-9][a-z0-9_-]*$/i.test(s || "") && !["main", "index"].includes(String(s).toLowerCase());
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  let slug = "";
  try {
    const p = new URLSearchParams(location.search).get("workspace");   // an editor opened on its own can use ?workspace=name
    if (p !== null) { if (valid(p)) sessionStorage.setItem(KEY, p.toLowerCase()); else sessionStorage.removeItem(KEY); }
    slug = sessionStorage.getItem(KEY) || "";
  } catch (e) {}
  if (!valid(slug)) slug = "";
  const dir = slug ? "events/" + slug + "/" : "";
  const current = () => { try { const s = sessionStorage.getItem(KEY) || ""; return valid(s) ? s.toLowerCase() : ""; } catch (e) { return ""; } };

  const rel = p => String(p).replace(/^\.\//, "");
  const rewrite = p => {
    if (!slug || typeof p !== "string" || /^([a-z]+:)?\/\//i.test(p) || /^(blob|data):/.test(p)) return p;
    const r = rel(p), bare = r.split("?")[0];
    return DATA.includes(bare) || ASSET.test(r) ? dir + r : p;
  };
  const LIVE = () => (window.ETS_CONFIG && window.ETS_CONFIG.LIVE_PAGE) || "Demo2a.html";
  const previewUrl = () => { try { return new URL(LIVE() + "?event=" + slug, location.href).href; } catch (e) { return LIVE() + "?event=" + slug; } };

  function set(next, quiet) {
    try { if (!quiet && window.parent !== window && window.parent.ETSHub && window.parent.ETSHub.anyDirty() && !confirm("Some tabs have unsaved changes (marked with a red dot). Switching will discard them. Switch anyway?")) return; } catch (e) {}                                   // switch the whole tab (and every editor in the hub) to an event, or "" for the live site
    try { if (next && valid(next)) sessionStorage.setItem(KEY, next.toLowerCase()); else sessionStorage.removeItem(KEY); } catch (e) {}
    if (quiet) return;
    if (window.parent !== window) { try { window.parent.postMessage({ type: "ets-workspace" }, location.origin); } catch (e) {} }
    else location.reload();
  }

  function pill() {
    const make = () => {
      const st = document.createElement("style");
      st.textContent = "#ws-frame{position:fixed;inset:0;border:4px solid #d4351c;pointer-events:none;z-index:2147482000}" +
        "#ws-pill{position:fixed;top:0;left:50%;transform:translateX(-50%);background:#d4351c;color:#fff;font:12px/1.3 system-ui,Arial,sans-serif;padding:3px 12px;border-radius:0 0 8px 8px;z-index:2147482001;max-width:96vw;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
        "#ws-pill a{color:#fff;margin-left:10px;text-decoration:underline;cursor:pointer}";
      document.head.appendChild(st);
      const fr = document.createElement("div"); fr.id = "ws-frame"; document.body.appendChild(fr);
      const pl = document.createElement("div"); pl.id = "ws-pill";
      pl.innerHTML = 'Designing event: <b id="ws-name">' + esc(slug) + '</b>. Changes go into events/' + esc(slug) + '/, not the live map.' +
        ' <a href="' + esc(previewUrl()) + '" target="_blank" rel="noopener">Preview</a> <a id="ws-back">Back to live site</a>';
      document.body.appendChild(pl);
      pl.querySelector("#ws-back").onclick = () => set("");
      realFetch(dir + "event.json", { cache: "no-store" }).then(r => r.ok ? r.json() : null).then(j => { if (j && j.name) pl.querySelector("#ws-name").textContent = j.name; }).catch(() => {});
    };
    if (document.body) make(); else document.addEventListener("DOMContentLoaded", make);
  }

  // Shared layers (the town outline and old maps) are the same for every event, so they cannot be edited from inside one.
  function block(message) {
    if (!slug) return;
    const go = () => {
      const ov = document.createElement("div");
      ov.style.cssText = "position:fixed;inset:0;background:#fffffff2;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:20px;font:15px/1.5 system-ui,Arial,sans-serif;text-align:center";
      ov.innerHTML = '<div style="max-width:440px"><h2 style="margin:0 0 8px">Not available while designing an event</h2><p>' + esc(message) +
        '</p><button id="ws-leave" style="font:inherit;padding:8px 14px;border-radius:6px;border:1px solid #bbb;background:#fff;cursor:pointer">Back to the live site</button></div>';
      document.body.appendChild(ov);
      ov.querySelector("#ws-leave").onclick = () => set("");
    };
    if (document.body) go(); else document.addEventListener("DOMContentLoaded", go);
  }

  const realFetch = window.fetch.bind(window);
  let installed = false;
  function install() {
    if (installed || !slug) return;
    installed = true;
    window.fetch = (input, init) => realFetch(typeof input === "string" ? rewrite(input) : input, init);
    [HTMLImageElement.prototype, HTMLMediaElement.prototype].forEach(proto => {
      const d = Object.getOwnPropertyDescriptor(proto, "src");
      if (d && d.set) Object.defineProperty(proto, "src", { configurable: true, enumerable: d.enumerable, get: d.get, set(v) { d.set.call(this, rewrite(v)); } });
    });
    pill();
  }

  window.Workspace = { slug, dir, DATA, valid, rewrite, install, block, set, current, previewUrl };
})();
