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
    ["here.button",       "You are here", "Name of the button that shows the visitor's own location on the map", "Show where I am"],
    ["here.follow",       "You are here", "Name of the button, once their dot is showing, that keeps the map centered on them", "Keep the map on me"],
    ["here.stop",         "You are here", "Name of the button that stops showing their location", "Stop showing where I am"],
    ["here.askTitle",     "You are here", "Question the first time a visitor taps the button", "Show where I am?"],
    ["here.askText",      "You are here", "The explanation under it. It should say where their location goes (nowhere).", "Your phone will ask for permission. Your location stays on your phone. It is not sent anywhere or saved."],
    ["here.askYes",       "You are here", "Button that agrees", "Show me"],
    ["here.askNo",        "You are here", "Button that says not now", "Not now"],
    ["here.looking",      "You are here", "While the phone is still finding them", "Looking for you\u2026"],
    ["here.youAre",       "You are here", "Once found", "You are here"],
    ["here.accuracy",     "You are here", "How exact the location is", "accurate to about {d}", "Keep {d}. It becomes a distance such as 30 ft."],
    ["here.poor",         "You are here", "When the location is not exact enough to give distances", "Your location is not precise yet. Try moving to open sky."],
    ["here.outside",      "You are here", "When they are outside the area this map covers", "You appear to be outside the map area."],
    ["here.denied",       "You are here", "When the phone has location turned off for this site", "Location is turned off for this site. Turn it on in your browser\u2019s settings to use this."],
    ["here.unavailable",  "You are here", "When the phone could not find them", "Your device could not find your location."],
    ["here.unsupported",  "You are here", "On a device that cannot share a location", "This device cannot share its location."],
    ["here.toStop",       "You are here", "Under a tour stop: how far it is", "{trip} to this stop", "Keep {trip}. It becomes something like Walk 3 min \u00b7 700 ft."],
    ["here.toFirst",      "You are here", "On a tour\u2019s overview: how far the first stop is", "{trip} to the first stop", "Keep {trip}. It becomes something like Walk 3 min \u00b7 700 ft."],
    ["here.fromYou",      "You are here", "On a place\u2019s card: how far away it is", "{d} from you", "Keep {d}. It becomes a distance such as 700 ft."],
    ["here.arrived",      "You are here", "Under a tour stop, when they are there", "You\u2019ve arrived"],
    ["here.arrivedAt",    "You are here", "Read out by a screen reader when they arrive", "You\u2019ve arrived at {name}", "Keep {name}. It becomes the stop\u2019s name."],
    ["here.keepAwake",    "You are here", "Switch that keeps the screen from going dark while they walk", "Keep screen on"],
    ["here.towards",      "You are here", "Read out by a screen reader with the direction", "Direction: {dir}", "Keep {dir}. It becomes a direction such as north-east."],
    ["here.pretend",      "You are here", "Shown when you try the walk at your desk (add ?pretend=1 to the map\u2019s address)", "Pretend walk: drag the blue dot to try it out."],
    ["here.dir.0",        "You are here", "Direction word: north", "north"],
    ["here.dir.1",        "You are here", "Direction word: north-east", "north-east"],
    ["here.dir.2",        "You are here", "Direction word: east", "east"],
    ["here.dir.3",        "You are here", "Direction word: south-east", "south-east"],
    ["here.dir.4",        "You are here", "Direction word: south", "south"],
    ["here.dir.5",        "You are here", "Direction word: south-west", "south-west"],
    ["here.dir.6",        "You are here", "Direction word: west", "west"],
    ["here.dir.7",        "You are here", "Direction word: north-west", "north-west"],
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
