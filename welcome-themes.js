/* welcome-themes.js: animated SVG welcome screens.
   Shared by Demo2.html (the map) and site.html (the settings editor, for the preview).
   Everything is drawn from shapes, so no image files are needed.
   To add a theme: write a decor function like ghosts() below and add an entry to THEMES. */
(function () {
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const rng = seed => { let s = seed; return () => (s = s * 16807 % 2147483647) / 2147483647; };

  // One drifting decoration. (bx, by) is its resting spot, used when motion is off.
  // o.path is the translate path, relative to the resting spot; o.spin adds a rotation.
  function drift(bx, by, shape, o, on) {
    const base = "translate(" + bx.toFixed(0) + " " + by.toFixed(0) + ")";
    if (!on) return '<g transform="' + base + '">' + shape + "</g>";
    const begin = "-" + o.delay.toFixed(1) + "s";
    const spin = o.spin ? '<animateTransform attributeName="transform" type="rotate" values="0;' + o.spin + '" dur="' + (o.dur / 2).toFixed(1) + 's" begin="' + begin + '" repeatCount="indefinite"/>' : "";
    return '<g transform="' + base + '"><g><animateTransform attributeName="transform" type="translate" values="' + o.path + '" dur="' + o.dur.toFixed(1) + 's" begin="' + begin + '" repeatCount="indefinite"/><g>' + spin + shape + "</g></g></g>";
  }

  const GHOST = '<path d="M0 40C0 8 12-18 30-18S60 8 60 40V70L50 60 40 70 30 60 20 70 10 60 0 70Z" fill="#fff" fill-opacity=".88" stroke="#2b1646" stroke-width="2"/>' +
    '<circle cx="21" cy="14" r="4.5" fill="#2b1646"/><circle cx="39" cy="14" r="4.5" fill="#2b1646"/><ellipse cx="30" cy="30" rx="5" ry="6.5" fill="#2b1646"/>';

  function ghosts(on) {
    const r = rng(11);
    let out = '<circle cx="770" cy="115" r="62" fill="#fff4c9" fill-opacity=".92" stroke="#2b1646" stroke-width="2"/><circle cx="752" cy="100" r="9" fill="#e6d79a" fill-opacity=".7" stroke="#2b1646" stroke-width="1.5"/><circle cx="788" cy="132" r="13" fill="#e6d79a" fill-opacity=".6" stroke="#2b1646" stroke-width="1.5"/>';
    for (let i = 0; i < 9; i++) {
      const bx = r() * 780 + 30, by = r() * 400 + 80, k = 0.6 + r() * 0.8, dur = 8 + r() * 6, sway = (r() - 0.5) * 90;
      out += drift(bx, by, '<g transform="scale(' + k.toFixed(2) + ')">' + GHOST + "</g>",
        { dur: dur, delay: r() * dur, path: "0 " + (700 - by).toFixed(0) + ";" + sway.toFixed(0) + " " + (-160 - by).toFixed(0) }, on);
    }
    return out;
  }

  const LEAF_COLORS = ["#c2410c", "#d97706", "#b91c1c", "#a16207", "#ea580c"];
  function leaves(on) {
    const r = rng(5);
    let out = "";
    for (let i = 0; i < 12; i++) {
      const bx = r() * 840 + 30, by = r() * 480 + 50, k = 0.7 + r() * 0.8, dur = 6 + r() * 6, wob = (r() - 0.5) * 160, drop = 80 + r() * 160;
      const shape = '<g transform="scale(' + k.toFixed(2) + ')"><path d="M0-22C16-22 26-4 0 28C-26-4-16-22 0-22Z" fill="' + LEAF_COLORS[i % 5] + '" stroke="#3b1102" stroke-width="1.5"/><path d="M0-16V28" stroke="#000" stroke-opacity=".25" stroke-width="2" fill="none"/></g>';
      const x0 = -140 - bx, x1 = 1040 - bx;
      out += drift(bx, by, shape, { dur: dur, delay: r() * dur, spin: r() < 0.5 ? 720 : -720,
        path: x0.toFixed(0) + " 0;" + ((x0 + x1) / 2).toFixed(0) + " " + wob.toFixed(0) + ";" + x1.toFixed(0) + " " + drop.toFixed(0) }, on);
    }
    return out;
  }

  function snow(on) {
    const r = rng(3);
    let out = "";
    for (let i = 0; i < 30; i++) {
      const bx = r() * 880 + 10, by = r() * 560 + 20, rad = 2 + r() * 4, dur = 5 + r() * 6, sway = (r() - 0.5) * 70;
      out += drift(bx, by, '<circle r="' + rad.toFixed(1) + '" fill="#fff" fill-opacity=".85" stroke="#0f2c4a" stroke-width="1.2"/>',
        { dur: dur, delay: r() * dur, path: "0 " + (-30 - by).toFixed(0) + ";" + sway.toFixed(0) + " " + (630 - by).toFixed(0) }, on);
    }
    return out;
  }

  const THEMES = {
    halloween: { label: "Halloween Ghosts", font: "Georgia,'Times New Roman',serif", style: "italic", bg: ["#1b1030", "#4a2275"], t1: "#f3dcff", t2: "#ff8a1f", halo: "#000", decor: ghosts },
    fall:      { label: "Fall Leaves", font: "'Palatino Linotype',Palatino,Georgia,serif", style: "normal", bg: ["#fff0d2", "#f2b97a"], t1: "#6b3410", t2: "#b3350f", halo: "#fff", decor: leaves },
    winter:    { label: "Winter Snow", font: "'Trebuchet MS',Verdana,sans-serif", style: "normal", bg: ["#0d2740", "#2a6aa3"], t1: "#d9eeff", t2: "#ffffff", halo: "#000", decor: snow }
  };

  function build(key, text, place, on) {
    const t = THEMES[key];
    if (!t) return "";

    let lines = String(text || "Welcome to|{PLACE}")
      .replace(/\{PLACE\}/g, place || "")
      .split("|")
      .map(s => s.trim())
      .filter(Boolean);

    if (!lines.length) lines = ["Welcome"];

    const big = lines[lines.length - 1];
    const small = lines.slice(0, -1);

    const bigSize = Math.max(
      34,
      Math.min(120, Math.floor(820 / Math.max(1, big.length * 0.58)))
    );

    const line = (s, y, size, fill, weight) =>
      '<text x="450" y="' + y +
      '" text-anchor="middle" font-family="' + t.font +
      '" font-style="' + t.style +
      '" font-weight="' + weight +
      '" font-size="' + size +
      '" fill="' + fill +
      '" stroke="' + t.halo +
      '" stroke-opacity=".4" stroke-width="' + Math.round(size / 12) +
      '" paint-order="stroke" stroke-linejoin="round">' +
      esc(s) + '</text>';

    const smallSvg = small
      .map((s, k) => line(s, 250 - (small.length - 1 - k) * 62, 52, t.t1, "normal"))
      .join("");

    return '<svg xmlns="http://www.w3.org/2000/svg" ' +
  'viewBox="0 0 900 600" ' +
  'preserveAspectRatio="xMidYMid slice">' +

      '<defs>' +
        '<linearGradient id="welcomeBg" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0%" stop-color="' + t.bg[0] + '"/>' +
          '<stop offset="100%" stop-color="' + t.bg[1] + '"/>' +
        '</linearGradient>' +
      '</defs>' +

      // Background rect set to fill-opacity="0" to make it transparent
      '<rect x="-1000" y="-1000" width="2900" height="2600" ' +
        'fill="url(#welcomeBg)" fill-opacity="0"/>' +

      '<g>' +
        t.decor(on) +
        smallSvg +
        line(big, small.length ? 360 : 330, bigSize, t.t2, "bold") +
      '</g>' +

      '</svg>';
  }

  window.WelcomeThemes = {
    list: Object.keys(THEMES).reduce((o, k) => { o[k] = THEMES[k].label; return o; }, {}),
    build: build,
    url: (key, text, place, on) => "data:image/svg+xml;charset=utf-8," + encodeURIComponent(build(key, text, place, on !== false))
  };
})();
