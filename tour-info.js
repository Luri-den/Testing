/* tour-info.js: how long a tour takes, the facts about it, and the visitor's tour list and tour overview.
   Shared by the map (Demo2a.html) and the Tours editor, so the numbers a curator sees are the numbers visitors see.
   All the words come from labels.js, so the curator can change them in the Wording tab.

   A tour here is { id, title, type: "tour"|"trail", modes: "walk|bike", length: miles, minutes: (optional override),
                    effort: "Easy"..., summary, intro, stops: [ ... ], featured: true/false }                          */
(function () {
  "use strict";
  // minutes per mile for each way of travelling (the same speeds the Tours editor uses: walk 3 mph, hike 2, bike 10, drive 30)
  const PACE = { walk: 20, hike: 30, bike: 6, drive: 2 };
  const STOP_MIN = { walk: 5, hike: 5, bike: 4, drive: 5, virtual: 3 };       // time spent at each stop
  const GRACE = 1.1;                                                          // a "1 hour" button still shows a tour that takes 1 hour 4 minutes
  const list = v => String(v || "").split(/[|;,]/).map(s => s.trim().toLowerCase()).filter(Boolean);
  const L0 = (k, v) => window.Labels ? Labels.t(k, v) : k;

  const primaryMode = t => list(t.modes).find(x => PACE[x]) || "";
  function minutes(t) {                              // a number of minutes, or null when it cannot be worked out
    const set = parseFloat(t.minutes);
    if (set > 0) return Math.round(set);
    const modes = list(t.modes), stops = (t.stops && t.stops.length) || 0, m = primaryMode(t);
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
  function meta(t) {                                 // "1 hr 4 min · 1.2 mi · Easy · 8 stops"
    const m = minutes(t), n = (t.stops && t.stops.length) || 0;
    return [duration(m), t.length > 0 ? t.length + " mi" : "", t.effort || "", n ? n + " stop" + (n === 1 ? "" : "s") : ""].filter(Boolean).join(" \u00b7 ");
  }
  const fits = (t, limit) => !limit || (minutes(t) != null && minutes(t) <= Math.round(limit * GRACE));       // limit 0 means "any length"

  // the time between two stops: "Walk 2 min · 0.1 mi" (feet when it is very short)
  function distance(meters) {
    const mi = meters / 1609.344;
    return mi < 0.1 ? Math.max(10, Math.round(meters * 3.28084 / 10) * 10) + " ft" : (Math.round(mi * 10) / 10) + " mi";
  }
  function legText(meters, mode, L) {
    const word = (L || L0)("tours.mode." + mode);
    return word + " " + Math.max(1, Math.round(meters / 1609.344 * PACE[mode])) + " min \u00b7 " + distance(meters);
  }

  const kindWord = (t, L) => (L || L0)(t.type === "trail" ? "tours.trailWord" : "tours.tourWord");
  const goText = (t, L) => (L || L0)(!(t.stops && t.stops.length) ? "tours.showRoute" : t.type === "trail" ? "tours.startTrail" : "tours.startTour");

  function card(t, i, o) {
    const esc = o.esc, L = o.L, ann = o.announce ? o.announce(t) : null;
    const tag = ann ? '<span class="tcTag" style="background:' + esc(ann.color) + ";color:" + esc(o.readable ? o.readable(ann.color) : "#fff") + '">' + (ann.st && ann.st.state === "now" ? "\u25CF " : "") + esc(ann.tag) + "</span>" : "";
    const blurb = t.summary || t.intro || "";
    return '<div class="tc' + (ann || t.featured ? " feat" : "") + '" data-ov="' + i + '">' + tag +
      '<div class="tcTop"><button type="button" class="tcOpen" data-ov="' + i + '"><b>' + esc(t.title) + '</b></button><span class="tcKind">' + esc(kindWord(t, L)) + "</span></div>" +
      '<small class="tcMeta">' + esc(meta(t) || "\u2014") + "</small>" +
      (t.type === "trail" ? '<small class="tcMeta">' + esc(L("tours.joinAnywhere")) + "</small>" : "") +
      (blurb ? "<p>" + esc(blurb.length > 140 ? blurb.slice(0, 137) + "..." : blurb) + "</p>" : "") +
      '<button type="button" class="tcGo" data-t="' + i + '">' + esc(goText(t, L)) + "</button></div>";
  }

  // the list: time buttons, featured tours first, then the rest
  function listHtml(tours, o) {
    o = Object.assign({ L: L0 }, o);
    const L = o.L, limit = o.limit || 0, esc = o.esc, chips = o.chips || (window.Labels ? Labels.chips() : [{ minutes: 30, label: "30 min" }, { minutes: 60, label: "1 hour" }, { minutes: 120, label: "2 hours" }, { minutes: 240, label: "Half day" }]);
    const shown = tours.map((t, i) => ({ t, i })).filter(x => fits(x.t, limit));
    const isFeat = x => x.t.featured || (o.announce && o.announce(x.t));
    const feat = shown.filter(isFeat), rest = shown.filter(x => !isFeat(x));
    let h = '<div class="tcHead"><h2>' + esc(L("tours.title")) + '</h2><button type="button" class="tcClose" data-g="x" aria-label="' + esc(L("tours.close")) + '">&times;</button></div>' +
      '<div class="tcPrompt">' + esc(L("tours.timePrompt")) + "</div>" +
      '<div class="tcChips" role="group" aria-label="' + esc(L("tours.timePrompt")) + '">' +
      [{ minutes: 0, label: L("tours.chipAny") }].concat(chips).map(c => '<button type="button" class="tcChip' + (c.minutes === limit ? " on" : "") + '" data-chip="' + c.minutes + '" aria-pressed="' + (c.minutes === limit) + '">' + esc(c.label) + "</button>").join("") + "</div>" +
      '<div class="tcScroll">';
    if (!shown.length) return h + '<p class="tcNone">' + esc(L("tours.none")) + "</p></div>";
    if (feat.length) h += '<h3 class="tcSec">' + esc(L("tours.featured")) + "</h3>" + feat.map(x => card(x.t, x.i, o)).join("");
    if (rest.length) h += (feat.length ? '<h3 class="tcSec">' + esc(L("tours.all")) + "</h3>" : "") + rest.map(x => card(x.t, x.i, o)).join("");
    return h + "</div>";
  }

  // the overview: what the tour is, every stop in order with the walk between them, and a Start button that stays in view.
  // o.stops = [{ name, note, leg }] worked out by the map from the real places
  function overviewHtml(t, i, o) {
    o = Object.assign({ L: L0 }, o);
    const L = o.L, esc = o.esc, ann = o.announce ? o.announce(t) : null, trail = t.type === "trail", stops = o.stops || [];
    const tag = ann ? '<span class="tcTag" style="background:' + esc(ann.color) + ";color:" + esc(o.readable ? o.readable(ann.color) : "#fff") + '">' + (ann.st && ann.st.state === "now" ? "\u25CF " : "") + esc(ann.tag) + "</span>" : "";
    const desc = t.intro || t.summary || "";
    return '<div class="tcHead"><button type="button" class="tcBack" data-g="list">\u2190 ' + esc(L("tours.backToList")) + '</button><button type="button" class="tcClose" data-g="x" aria-label="' + esc(L("tours.close")) + '">&times;</button></div>' +
      '<div class="tcScroll">' + tag +
      '<div class="tcTop"><h2>' + esc(t.title) + '</h2><span class="tcKind">' + esc(kindWord(t, L)) + "</span></div>" +
      '<small class="tcMeta">' + esc(meta(t) || "\u2014") + "</small>" +
      (desc ? '<p class="tcDesc">' + esc(desc) + "</p>" : "") +
      (trail ? '<div class="tcHint">' + esc(L("tours.joinAnywhere")) + "</div>" : "") +
      (stops.length ? '<h3 class="tcSec">' + esc(L("tours.stops")) + '</h3><ol class="tcStops' + (trail ? " dots" : "") + '">' +
        stops.map((s, n) => '<li><span class="tcNum">' + (trail ? "\u2022" : n + 1) + '</span><div><b>' + esc(s.name) + "</b>" +
          ((s.note || (n === 0 && !trail)) ? '<span class="tcNote">' + esc(s.note || L("tours.startHere")) + "</span>" : "") +
          (s.leg ? '<span class="tcLeg">' + esc(s.leg) + "</span>" : "") + "</div></li>").join("") + "</ol>" : "") +
      '</div><div class="tcFoot"><button type="button" class="tcGo big" data-t="' + i + '">' + esc(goText(t, L)) + "</button></div>";
  }

  window.TourInfo = { PACE, GRACE, minutes, duration, meta, fits, distance, legText, primaryMode, listHtml, overviewHtml, kindWord, goText };
})();
