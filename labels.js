/* labels.js: every phrase a visitor reads that this site makes up itself ("Start the tour", "Happening now", ...).
   The curator changes them in the hub's Wording tab; they are saved in labels.csv (KEY,TEXT). A phrase that is not in
   labels.csv, or is blank there, uses the standard wording below. Shared by the map, the Wording editor and the checker.

   {names} in curly braces are filled in by the site (for example {end} becomes "Sat, Nov 14 at 5 PM"). */
(function () {
  "use strict";
  // [key, group, what it is (plain words), standard wording, help text (optional)]
  const LIST = [
    ["tours.button",      "Tours and trails list", "The map button that opens the tour list", "Tours & Trails"],
    ["tours.title",       "Tours and trails list", "Heading at the top of the list", "Tours & Trails"],
    ["tours.timePrompt",  "Tours and trails list", "Question above the time buttons", "How much time do you have?"],
    ["tours.chipAny",     "Tours and trails list", "Time button that shows everything", "Any length"],
    ["tours.chips",       "Tours and trails list", "Time buttons (minutes and wording)", "30=30 min|60=1 hour|120=2 hours|240=Half day", "", "special"],
    ["tours.featured",    "Tours and trails list", "Heading over featured tours", "Featured"],
    ["tours.happeningNow", "Tours and trails list", "Heading over tours that run only during an event, while it is on", "Happening now"],
    ["tours.all",         "Tours and trails list", "Heading over the other tours", "All tours and trails"],
    ["tours.none",        "Tours and trails list", "Message when no tour fits the chosen time", "Nothing fits that much time. Try a longer choice."],
    ["tours.tourWord",    "Tours and trails list", "The word for a tour (a route with stops in order)", "Tour"],
    ["tours.trailWord",   "Tours and trails list", "The word for a trail (join it anywhere)", "Trail"],
    ["tours.joinAnywhere","Tours and trails list", "Note on every trail", "Join anywhere along the route."],
    ["tours.startTour",   "Tour buttons", "Button that starts a tour", "Start the tour"],
    ["tours.startTrail",  "Tour buttons", "Button that starts a trail", "Start the trail"],
    ["tours.showRoute",   "Tour buttons", "Button for a route with no stops", "Show the route"],
    ["tours.backToList",  "Tour buttons", "Button that goes back to the list", "Back to all tours"],
    ["tours.close",       "Tour buttons", "Button that closes the tour panel", "Close"],
    ["tours.stops",       "Tour overview", "Heading over the list of stops", "Stops"],
    ["tours.startHere",   "Tour overview", "Shown on the first stop when it has no note of its own", "Start here"],
    ["tours.mode.walk",   "Tour overview", "Word before the time between stops, on foot", "Walk"],
    ["tours.mode.hike",   "Tour overview", "Word before the time between stops, hiking", "Hike"],
    ["tours.mode.bike",   "Tour overview", "Word before the time between stops, by bike", "Bike"],
    ["tours.mode.drive",  "Tour overview", "Word before the time between stops, driving", "Drive"],
    ["tours.notRunning",  "Tour buttons", "Message when a visitor tries to start an event tour that is not on right now", "This tour is not running right now."],
    ["maps.open",        "Place cards", "Button that opens a place in the phone's Maps app", "Open in Maps"],
    ["events.nowButton",  "Events and welcome screen", "Events button while something is on", "Happening Now"],
    ["events.whatsOn",    "Events and welcome screen", "Heading over the announcements in the Events panel", "What\u2019s on"],
    ["events.thingsToDo", "Events and welcome screen", "Heading over the featured tours in the Events panel", "Things to do"],
    ["welcome.seeOnMap",  "Events and welcome screen", "Welcome-screen button that goes to the place", "See it on the map"],
    ["welcome.learnMore", "Events and welcome screen", "Welcome-screen button for a web page with no words of its own", "Learn more"],
    ["welcome.close",     "Events and welcome screen", "Welcome-screen button when there is nothing to go to", "Close"],
    ["welcome.goThere",   "Events and welcome screen", "Welcome-screen button on a place", "Go There"],
    ["welcome.seeSpot",   "Events and welcome screen", "Welcome-screen button on a story or photo spot", "See it"],
    ["welcome.story",     "Events and welcome screen", "Label on a story in the welcome screen", "Story"],
    ["welcome.spot",      "Events and welcome screen", "Label on a photo spot in the welcome screen", "Photo spot"],
    ["status.now",        "Dates and times", "While it is happening", "Happening now, until {end}", "Keep {end}. It becomes the closing day and time."],
    ["status.soon",       "Dates and times", "A few days before it starts", "Coming soon: {start}", "Keep {start}. It becomes the opening day and time."],
    ["status.later",      "Dates and times", "Further ahead", "Next: {start}", "Keep {start}. It becomes the next opening day and time."],
    ["status.ended",      "Dates and times", "After a one-time event is over", "Ended {end}", "Keep {end}. It becomes the closing day."]
  ];
  const DEF = {}; LIST.forEach(r => DEF[r[0]] = { key: r[0], group: r[1], title: r[2], text: r[3], help: r[4] || "", special: r[5] || "" });
  let over = {};

  const fill = (s, vars) => String(s).replace(/\{(\w+)\}/g, (m, k) => vars && vars[k] != null ? vars[k] : m);
  function raw(key) { const o = over[key]; return (o != null && String(o).trim() !== "") ? String(o) : (DEF[key] ? DEF[key].text : key); }
  const t = (key, vars) => fill(raw(key), vars);

  function chips() {                                         // [{ minutes, label }] in the order the curator set
    const out = [];
    raw("tours.chips").split("|").forEach(p => { const m = /^\s*(\d+)\s*=\s*(.+?)\s*$/.exec(p); if (m && +m[1] > 0) out.push({ minutes: +m[1], label: m[2] }); });
    return out.length ? out.slice(0, 8) : chipsOf(DEF["tours.chips"].text);
  }
  function chipsOf(s) { return s.split("|").map(p => { const m = /^(\d+)=(.+)$/.exec(p); return { minutes: +m[1], label: m[2] }; }); }

  function parse(text, papa) {
    const P = papa || window.Papa, out = {};
    if (!P) return out;
    (P.parse(String(text || "").replace(/^\uFEFF/, ""), { header: true, skipEmptyLines: true }).data || []).forEach(r => { const k = String(r.KEY || "").trim(); if (k) out[k] = String(r.TEXT == null ? "" : r.TEXT); });
    return out;
  }
  function set(o) { over = Object.assign({}, o); }
  function load(url) {
    return fetch(url || (window.ETS_CONFIG && ETS_CONFIG.LABELS_FILE) || "labels.csv", { cache: "no-store" })
      .then(r => r.ok ? r.text() : "").then(x => { over = parse(x); return over; }).catch(() => over);
  }
  window.Labels = { LIST, DEF, t, raw, chips, fill, parse, set, load, overrides: () => Object.assign({}, over) };
})();
