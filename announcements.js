/* announcements.js: "what's on" notices that sit on top of the live map (a quilt show, a food tour, a festival).
   Shared by the map page (Demo2a.html), the Announcements editor (announce.html) and the data checker.
   One row of announcements.csv = one announcement. Needs schedule.js (and PapaParse to read the file).

   Columns:
     ANN_ID      a short unique code, e.g. ANN-001
     NAME        what it is called ("Mary's Quilt Show")
     TAG         the short label on the welcome screen (leave blank to use the name)
     COLOR       the tag's color, like #C2185B
     BLURB       a sentence or two for the welcome screen and the Events panel
     VENUE_IDS   place IDs where it happens, separated by |   (the welcome screen points at the first one)
     LINK, LINK_TEXT   an optional web page and the words on its button
     ENABLED     yes or no (no hides it without deleting it)
     REPEAT      once | yearly | monthly | weekly
     TZ          time zone, e.g. America/Indiana/Indianapolis
     START, END  for once and yearly: 2026-11-07T10:00 (date, T, time)
     START_DAY, END_DAY   for monthly: 1 to 31
     DAYS        for weekly: 0=Sun ... 6=Sat, separated by |   (Saturday and Sunday = 6|0)
     START_TIME, END_TIME for monthly and weekly: 09:00
     SOON_DAYS   how many days ahead it shows as "coming soon" (default 14)
*/
(function () {
  "use strict";
  const DEFAULT_TZ = "America/Indiana/Indianapolis";
  const DEFAULT_COLOR = "#D55E00";
  const COLUMNS = ["ANN_ID", "NAME", "TAG", "COLOR", "BLURB", "VENUE_IDS", "LINK", "LINK_TEXT", "ENABLED",
    "REPEAT", "TZ", "START", "END", "START_DAY", "END_DAY", "DAYS", "START_TIME", "END_TIME", "SOON_DAYS"];

  const str = v => String(v == null ? "" : v).trim();
  const yes = v => !/^(n|no|false|0|off)$/i.test(str(v));          // blank counts as yes
  const list = v => str(v).split("|").map(s => s.trim()).filter(Boolean);
  const goodColor = c => /^#[0-9a-f]{6}$/i.test(str(c)) ? str(c) : DEFAULT_COLOR;

  function readable(hex) {                                         // white or near-black text, whichever reads better on this color
    const c = goodColor(hex).slice(1), n = parseInt(c, 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return (0.299 * r + 0.587 * g + 0.114 * b) > 160 ? "#1a1a1a" : "#ffffff";
  }

  function scheduleFromRow(r) {
    const repeat = str(r.REPEAT).toLowerCase();
    if (!repeat) return null;
    const s = { repeat, tz: str(r.TZ) || DEFAULT_TZ };
    if (repeat === "once" || repeat === "yearly") { s.start = str(r.START); s.end = str(r.END); }
    else {
      s.startTime = str(r.START_TIME); s.endTime = str(r.END_TIME);
      if (repeat === "monthly") { s.startDay = +r.START_DAY; s.endDay = +r.END_DAY; }
      if (repeat === "weekly") s.days = list(r.DAYS).map(Number).filter(n => n >= 0 && n <= 6);
    }
    const soon = str(r.SOON_DAYS);
    if (soon !== "" && !isNaN(+soon)) s.soonDays = +soon;
    return s;
  }

  function scheduleToFields(s) {                                   // the schedule columns for one row (everything else blank)
    const o = { REPEAT: "", TZ: "", START: "", END: "", START_DAY: "", END_DAY: "", DAYS: "", START_TIME: "", END_TIME: "", SOON_DAYS: "" };
    if (!s || !s.repeat) return o;
    o.REPEAT = s.repeat; o.TZ = s.tz || DEFAULT_TZ;
    if (s.repeat === "once" || s.repeat === "yearly") { o.START = s.start || ""; o.END = s.end || ""; }
    else {
      o.START_TIME = s.startTime || ""; o.END_TIME = s.endTime || "";
      if (s.repeat === "monthly") { o.START_DAY = s.startDay || ""; o.END_DAY = s.endDay || ""; }
      if (s.repeat === "weekly") o.DAYS = (s.days || []).join("|");
    }
    if (s.soonDays != null && s.soonDays !== "") o.SOON_DAYS = s.soonDays;
    return o;
  }

  function fromRow(r) {
    const name = str(r.NAME);
    return {
      id: str(r.ANN_ID), name, tag: str(r.TAG) || name, color: goodColor(r.COLOR), blurb: str(r.BLURB),
      venues: list(r.VENUE_IDS), link: str(r.LINK), linkText: str(r.LINK_TEXT), enabled: yes(r.ENABLED),
      schedule: scheduleFromRow(r), kind: "announcement"
    };
  }
  function toRow(a) {
    return Object.assign({
      ANN_ID: a.id, NAME: a.name, TAG: a.tag === a.name ? "" : (a.tag || ""), COLOR: a.color, BLURB: a.blurb,
      VENUE_IDS: (a.venues || []).join("|"), LINK: a.link || "", LINK_TEXT: a.linkText || "", ENABLED: a.enabled ? "yes" : "no"
    }, scheduleToFields(a.schedule));
  }

  function parse(text) {
    if (!window.Papa) return [];
    const res = Papa.parse(String(text || "").replace(/^\uFEFF/, ""), { header: true, skipEmptyLines: true });
    return (res.data || []).map(fromRow).filter(a => a.name);
  }
  function load(url) {
    return fetch(url || (window.ETS_CONFIG && ETS_CONFIG.ANNOUNCEMENTS_FILE) || "announcements.csv", { cache: "no-store" })
      .then(r => r.ok ? r.text() : "").then(parse).catch(() => []);
  }

  // Full-folder events (events/index.json) that have dates also count as "what's on", so the welcome screen can mention them too.
  function fromEventsIndex(index, currentSlug, color) {
    return (Array.isArray(index) ? index : []).filter(e => e && e.schedule && e.public !== false && e.slug !== currentSlug).map(e => ({
      id: "event:" + e.slug, name: e.name || e.slug, tag: e.name || e.slug, color: goodColor(color), blurb: e.note || "",
      venues: [], link: "?event=" + encodeURIComponent(e.slug), linkText: "Open this event's map", enabled: true,
      schedule: e.schedule, kind: "event"
    }));
  }

  const RANK = { now: 0, soon: 1, later: 2 };
  function withStatus(items, nowWall) {
    return items.filter(a => a.enabled && a.schedule).map(a => Object.assign({}, a, { st: EventSchedule.status(a.schedule, nowWall) }))
      .filter(a => a.st.state in RANK)
      .sort((a, b) => (RANK[a.st.state] - RANK[b.st.state]) || ((a.st.start || 0) - (b.st.start || 0)) || a.name.localeCompare(b.name));
  }
  const active = (items, nowWall) => withStatus(items, nowWall).filter(a => a.st.state !== "later");   // on now, or starting within its "coming soon" window

  window.Announcements = { COLUMNS, DEFAULT_TZ, DEFAULT_COLOR, readable, goodColor, scheduleFromRow, scheduleToFields, fromRow, toRow, parse, load, fromEventsIndex, withStatus, active };
})();
