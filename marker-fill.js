/* marker-fill.js: a color or pattern fill for markers, used instead of an icon when a place has no photo.
   Shared by Demo2.html (the map), editor.html and passport.html (the two category editors) and check.html.
   A category's fill is three columns in categories.csv: FILL (a pattern name), FILL_COLOR and FILL_COLOR2.
   The outline color (COLOR) is separate, so the two never have to match. */
(function () {
  const PATTERNS = [
    { code: "solid", label: "Solid" }, { code: "stripes", label: "Stripes" }, { code: "lines", label: "Lines" },
    { code: "diagonal", label: "Diagonal" }, { code: "checks", label: "Checks" }, { code: "dots", label: "Dots" },
    { code: "grid", label: "Grid" }, { code: "waves", label: "Waves" }, { code: "zigzag", label: "Zigzag" }, { code: "crosses", label: "Crosses" }
  ];
  const hexOk = c => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(c || "").trim());
  const cleanPattern = p => { p = String(p || "").trim().toLowerCase(); return PATTERNS.some(x => x.code === p) ? p : ""; };

  function rgb(h) { h = String(h).replace("#", ""); if (h.length === 3) h = h.replace(/./g, "$&$&"); const n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  const toHex = a => "#" + a.map(x => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, "0")).join("");
  const lighten = (h, t) => toHex(rgb(h).map(x => x + (255 - x) * t));
  const defaults = outline => { const c = hexOk(outline) ? outline : "#E47303"; return { fillColor: lighten(c, 0.78), fillColor2: c }; };

  // the picture for a fill, as SVG text (it stretches to fill whatever it is placed in)
  function svg(pattern, c1, c2) {
    pattern = cleanPattern(pattern) || "solid";
    c1 = hexOk(c1) ? String(c1).trim() : "#f3e9d2"; c2 = hexOk(c2) ? String(c2).trim() : "#8a6d3b";
    const t = 25, h = t / 2;
    const body = {
      stripes: '<rect width="' + h + '" height="' + t + '" fill="' + c2 + '"/>',
      diagonal: '<rect width="' + h + '" height="' + t + '" fill="' + c2 + '"/>',
      lines: '<rect width="' + t + '" height="' + h + '" fill="' + c2 + '"/>',
      checks: '<rect width="' + h + '" height="' + h + '" fill="' + c2 + '"/><rect x="' + h + '" y="' + h + '" width="' + h + '" height="' + h + '" fill="' + c2 + '"/>',
      dots: '<circle cx="' + h + '" cy="' + h + '" r="' + (t * 0.22) + '" fill="' + c2 + '"/>',
      grid: '<rect width="' + t + '" height="3" fill="' + c2 + '"/><rect width="3" height="' + t + '" fill="' + c2 + '"/>',
      waves: '<path d="M0 ' + h + ' Q' + (t / 4) + ' ' + (t * 0.1) + ' ' + h + ' ' + h + ' T' + t + ' ' + h + '" fill="none" stroke="' + c2 + '" stroke-width="3"/>',
      zigzag: '<path d="M0 ' + (t * 0.7) + ' L' + (t / 4) + ' ' + (t * 0.3) + ' L' + h + ' ' + (t * 0.7) + ' L' + (t * 0.75) + ' ' + (t * 0.3) + ' L' + t + ' ' + (t * 0.7) + '" fill="none" stroke="' + c2 + '" stroke-width="3"/>',
      crosses: '<rect x="' + (h - 1.5) + '" y="' + (h - 6) + '" width="3" height="12" fill="' + c2 + '"/><rect x="' + (h - 6) + '" y="' + (h - 1.5) + '" width="12" height="3" fill="' + c2 + '"/>'
    }[pattern];
    const def = body ? '<defs><pattern id="p" width="' + t + '" height="' + t + '" patternUnits="userSpaceOnUse"' + (pattern === "diagonal" ? ' patternTransform="rotate(45)"' : "") + ">" + body + "</pattern></defs>" : "";
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">' + def + '<rect width="100" height="100" fill="' + c1 + '"/>' + (body ? '<rect width="100" height="100" fill="url(#p)"/>' : "") + "</svg>";
  }
  const url = (pattern, c1, c2) => "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg(pattern, c1, c2));

  // categories.csv row -> { fill, fillColor, fillColor2 }, or null when the category has no fill
  function fromRow(r, outline) {
    const p = cleanPattern(r && r.FILL);
    if (!p) return null;
    const d = defaults(outline);
    return { fill: p, fillColor: hexOk(r.FILL_COLOR) ? String(r.FILL_COLOR).trim() : d.fillColor, fillColor2: hexOk(r.FILL_COLOR2) ? String(r.FILL_COLOR2).trim() : d.fillColor2 };
  }
  function normalize(c) {                              // fills in missing colors on an editor's category object
    if (!c || !cleanPattern(c.fill)) { if (c) { c.fill = ""; } return c; }
    const d = defaults(c.color);
    if (!hexOk(c.fillColor)) c.fillColor = d.fillColor;
    if (!hexOk(c.fillColor2)) c.fillColor2 = d.fillColor2;
    return c;
  }

  /* ---------- the picker in the editors ---------- */
  const bg = (p, a, b) => "background:url('" + url(p, a, b) + "') center/cover";
  function tileHtml(c) {
    const on = !!c.fill, d = defaults(c.color);
    return '<button type="button" class="ic fill-tile' + (on ? " on" : "") + '" data-fill="1" title="Color or pattern fill, instead of an icon">' +
      '<span class="fill-tile-sw" style="display:block;width:100%;aspect-ratio:1;border-radius:6px;' + (on ? bg(c.fill, c.fillColor, c.fillColor2) : bg("diagonal", d.fillColor, d.fillColor2)) + '"></span></button>';
  }
  function panelHtml(c) {
    const d = defaults(c.color), c1 = c.fillColor || d.fillColor, c2 = c.fillColor2 || d.fillColor2;
    return '<div class="fillbox" style="margin-top:8px;padding:8px;border:1px solid #d9dde2;border-radius:8px;background:#fafbfc"' + (c.fill ? "" : " hidden") + ">" +
      '<div style="font-size:12px;color:#555;margin-bottom:6px"><b>Color or pattern.</b> Shown on the marker when a place has no photo. It does not have to match the outline color.</div>' +
      '<div class="fill-pats" style="display:flex;flex-wrap:wrap;gap:6px">' +
      PATTERNS.map(p => '<button type="button" class="fp" data-pat="' + p.code + '" title="' + p.label + '" style="width:44px;height:44px;padding:0;border-radius:8px;cursor:pointer;border:2px solid #d9dde2;' + bg(p.code, c1, c2) + '"></button>').join("") + "</div>" +
      '<div style="display:flex;gap:14px;flex-wrap:wrap;align-items:center;margin-top:8px">' +
      '<label style="font-size:12px;display:flex;gap:6px;align-items:center">Fill color <input type="color" class="fc1" value="' + c1 + '"></label>' +
      '<label style="font-size:12px;display:flex;gap:6px;align-items:center">Pattern color <input type="color" class="fc2" value="' + c2 + '"></label>' +
      '<span class="fprev" title="Preview with the outline" style="display:inline-block;width:52px;height:52px;border-radius:50%;box-sizing:border-box;border:4px solid ' + (c.color || "#888") + ";" + bg(c.fill || "solid", c1, c2) + '"></span></div>' +
      '<div style="font-size:12px;color:#777;margin-top:6px">To go back to an icon, pick one in the list above.</div></div>';
  }
  function wire(box, c, onChange) {
    const tile = box.querySelector(".fill-tile"), panel = box.querySelector(".fillbox");
    if (!tile || !panel) return;
    const q = s => panel.querySelector(s);
    const refresh = () => {
      const d = defaults(c.color), c1 = c.fillColor || d.fillColor, c2 = c.fillColor2 || d.fillColor2;
      panel.hidden = !c.fill;
      const nm = box.querySelector("#c-iconname");
      if (nm && c.fill) nm.textContent = "Color or pattern fill";
      tile.classList.toggle("on", !!c.fill);
      tile.querySelector(".fill-tile-sw").setAttribute("style", "display:block;width:100%;aspect-ratio:1;border-radius:6px;" + (c.fill ? bg(c.fill, c1, c2) : bg("diagonal", d.fillColor, d.fillColor2)));
      panel.querySelectorAll(".fp").forEach(b => {
        b.setAttribute("style", "width:44px;height:44px;padding:0;border-radius:8px;cursor:pointer;border:2px solid " + (b.dataset.pat === c.fill ? "#E47303" : "#d9dde2") + ";" + bg(b.dataset.pat, c1, c2));
      });
      q(".fprev").setAttribute("style", "display:inline-block;width:52px;height:52px;border-radius:50%;box-sizing:border-box;border:4px solid " + (c.color || "#888") + ";" + bg(c.fill || "solid", c1, c2));
      if (q(".fc1").value !== c1) q(".fc1").value = c1;
      if (q(".fc2").value !== c2) q(".fc2").value = c2;
    };
    tile.onclick = () => {
      if (!c.fill) { c.fill = "solid"; normalize(c); box.querySelectorAll(".ic[data-icon]").forEach(b => b.classList.remove("on")); }
      refresh(); onChange();
    };
    panel.querySelectorAll(".fp").forEach(b => { b.onclick = () => { c.fill = b.dataset.pat; normalize(c); refresh(); onChange(); }; });
    q(".fc1").oninput = e => { c.fillColor = e.target.value; refresh(); onChange(); };
    q(".fc2").oninput = e => { c.fillColor2 = e.target.value; refresh(); onChange(); };
    box.querySelectorAll(".ic[data-icon]").forEach(b => b.addEventListener("click", () => { c.fill = ""; refresh(); }));   // choosing an icon switches the fill off
    refresh();
  }

  if (typeof document !== "undefined" && !document.getElementById("marker-fill-css")) {
    const st = document.createElement("style");
    st.id = "marker-fill-css";
    st.textContent = "img.is-default.is-fill{object-fit:cover !important;padding:0 !important;background:none !important}";
    (document.head || document.documentElement).appendChild(st);
  }
  window.MarkerFill = { PATTERNS, hexOk, cleanPattern, defaults, svg, url, fromRow, normalize, tileHtml, panelHtml, wire };
})();
