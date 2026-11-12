/* media.js: audio clips and videos attached to places, spots and stories.
   Shared by the map (Demo2a.html), the Audio & Video editor (media.html) and the data checker.

   One row of media.csv = one clip or video:
     ITEM_ID      the place, child place, spot or story it belongs to
     ORDER        1, 2, 3 ... when an item has several
     KIND         audio  or  video
     SOURCE       for audio, the file ("audio/CV-001-ab12.mp3"); for video, a YouTube link or the 11-character video code
     TITLE        what it is called ("The 1937 Cord starting up")
     TRANSCRIPT   the words, for visitors who cannot listen (shown under the player)
     CREDIT       who made it ("Narrated by Mary Smith")
     SECONDS      length of an audio clip, so the button can say how long it is (the editor fills this in)

   Rules this file keeps:
     - Nothing is shown for an item that has no audio or video attached.
     - Nothing plays by itself, and nothing is downloaded (no audio, and nothing from YouTube) until the visitor presses the button.
     - Only one thing plays at a time.                                                                                                */
(function () {
  "use strict";
  const str = v => String(v == null ? "" : v).trim();
  const key = v => str(v).toLowerCase();
  const L = (k, v) => (window.Labels ? Labels.t(k, v) : k);

  /* A YouTube address in any of its usual forms, or the bare 11-character code, becomes the code (or "" if it is not one). */
  function youtubeId(s) {
    s = str(s);
    if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
    let m = /(?:youtube\.com\/(?:watch\?(?:[^#]*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/|youtube-nocookie\.com\/embed\/)([A-Za-z0-9_-]{11})(?![A-Za-z0-9_-])/i.exec(s);
    return m ? m[1] : "";
  }
  const kindOf = r => { const k = key(r.KIND); if (k === "audio" || k === "video") return k; return youtubeId(r.SOURCE) && !/\.(mp3|m4a|aac|ogg|oga|opus|wav|weba)$/i.test(str(r.SOURCE)) ? "video" : "audio"; };

  let rows = [];
  function parse(text) {
    if (!window.Papa) return [];
    const res = Papa.parse(String(text || "").replace(/^\uFEFF/, ""), { header: true, skipEmptyLines: "greedy" });
    return (res.data || []).map(r => ({
      item: str(r.ITEM_ID), order: parseFloat(r.ORDER) || 0, kind: kindOf(r), source: str(r.SOURCE), title: str(r.TITLE),
      transcript: String(r.TRANSCRIPT == null ? "" : r.TRANSCRIPT).trim(), credit: str(r.CREDIT), seconds: parseFloat(r.SECONDS) || 0
    })).filter(x => x.item && x.source);
  }
  // fetchFn lets the map read the file the way it reads its other data (it follows an event's folder)
  function load(fetchFn) {
    return (fetchFn || ((u, o) => fetch(u, o)))("media.csv", { cache: "no-store" })
      .then(r => r.ok ? r.text() : "").then(t => { rows = parse(t); return rows; }).catch(() => { rows = []; return rows; });
  }
  const forItem = id => rows.filter(r => key(r.item) === key(id)).sort((a, b) => a.order - b.order);
  const audioPaths = () => rows.filter(r => r.kind === "audio").map(r => r.source);
  const has = id => forItem(id).length > 0;

  const clock = s => { s = Math.max(0, Math.round(s || 0)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };

  /* ---------- one player at a time ---------- */
  let playing = null;
  function stopOthers(except) { if (playing && playing !== except) { try { playing.pause(); } catch (e) {} } }

  function paragraphs(text, into) {
    String(text).split(/\n\s*\n|\r\n\s*\r\n/).map(p => p.trim()).filter(Boolean).forEach(p => { const el = document.createElement("p"); el.textContent = p; into.appendChild(el); });
  }
  function extras(row, wrap) {
    if (row.transcript) {
      const d = document.createElement("details"); d.className = "mTranscript";
      const s = document.createElement("summary"); s.textContent = L("media.transcript"); d.appendChild(s);
      paragraphs(row.transcript, d); wrap.appendChild(d);
    }
    if (row.credit) { const c = document.createElement("small"); c.className = "mCredit"; c.textContent = row.credit; wrap.appendChild(c); }
  }

  function audioItem(row, urlFor) {
    const wrap = document.createElement("div"); wrap.className = "mItem audio";
    if (row.title) { const h = document.createElement("b"); h.className = "mTitle"; h.textContent = row.title; wrap.appendChild(h); }
    const holder = document.createElement("div"); holder.className = "mHolder"; wrap.appendChild(holder);
    const btn = document.createElement("button"); btn.type = "button"; btn.className = "mGo";
    const len = row.seconds > 0 ? " \u00b7 " + clock(row.seconds) : "";
    btn.innerHTML = '<span class="mIcon" aria-hidden="true">\u25B6</span> <span class="mLabel"></span>';
    btn.querySelector(".mLabel").textContent = L("media.listen") + len;
    btn.setAttribute("aria-label", L("media.listenTitle", { title: row.title || L("media.listen") }) + (row.seconds > 0 ? ", " + clock(row.seconds) : ""));
    btn.onclick = () => {                                           // the first press is when anything is fetched
      const a = document.createElement("audio");
      a.controls = true; a.preload = "auto"; a.src = urlFor(row.source);
      a.setAttribute("aria-label", row.title || L("media.listen"));
      a.addEventListener("play", () => { stopOthers(a); playing = a; if (navigator.mediaSession && window.MediaMetadata) { try { navigator.mediaSession.metadata = new MediaMetadata({ title: row.title || L("media.listen"), artist: row.credit || "" }); } catch (e) {} } });
      a.addEventListener("error", () => { const m = document.createElement("p"); m.className = "mError"; m.setAttribute("role", "alert"); m.textContent = L("media.audioError"); holder.appendChild(m); });
      holder.replaceChildren(a);
      stopOthers(a);
      const p = a.play(); if (p && p.catch) p.catch(() => { /* the browser asked for another press: the visible controls are right there */ });
      a.focus();
    };
    holder.appendChild(btn); extras(row, wrap);
    return wrap;
  }

  function videoItem(row) {
    const wrap = document.createElement("div"); wrap.className = "mItem video";
    const id = youtubeId(row.source);
    if (row.title) { const h = document.createElement("b"); h.className = "mTitle"; h.textContent = row.title; wrap.appendChild(h); }
    const holder = document.createElement("div"); holder.className = "mHolder"; wrap.appendChild(holder);
    const btn = document.createElement("button"); btn.type = "button"; btn.className = "mGo";
    btn.innerHTML = '<span class="mIcon" aria-hidden="true">\u25B6</span> <span class="mLabel"></span>';
    btn.querySelector(".mLabel").textContent = L("media.watch");
    btn.setAttribute("aria-label", L("media.watchTitle", { title: row.title || L("media.watch") }));
    const note = document.createElement("small"); note.className = "mNote"; note.textContent = L("media.youtubeNote");
    btn.onclick = () => {
      if (!id) { holder.appendChild(Object.assign(document.createElement("p"), { className: "mError", textContent: L("media.videoError") })); return; }
      if (navigator.onLine === false) { const m = document.createElement("p"); m.className = "mError"; m.setAttribute("role", "alert"); m.textContent = L("media.videoOffline"); holder.appendChild(m); return; }
      stopOthers(null);
      const box = document.createElement("div"); box.className = "mFrame";
      const f = document.createElement("iframe");
      f.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&rel=0&playsinline=1";      // the privacy-friendly address; loaded only now
      f.title = row.title || L("media.watch");
      f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen"; f.allowFullscreen = true; f.referrerPolicy = "strict-origin-when-cross-origin";
      box.appendChild(f); holder.replaceChildren(box); f.focus();
    };
    holder.appendChild(btn); wrap.appendChild(note); extras(row, wrap);
    return wrap;
  }

  /* Fill a box with everything attached to an item. With nothing attached the box stays empty and hidden, so no button or heading shows. */
  function mount(el, itemId, urlFor) {
    if (!el) return 0;
    el.replaceChildren(); el.hidden = true;
    const list = forItem(itemId);
    if (!list.length) return 0;
    const u = urlFor || (p => p);
    list.forEach(r => el.appendChild(r.kind === "video" ? videoItem(r) : audioItem(r, u)));
    el.hidden = false;
    return list.length;
  }
  // every box a card has just drawn
  function hydrate(root, urlFor) { (root || document).querySelectorAll(".mediaBox[data-item]").forEach(el => mount(el, el.dataset.item, urlFor)); }

  window.Media = { youtubeId, kindOf, parse, load, forItem, has, audioPaths, mount, hydrate, clock, rows: () => rows };
})();
