/* schedule.js: when an event is on. Shared by Demo2.html (the map), events.html and check.html.
   A schedule looks like:
     { repeat: "once",    tz, start: "2026-11-14T17:00", end: "2026-11-16T18:00", soonDays: 14 }
     { repeat: "yearly",  tz, start: "2000-11-14T09:00", end: "2000-11-16T18:00" }   (only month, day and time count)
     { repeat: "monthly", tz, startDay: 1, startTime: "09:00", endDay: 3, endTime: "17:00" }
     { repeat: "weekly",  tz, days: [6], startTime: "09:00", endTime: "17:00" }       (0 = Sunday)
   Times are the clock on the wall in the schedule's time zone, so daylight saving never shifts them. */
(function () {
  const ZONES = ["America/New_York", "America/Indiana/Indianapolis", "America/Chicago", "America/Denver", "America/Phoenix", "America/Los_Angeles", "America/Anchorage", "Pacific/Honolulu"];
  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const DAY_MS = 864e5;

  function wallNow(tz, date) {                       // the current wall-clock time in that zone, as a UTC timestamp
    const d = date || new Date();
    try {
      const parts = {};
      new Intl.DateTimeFormat("en-US", { timeZone: tz || undefined, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
        .formatToParts(d).forEach(p => { parts[p.type] = p.value; });
      return Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour % 24, +parts.minute);
    } catch (e) { return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes()); }
  }
  const parseLocal = s => { const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(String(s || "")); return m ? Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) : null; };
  const parseTime = s => { const m = /^(\d{1,2}):(\d{2})/.exec(String(s || "")); return m ? [+m[1], +m[2]] : null; };
  const minutes = t => t[0] * 60 + t[1];
  const dim = (y, m0) => new Date(Date.UTC(y, m0 + 1, 0)).getUTCDate();
  function atDay(y, m0, d, hh, mm) {                  // month and day numbers that overflow are clamped (the 31st in a 30-day month becomes the 30th)
    y += Math.floor(m0 / 12); m0 = ((m0 % 12) + 12) % 12;
    return Date.UTC(y, m0, Math.min(d, dim(y, m0)), hh, mm);
  }

  function occurrences(s, now) {                      // the runs of this event around "now": last time, this time, next time
    const out = [], n = new Date(now), Y = n.getUTCFullYear(), M = n.getUTCMonth();
    if (s.repeat === "once") {
      const a = parseLocal(s.start), b = parseLocal(s.end);
      if (a != null && b != null) out.push({ start: a, end: b });
    } else if (s.repeat === "yearly") {
      const a = parseLocal(s.start), b = parseLocal(s.end);
      if (a == null || b == null) return out;
      const A = new Date(a), B = new Date(b);
      const key = d => Date.UTC(2001, d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes());
      const wraps = key(B) < key(A);                  // for example Dec 20 to Jan 5
      for (let y = Y - 1; y <= Y + 1; y++) out.push({
        start: atDay(y, A.getUTCMonth(), A.getUTCDate(), A.getUTCHours(), A.getUTCMinutes()),
        end: atDay(y + (wraps ? 1 : 0), B.getUTCMonth(), B.getUTCDate(), B.getUTCHours(), B.getUTCMinutes())
      });
    } else if (s.repeat === "monthly") {
      const st = parseTime(s.startTime) || [0, 0], en = parseTime(s.endTime) || [23, 59], d1 = +s.startDay, d2 = +s.endDay;
      if (!(d1 >= 1 && d2 >= 1)) return out;
      const wraps = d2 < d1 || (d2 === d1 && minutes(en) <= minutes(st));
      for (let k = -1; k <= 1; k++) out.push({ start: atDay(Y, M + k, d1, st[0], st[1]), end: atDay(Y, M + k + (wraps ? 1 : 0), d2, en[0], en[1]) });
    } else if (s.repeat === "weekly") {
      const st = parseTime(s.startTime) || [0, 0], en = parseTime(s.endTime) || [23, 59];
      const days = Array.isArray(s.days) ? s.days.map(Number) : [];
      const today = Date.UTC(Y, M, n.getUTCDate()), overnight = minutes(en) <= minutes(st);
      for (let k = -8; k <= 8; k++) {
        const d = today + k * DAY_MS;
        if (days.includes(new Date(d).getUTCDay())) out.push({ start: d + minutes(st) * 6e4, end: d + (overnight ? DAY_MS : 0) + minutes(en) * 6e4 });
      }
    }
    return out.filter(o => o.end > o.start).sort((a, b) => a.start - b.start);
  }

  // every run of this event that overlaps [from, to) (wall-clock timestamps): what a calendar needs to draw a month or a list
  function range(s, from, to) {
    const out = [];
    if (!s || !s.repeat || !(to > from)) return out;
    const Y1 = new Date(from).getUTCFullYear(), Y2 = new Date(to).getUTCFullYear();
    if (s.repeat === "once") {
      const a = parseLocal(s.start), b = parseLocal(s.end);
      if (a != null && b != null) out.push({ start: a, end: b });
    } else if (s.repeat === "yearly") {
      const a = parseLocal(s.start), b = parseLocal(s.end);
      if (a == null || b == null) return out;
      const A = new Date(a), B = new Date(b);
      const key = d => Date.UTC(2001, d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes());
      const wraps = key(B) < key(A);
      for (let y = Y1 - 1; y <= Y2 + 1; y++) out.push({
        start: atDay(y, A.getUTCMonth(), A.getUTCDate(), A.getUTCHours(), A.getUTCMinutes()),
        end: atDay(y + (wraps ? 1 : 0), B.getUTCMonth(), B.getUTCDate(), B.getUTCHours(), B.getUTCMinutes())
      });
    } else if (s.repeat === "monthly") {
      const st = parseTime(s.startTime) || [0, 0], en = parseTime(s.endTime) || [23, 59], d1 = +s.startDay, d2 = +s.endDay;
      if (!(d1 >= 1 && d2 >= 1)) return out;
      const wraps = d2 < d1 || (d2 === d1 && minutes(en) <= minutes(st));
      const m0 = new Date(from).getUTCFullYear() * 12 + new Date(from).getUTCMonth(), m1 = Y2 * 12 + new Date(to).getUTCMonth();
      for (let k = m0 - 1; k <= m1 + 1; k++) out.push({ start: atDay(0, k, d1, st[0], st[1]), end: atDay(0, k + (wraps ? 1 : 0), d2, en[0], en[1]) });
    } else if (s.repeat === "weekly") {
      const st = parseTime(s.startTime) || [0, 0], en = parseTime(s.endTime) || [23, 59];
      const days = Array.isArray(s.days) ? s.days.map(Number) : [];
      const overnight = minutes(en) <= minutes(st);
      const first = Math.floor(from / DAY_MS) * DAY_MS - DAY_MS;
      for (let d = first; d < to && out.length < 4000; d += DAY_MS)
        if (days.includes(new Date(d).getUTCDay())) out.push({ start: d + minutes(st) * 6e4, end: d + (overnight ? DAY_MS : 0) + minutes(en) * 6e4 });
    }
    return out.filter(o => o.end > o.start && o.end > from && o.start < to).sort((a, b) => a.start - b.start);
  }

  // state is "now", "soon" (starts within soonDays), "later", "ended" (a one-time event that is over) or "none"
  function status(s, nowWall) {
    if (!s || !s.repeat) return { state: "none" };
    const now = nowWall != null ? nowWall : wallNow(s.tz);
    const occ = occurrences(s, now);
    const cur = occ.find(o => o.start <= now && now < o.end);
    if (cur) return { state: "now", start: cur.start, end: cur.end };
    const next = occ.find(o => o.start > now);
    if (!next) return { state: "ended", end: occ.length ? occ[occ.length - 1].end : null };
    const soonMs = (s.repeat === "weekly" ? 0 : (s.soonDays == null ? 14 : +s.soonDays)) * DAY_MS;
    return { state: next.start - now <= soonMs ? "soon" : "later", start: next.start, end: next.end };
  }

  const fmtDay = ms => new Date(ms).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
  const fmtTime = ms => new Date(ms).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "UTC" }).replace(":00", "");
  const fmtClock = t => { const p = parseTime(t); return p ? fmtTime(Date.UTC(2000, 0, 1, p[0], p[1])) : ""; };
  const ordinal = n => n + (["th", "st", "nd", "rd"][(n % 100 > 10 && n % 100 < 14) ? 0 : Math.min(n % 10, 4) % 4] || "th");

  // the wording can be changed in the Wording tab (labels.js); these are the standard phrases
  const phrase = (key, std, vars) => window.Labels ? Labels.t(key, vars) : std.replace(/\{(\w+)\}/g, (m, k) => vars[k] != null ? vars[k] : m);
  function statusText(st) {
    if (st.state === "now") return phrase("status.now", "Happening now, until {end}", { end: fmtDay(st.end) + " at " + fmtTime(st.end) });
    if (st.state === "soon") return phrase("status.soon", "Coming soon: {start}", { start: fmtDay(st.start) + " at " + fmtTime(st.start) });
    if (st.state === "later") return phrase("status.later", "Next: {start}", { start: fmtDay(st.start) + " at " + fmtTime(st.start) });
    if (st.state === "ended") return st.end ? phrase("status.ended", "Ended {end}", { end: fmtDay(st.end) }) : phrase("status.ended", "Ended {end}", { end: "" }).replace(/\s+$/, "");
    return "";
  }
  function describe(s) {
    if (!s || !s.repeat) return "No dates set";
    if (s.repeat === "once") { const a = parseLocal(s.start), b = parseLocal(s.end); return a != null && b != null ? fmtDay(a) + " " + fmtTime(a) + " to " + fmtDay(b) + " " + fmtTime(b) : "One time"; }
    if (s.repeat === "yearly") {
      const a = parseLocal(s.start), b = parseLocal(s.end);
      if (a == null || b == null) return "Every year";
      const A = new Date(a), B = new Date(b), md = d => MONTHS[d.getUTCMonth()] + " " + d.getUTCDate();
      return "Every year, " + md(A) + " " + fmtTime(a) + " to " + md(B) + " " + fmtTime(b);
    }
    if (s.repeat === "monthly") return "Every month, the " + ordinal(+s.startDay) + " " + fmtClock(s.startTime) + " to the " + ordinal(+s.endDay) + " " + fmtClock(s.endTime);
    if (s.repeat === "weekly") {
      const names = (s.days || []).map(Number).sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)).map(d => DAYS[d]);   // Monday first
      const list = names.length > 1 ? names.slice(0, -1).join(", ") + " and " + names[names.length - 1] : names[0] || "";
      return "Every " + list + ", " + fmtClock(s.startTime) + " to " + fmtClock(s.endTime);
    }
    return "";
  }
  function validate(s) {
    const p = [];
    if (!s || !["once", "yearly", "monthly", "weekly"].includes(s.repeat)) return ["Choose how often it happens."];
    try { new Intl.DateTimeFormat("en-US", { timeZone: s.tz }); } catch (e) { p.push("The time zone is not recognised."); }
    if (s.repeat === "once" || s.repeat === "yearly") {
      const a = parseLocal(s.start), b = parseLocal(s.end);
      if (a == null || b == null) p.push("Set both a start and an end.");
      else if (s.repeat === "once" && b <= a) p.push("It has to end after it starts.");
      else if (s.repeat === "yearly" && a === b) p.push("It has to end after it starts.");
    } else {
      if (!parseTime(s.startTime) || !parseTime(s.endTime)) p.push("Set a start time and an end time.");
      if (s.repeat === "monthly") { for (const d of [s.startDay, s.endDay]) if (!(+d >= 1 && +d <= 31)) { p.push("Days must be between 1 and 31."); break; } }
      if (s.repeat === "weekly" && !(Array.isArray(s.days) && s.days.length)) p.push("Pick at least one day of the week.");
    }
    return p;
  }
  window.EventSchedule = { ZONES, DAYS, MONTHS, wallNow, parseLocal, status, statusText, describe, validate, range };
})();
