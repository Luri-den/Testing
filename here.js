/* here.js: the maths and the location watcher behind "You are here".
   Nothing in here draws anything. The map page (Demo2a.html) uses it to show the visitor's dot and the distance to a stop.

   A position is { lng, lat, acc (metres of uncertainty), heading (degrees, or null), speed (m/s, or null), t (time) }.
   Points are [lng, lat]. The visitor's location is only ever used on their own phone: nothing here sends it anywhere. */
(function () {
  "use strict";
  const R = 6371000, rad = d => d * Math.PI / 180, deg = r => r * 180 / Math.PI;

  // metres between two [lng, lat] points
  function distance(a, b) {
    const dLat = rad(b[1] - a[1]), dLng = rad(b[0] - a[0]);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  // the direction from a to b, in degrees clockwise from north (0 to 360)
  function bearing(a, b) {
    const f1 = rad(a[1]), f2 = rad(b[1]), dl = rad(b[0] - a[0]);
    const y = Math.sin(dl) * Math.cos(f2), x = Math.cos(f1) * Math.sin(f2) - Math.sin(f1) * Math.cos(f2) * Math.cos(dl);
    return (deg(Math.atan2(y, x)) + 360) % 360;
  }
  // which of the eight directions a bearing points to: 0 north, 1 north-east, ... 7 north-west
  const compassIndex = d => Math.round((((d % 360) + 360) % 360) / 45) % 8;
  const WORDS = ["north", "north-east", "east", "south-east", "south", "south-west", "west", "north-west"];
  const compass = d => WORDS[compassIndex(d)];

  // a circle of `meters` radius around a point, as a polygon ring, for drawing the accuracy of a fix on the map
  function circle(lng, lat, meters, steps) {
    const n = steps || 48, out = [], dLat = meters / 111320, dLng = meters / (111320 * Math.max(0.01, Math.cos(rad(lat))));
    for (let i = 0; i <= n; i++) { const a = (i / n) * 2 * Math.PI; out.push([lng + dLng * Math.cos(a), lat + dLat * Math.sin(a)]); }
    return out;
  }

  /* The watcher. start() asks the device for the visitor's position (the browser shows its own permission question then, not before),
     and tells every listener about each new fix. simulate() does the same from a position chosen by hand, for the "pretend walk".
       tracker.on(fn)   fn({ type: "start" | "stop" | "fix" | "error", fix?, code?, message? });  returns a function that stops listening
       error codes: "denied", "unavailable", "timeout", "unsupported"                                                              */
  function tracker(opts) {
    opts = opts || {};
    const geo = opts.geolocation || (typeof navigator !== "undefined" ? navigator.geolocation : null);
    let id = null, last = null, pretend = false;
    const subs = new Set();
    const emit = e => subs.forEach(f => { try { f(e); } catch (x) { /* a listener's mistake must not stop the others */ } });
    const toFix = p => ({
      lng: p.coords.longitude, lat: p.coords.latitude, acc: p.coords.accuracy || 0,
      heading: p.coords.heading != null && !isNaN(p.coords.heading) ? p.coords.heading : null,
      speed: p.coords.speed != null && !isNaN(p.coords.speed) ? p.coords.speed : null, t: p.timestamp || Date.now()
    });
    return {
      supported: () => !!geo,
      on: f => { subs.add(f); return () => subs.delete(f); },
      last: () => last,
      active: () => id !== null || pretend,
      start() {
        if (pretend || id !== null) return;
        if (!geo) { emit({ type: "error", code: "unsupported" }); return; }
        emit({ type: "start" });
        id = geo.watchPosition(
          p => { last = toFix(p); emit({ type: "fix", fix: last }); },
          err => emit({ type: "error", code: err && err.code === 1 ? "denied" : err && err.code === 3 ? "timeout" : "unavailable", message: err && err.message }),
          { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
        );
      },
      stop() {
        if (id !== null && geo) geo.clearWatch(id);
        id = null; pretend = false; last = null;
        emit({ type: "stop" });
      },
      simulate(lng, lat) {
        if (id !== null && geo) { geo.clearWatch(id); id = null; }
        if (!pretend) { pretend = true; emit({ type: "start" }); }
        last = { lng, lat, acc: 8, heading: null, speed: null, t: Date.now() };
        emit({ type: "fix", fix: last });
      }
    };
  }

  window.Here = { distance, bearing, compass, compassIndex, circle, tracker };
})();
