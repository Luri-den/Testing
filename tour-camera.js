/* tour-camera.js: frames a tour or trail in the middle of the visible map, and (if the curator turned it on) slowly
   turns the camera around it. It stops the moment the visitor touches the map, and never turns for visitors who have
   asked their device for reduced motion. Shared by the map. The settings live in Site Settings and the Tours editor. */
(function () {
  "use strict";
  const SPEEDS = { slow: 4, medium: 8, fast: 15 };          // degrees per second (a full turn takes 90, 45 or 24 seconds)
  const ZERO = { top: 0, right: 0, bottom: 0, left: 0 };

  function create(map, opts) {
    opts = opts || {};
    const reduced = () => opts.reducedMotion ? opts.reducedMotion() : !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
    const raf = opts.raf || (cb => window.requestAnimationFrame(cb)), caf = opts.caf || (id => window.cancelAnimationFrame(id));
    const later = opts.setTimeout || ((fn, ms) => setTimeout(fn, ms)), unlater = opts.clearTimeout || (id => clearTimeout(id));
    const now = opts.now || (() => performance.now());
    const log = opts.log || (() => {});
    let run = null, padded = false;

    function frame(points, o) {                             // put the whole tour in the middle of the part of the map you can see
      o = o || {};
      const pts = (points || []).filter(p => p && isFinite(p[0]) && isFinite(p[1]));
      if (!pts.length) return null;
      const pad = o.padding || ZERO;
      let inner = pad;
      try { if (typeof map.setPadding === "function") { map.setPadding(pad); padded = true; inner = 30; } } catch (e) { padded = false; }
      const lng = pts.map(p => p[0]), lat = pts.map(p => p[1]);
      const bounds = [[Math.min.apply(null, lng), Math.min.apply(null, lat)], [Math.max.apply(null, lng), Math.max.apply(null, lat)]];
      const opt = { padding: inner, maxZoom: o.maxZoom || 17, duration: o.duration == null ? 700 : o.duration, bearing: 0, pitch: Math.max(0, Math.min(60, +o.pitch || 0)) };
      log("frame: " + pts.length + " points, panel space " + JSON.stringify(pad) + ", setPadding " + (padded ? "used" : "NOT available"));
      try { map.fitBounds(bounds, opt); log("frame: fitBounds ok"); }
      catch (e) {                                           // if that call is refused, work the move out by hand
        log("frame: fitBounds FAILED (" + e.message + "), trying cameraForBounds + easeTo");
        try { const c = map.cameraForBounds(bounds, { padding: inner, maxZoom: opt.maxZoom }); map.easeTo({ center: c.center, zoom: c.zoom, bearing: 0, pitch: opt.pitch, duration: opt.duration }); log("frame: fallback ok"); }
        catch (e2) { log("frame: fallback FAILED (" + e2.message + ")"); return null; }
      }
      return { bounds, center: [(bounds[0][0] + bounds[1][0]) / 2, (bounds[0][1] + bounds[1][1]) / 2] };
    }

    function stop(reset, instant) {                         // stop turning; with reset, also face north again and give the map its full width back (instant = no animation, for when another move follows at once)
      if (run) {
        if (run.timer != null) unlater(run.timer);
        if (run.id != null) caf(run.id);
        run.handlers.forEach(h => { try { map.off(h[0], h[1]); } catch (e) {} });
        run = null;
      }
      if (reset) {
        try { if (instant && typeof map.jumpTo === "function") map.jumpTo({ bearing: 0, pitch: 0 }); else map.easeTo({ bearing: 0, pitch: 0, duration: 600 }); } catch (e) {}
        if (padded) { try { map.setPadding(ZERO); } catch (e) {} padded = false; }
      }
    }

    function spin(o) {                                      // o: { speed: "slow"|"medium"|"fast", delay: ms to wait for the framing move to finish }
      stop(false);
      if (reduced()) { log("spin: NOT started. This device or browser has 'reduce motion' turned on (on Windows: Settings > Accessibility > Visual effects > Animation effects)."); return false; }
      o = o || {};
      const dps = SPEEDS[o.speed] || SPEEDS.medium;
      run = { id: null, timer: null, handlers: [] };
      const me = run;
      ["mousedown", "touchstart", "wheel"].forEach(ev => { const h = () => { log("spin: stopped because the visitor touched the map (" + ev + ")"); stop(false); }; map.on(ev, h); me.handlers.push([ev, h]); });
      log("spin: will start in " + (o.delay == null ? 900 : o.delay) + " ms at " + (o.speed || "medium") + " speed");
      me.timer = later(() => {
        if (run !== me) return;
        const t0 = now(), b0 = typeof map.getBearing === "function" ? map.getBearing() : 0;
        let last = -1e9, first = true;
        const step = () => {
          if (run !== me) return;
          const t = now();
          if (t - last >= 30) {                              // about 30 turns of the picture a second is plenty, and keeps the map light
            last = t;
            try { map.setBearing(((b0 + dps * (t - t0) / 1000) % 360 + 360) % 360); if (first) { first = false; log("spin: running at " + dps + " degrees a second, starting from " + Math.round(b0) + " degrees"); } }
            catch (e) { log("spin: setBearing FAILED (" + e.message + ")"); stop(false); return; }
          }
          me.id = raf(step);
        };
        step();
      }, o.delay == null ? 900 : o.delay);
      return true;
    }

    return { frame, spin, stop, isSpinning: () => !!run, SPEEDS };
  }
  window.TourCamera = { create, SPEEDS };
})();
