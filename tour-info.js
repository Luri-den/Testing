/* tour-info.js: how long a tour takes, the one-line facts about it, and the visitor's tour list.
   Shared by the map (Demo2a.html) and the Tours editor, so the numbers a curator sees are the numbers visitors see.

   A tour here is { id, title, type: "tour"|"trail", modes: "walk|bike", length: miles, minutes: (optional override),
                    effort: "Easy"..., summary, intro, stops: [ ... ], featured: true/false }                          */
(function () {
  "use strict";
  // minutes per mile for each way of travelling (the same speeds the Tours editor uses: walk 3 mph, hike 2, bike 10, drive 30)
  const PACE = { walk: 20, hike: 30, bike: 6, drive: 2 };
  const STOP_MIN = { walk: 5, hike: 5, bike: 4, drive: 5, virtual: 3 };       // time spent at each stop
  const list = v => String(v || "").split(/[|;,]/).map(s => s.trim().toLowerCase()).filter(Boolean);

  function minutes(t) {                              // a number of minutes, or null when it cannot be worked out
    const set = parseFloat(t.minutes);
    if (set > 0) return Math.round(set);
    const modes = list(t.modes), stops = (t.stops && t.stops.length) || 0;
    const m = modes.find(x => PACE[x]);
    if (m && t.length > 0) return Math.max(5, Math.round(t.length * PACE[m] + (t.type === "trail" ? 0 : stops * (STOP_MIN[m] || 5))));
    if (modes.includes("virtual") && stops) return stops * STOP_MIN.virtual;
    return null;
  }
  function duration(m) {
    if (m == null) return "";
    if (m < 60) return m + " min";
    const h = Math.floor(m / 60), r = m % 60;
    return h + " hr" + (r ? " " + r + " min" : "");
  }
  function meta(t) {                                 // "1 hr · 1.2 mi · Easy · 8 stops"
    const m = minutes(t), n = (t.stops && t.stops.length) || 0;
    return [duration(m), t.length > 0 ? t.length + " mi" : "", t.effort || "", n ? n + " stop" + (n === 1 ? "" : "s") : ""].filter(Boolean).join(" \u00b7 ");
  }
  const fits = (t, limit) => !limit || (minutes(t) != null && minutes(t) <= limit);       // limit 0 means "any length"

  const CHIPS = [[0, "Any length"], [30, "30 min"], [60, "1 hour"], [120, "2 hours"], [240, "Half day"]];
  const kindWord = t => t.type === "trail" ? "Trail" : "Tour";

  function card(t, i, o) {
    const esc = o.esc, ann = o.announce ? o.announce(t) : null;
    const tag = ann ? '<span class="tcTag" style="background:' + esc(ann.color) + ";color:" + esc(o.readable ? o.readable(ann.color) : "#fff") + '">' + (ann.st && ann.st.state === "now" ? "\u25CF " : "") + esc(ann.tag) + "</span>" : "";
    const blurb = t.summary || t.intro || "";
    const go = !(t.stops && t.stops.length) ? "Show the route" : (t.type === "trail" ? "Start the trail" : "Start the tour");
    return '<div class="tc' + (ann || t.featured ? " feat" : "") + '">' + tag +
      '<div class="tcTop"><b>' + esc(t.title) + '</b><span class="tcKind">' + kindWord(t) + "</span></div>" +
      '<small class="tcMeta">' + esc(meta(t) || "Length not set") + "</small>" +
      (t.type === "trail" ? '<small class="tcMeta">Join anywhere along the route.</small>' : "") +
      (blurb ? "<p>" + esc(blurb.length > 140 ? blurb.slice(0, 137) + "..." : blurb) + "</p>" : "") +
      '<button type="button" class="tcGo" data-t="' + i + '">' + go + "</button></div>";
  }

  // the whole list: time chips, featured ones first, then the rest
  function listHtml(tours, o) {
    const limit = o.limit || 0, esc = o.esc;
    const shown = tours.map((t, i) => ({ t, i })).filter(x => fits(x.t, limit));
    const isFeat = x => x.t.featured || (o.announce && o.announce(x.t));
    const feat = shown.filter(isFeat), rest = shown.filter(x => !isFeat(x));
    let h = '<div class="tcHead"><h2>Tours &amp; Trails</h2><button type="button" class="tcClose" data-g="x" aria-label="Close">&times;</button></div>' +
      '<div class="tcChips" role="group" aria-label="How much time do you have?">' +
      CHIPS.map(c => '<button type="button" class="tcChip' + (c[0] === limit ? " on" : "") + '" data-chip="' + c[0] + '" aria-pressed="' + (c[0] === limit) + '">' + c[1] + "</button>").join("") + "</div>";
    if (!shown.length) return h + '<p class="tcNone">Nothing fits that much time. Try a longer choice.</p>';
    if (feat.length) h += '<h3 class="tcSec">Featured</h3>' + feat.map(x => card(x.t, x.i, o)).join("");
    if (rest.length) h += (feat.length ? '<h3 class="tcSec">All tours and trails</h3>' : "") + rest.map(x => card(x.t, x.i, o)).join("");
    return h;
  }

  window.TourInfo = { PACE, minutes, duration, meta, fits, CHIPS, listHtml, kindWord };
})();
