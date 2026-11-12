/* ============================================================
   spot-markers.js
   One source of truth for Photo Spot and Story markers.
   Loaded by BOTH the public map page and spots.html (the editor),
   so the two can never drift apart.

   Idea: a SPOT shows (picture-style icons), a STORY tells what happened
   (story-style icons). Each kind has its own icon set, so visitors can still
   tell them apart. The colors listed per kind are suggestions; any hex works.

   spots.csv columns read here (all optional, blank = default for the kind):
     ICON        spot:  camera | photo | vista | pin
                 story: sparkle | book | bubble | alert
     ICON_COLOR  a hex color like #0072B2 (the editor offers a palette)
     EFFECT      none | twinkle | ripple | flash | bob
   ============================================================ */
(function () {
  "use strict";

  const GROUPS = {
    spot: {
      def: "camera", defColor: "#333333", defEffect: "none",
      icons: ["camera", "photo", "vista", "pin"],
      colors: ["#333333", "#0072B2", "#009E73", "#6A4C93"]
    },
    story: {
      def: "sparkle", defColor: "#D55E00", defEffect: "twinkle",
      icons: ["sparkle", "book", "bubble", "alert"],
      colors: ["#D55E00", "#E69F00", "#CC79A7", "#B3261E"]
    }
  };

  const ICON_LABELS = {
    camera: "Camera", photo: "Framed Photo", vista: "Vista (Eye)", pin: "Map Pin",
    sparkle: "Sparkle", book: "Book", bubble: "Speech Bubble", alert: "Exclamation"
  };

  const COLOR_NAMES = {
    "#333333": "Charcoal", "#0072b2": "Blue", "#009e73": "Green", "#6a4c93": "Purple",
    "#d55e00": "Orange", "#e69f00": "Amber", "#cc79a7": "Rose", "#b3261e": "Crimson"
  };

  const EFFECT_LABELS = {
    none: "None",
    twinkle: "Twinkle",
    ripple: "Ripple",
    flash: "Camera Flash",
    bob: "Float"
  };

  /* Icon artwork, 24x24. c = fill color. The camera's lens carries class "klens"
     so the flash effect can light it up. */
  const W = 'stroke="#fff" stroke-width="1.2"';
  const BODY = {
    camera: c =>
      `<rect x="8" y="3" width="8" height="4" rx="1" fill="${c}"/>` +
      `<rect x="2" y="6" width="20" height="14" rx="3" fill="${c}" ${W}/>` +
      `<circle class="klens" cx="12" cy="13" r="4" fill="#fff"/>`,
    photo: c =>
      `<rect x="2" y="4" width="20" height="16" rx="3" fill="${c}" ${W}/>` +
      `<path d="M5 17l5-6 3.5 4 2.2-2.4L19 17z" fill="#fff"/>` +
      `<circle cx="16.5" cy="9" r="1.9" fill="#fff"/>`,
    vista: c =>
      `<path d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12z" fill="${c}" ${W}/>` +
      `<circle cx="12" cy="12" r="4.2" fill="#fff"/><circle cx="12" cy="12" r="2.1" fill="${c}"/>`,
    pin: c =>
      `<path d="M12 1.5a7.5 7.5 0 0 0-7.5 7.5c0 5.3 7.5 13.5 7.5 13.5S19.5 14.3 19.5 9A7.5 7.5 0 0 0 12 1.5z" fill="${c}" ${W}/>` +
      `<circle cx="12" cy="9" r="2.8" fill="#fff"/>`,
    sparkle: c =>
      `<path d="M12 1l2.6 7.4L22 11l-7.4 2.6L12 21l-2.6-7.4L2 11l7.4-2.6z" fill="${c}" ${W}/>`,
    book: c =>
      `<path d="M2 5.5C5.2 4 8.8 4 12 6.3c3.2-2.3 6.8-2.3 10-.8v13.2c-3.2-1.5-6.8-1.5-10 .8-3.2-2.3-6.8-2.3-10-.8z" fill="${c}" ${W} stroke-linejoin="round"/>` +
      `<path d="M12 6.5v13" stroke="#fff" stroke-width="1.4"/>`,
    bubble: c =>
      `<path d="M4 3h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-8l-5 4.5V17H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" fill="${c}" ${W} stroke-linejoin="round"/>` +
      `<circle cx="7.5" cy="10" r="1.4" fill="#fff"/><circle cx="12" cy="10" r="1.4" fill="#fff"/><circle cx="16.5" cy="10" r="1.4" fill="#fff"/>`,
    alert: c =>
      `<circle cx="12" cy="12" r="10" fill="${c}" ${W}/>` +
      `<rect x="10.8" y="5.8" width="2.4" height="7.4" rx="1.2" fill="#fff"/><circle cx="12" cy="16.9" r="1.5" fill="#fff"/>`
  };

  const norm = v => String(v == null ? "" : v).trim().toLowerCase();
  const kindOf = k => (norm(k) === "story" ? "story" : "spot");
  const HEX = /^#[0-9a-f]{6}$/i;

  /* Turn a CSV row into the icon / color / effect actually drawn.
     An ICON from the wrong family (a spot asking for "book") is ignored,
     which keeps showing and telling visually distinct. */
  function resolve(row, kind) {
    const g = GROUPS[kindOf(kind)];
    const i = norm(row && row.ICON);
    const c = String((row && row.ICON_COLOR) || "").trim();
    const e = norm(row && row.EFFECT);
    return {
      icon: g.icons.includes(i) ? i : g.def,
      color: HEX.test(c) ? c : g.defColor,
      effect: EFFECT_LABELS[e] ? e : g.defEffect
    };
  }

  /* The ring is always present but invisible; the ripple and flash effects animate it. */
  function svg(icon, color) {
    const body = (BODY[icon] || BODY.camera)(color);
    return `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">` +
      `<circle class="kring" cx="12" cy="12" r="10" fill="none" stroke="${color}" stroke-width="1.6" opacity="0"/>` +
      body + `</svg>`;
  }

  function hash(s) {
    let h = 0;
    for (const ch of String(s || "")) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return h;
  }

  /* Dress a marker <button>: sets its classes, icon and a per-marker animation
     offset (so a field of markers doesn't all pulse in lockstep). */
  function fill(btn, row, kind) {
    const k = kindOf(kind), r = resolve(row, k);
    btn.className = "kmark " + k + (r.effect !== "none" ? " kfx-" + r.effect : "");
    btn.innerHTML = svg(r.icon, r.color);
    btn.style.setProperty("--kd", "-" + ((hash(row && row.SPOT_ID) % 36) / 10) + "s");
    return r;
  }

  /* On/off switch for all marker animation. Remembered per browser under its own key,
     so the editor's preview switch and the public site's visitor switch stay separate. */
  function motion(storageKey) {
    const root = document.documentElement;
    let on = true;
    try { on = localStorage.getItem(storageKey) !== "off"; } catch (e) {}
    const apply = () => root.classList.toggle("kfx-off", !on);
    apply();
    return {
      get on() { return on; },
      set(v) {
        on = !!v;
        try { localStorage.setItem(storageKey, on ? "on" : "off"); } catch (e) {}
        apply();
      }
    };
  }

  const css = `
.kmark{width:44px;height:44px;border:0;background:none;padding:0;cursor:pointer;display:flex;align-items:center;justify-content:center}
.kmark svg{overflow:visible;filter:drop-shadow(0 0 2px #fff) drop-shadow(0 0 2px #fff)}
.kmark .kring{transform-box:fill-box;transform-origin:center}
.kmark.kfx-twinkle svg{animation:ktw 2.4s ease-in-out infinite;animation-delay:var(--kd,0s)}
.kmark.kfx-bob svg{animation:kbob 1.9s ease-in-out infinite;animation-delay:var(--kd,0s)}
.kmark.kfx-ripple .kring{animation:kripple 2.4s ease-out infinite;animation-delay:var(--kd,0s)}
.kmark.kfx-flash svg{animation:kglow 3.6s ease-out infinite;animation-delay:var(--kd,0s)}
.kmark.kfx-flash .kring{stroke:#FFD43B;stroke-width:2.4;animation:kburst 3.6s ease-out infinite;animation-delay:var(--kd,0s)}
.kmark.kfx-flash .klens{animation:klens 3.6s ease-out infinite;animation-delay:var(--kd,0s)}
@keyframes ktw{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.25);opacity:.7}}
@keyframes kbob{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
@keyframes kripple{0%{transform:scale(.6);opacity:.8}100%{transform:scale(2.2);opacity:0}}
@keyframes kglow{0%,14%,100%{filter:drop-shadow(0 0 2px #fff) drop-shadow(0 0 2px #fff)}5%{filter:drop-shadow(0 0 3px #fff) drop-shadow(0 0 10px #FFD43B) drop-shadow(0 0 16px #fff)}}
@keyframes kburst{0%{transform:scale(.5);opacity:0}4%{opacity:1}14%{transform:scale(2.3);opacity:0}100%{transform:scale(2.3);opacity:0}}
@keyframes klens{0%,14%,100%{fill:#fff}4%{fill:#FFE066}}
@media(prefers-reduced-motion:reduce){.kmark svg,.kmark .kring,.kmark .klens{animation:none!important}}
html.kfx-off .kmark svg,html.kfx-off .kmark .kring,html.kfx-off .kmark .klens{animation:none!important}
`;
  const style = document.createElement("style");
  style.id = "spot-markers-css";
  style.textContent = css;
  document.head.appendChild(style);

  window.SpotMarkers = {
    GROUPS, ICON_LABELS, COLOR_NAMES, EFFECT_LABELS,
    resolve, svg, fill, motion
  };
})();
