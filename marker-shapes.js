/* marker-shapes.js: marker outlines, shared by Demo2.html (the map) and editor.html (the editor).
   Built-in shapes are listed below. Your own shapes live in shapes.csv (CODE, LABEL, POINTS), where
   POINTS is a list of corners as percentages of the marker box, like "50 0;100 50;50 100;0 50".
   categories.csv has a SHAPE column that says which shape each category uses (blank or circle = round). */
(function () {
  const POLY = {
    diamond:        { label: "Diamond",       points: [[50,0],[100,50],[50,100],[0,50]] },
    triangle:       { label: "Triangle",      points: [[50,3],[100,92],[0,92]] },
    shield:         { label: "Shield",        points: [[50,0],[100,10],[100,60],[50,100],[0,60],[0,10]] },
    flag1:          { label: "Flag",          points: [[0,0],[100,0],[75,50],[100,100],[0,100]] },
    cross:          { label: "Cross",         points: [[35,0],[65,0],[65,35],[100,35],[100,65],[65,65],[65,100],[35,100],[35,65],[0,65],[0,35],[35,35]] },
    speechbubble:   { label: "Speech",        points: [[10,10],[50,10],[90,10],[100,20],[100,60],[90,70],[60,70],[50,100],[40,70],[10,70],[0,60],[0,20],[10,10]] },
    starburst:      { label: "Starburst",     points: [[50,0],[60,25],[90,10],[75,40],[100,50],[75,60],[90,90],[60,75],[50,100],[40,75],[10,90],[25,60],[0,50],[25,40],[10,10],[40,25],[50,0]] },
    pentagon:       { label: "Pentagon",      points: [[50,0], [98,35], [79,90], [21,90], [2,35]] },
    hexagon:        { label: "Hexagon",       points: [[50,0], [93,25], [93,75], [50,100], [7,75], [7,25]] },
    octagon:        { label: "Octagon",       points: [[29,0], [71,0], [100,29], [100,71], [71,100], [29,100], [0,71], [0,29]] },
    star:           { label: "Star",          points: [[50,0], [63,38], [100,38], [69,62], [81,100], [50,77], [19,100], [31,62], [0,38], [37,38]] },
    trapezoid:      { label: "Trapezoid",     points: [[20,0], [80,0], [100,100], [0,100]] }
  };

  const slug = s => String(s || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const pointsToClip = pts => "polygon(" + pts.map(p => p[0] + "% " + p[1] + "%").join(",") + ")";

  const BUILTIN = { circle: { label: "Circle", clip: "" }, square: { label: "Square", clip: "inset(3% round 18%)" } };
  Object.keys(POLY).forEach(k => { BUILTIN[k] = { label: POLY[k].label, clip: pointsToClip(POLY[k].points) }; });

  function parsePoints(str) {
    const pts = String(str || "").split(";").map(p => p.trim().split(/\s+/).map(Number)).filter(p => p.length === 2 && p.every(isFinite));
    return pts.length >= 3 ? pts.map(p => [Math.min(100, Math.max(0, p[0])), Math.min(100, Math.max(0, p[1]))]) : null;
  }
  function parseRows(rows) {                        // shapes.csv rows -> { code: { label, points } }
    const out = {};
    (rows || []).forEach(r => {
      const code = slug(r.CODE), pts = parsePoints(r.POINTS);
      if (code && pts && !BUILTIN[code]) out[code] = { label: String(r.LABEL || code).trim(), points: pts };
    });
    return out;
  }
  function clipFor(code, custom) {
    code = slug(code);
    if (BUILTIN[code]) return BUILTIN[code].clip;
    return custom && custom[code] ? pointsToClip(custom[code].points) : "";
  }
  function list(custom) {
    const out = Object.keys(BUILTIN).map(k => ({ code: k, label: BUILTIN[k].label, clip: BUILTIN[k].clip, custom: false }));
    Object.keys(custom || {}).forEach(k => out.push({ code: k, label: custom[k].label, clip: pointsToClip(custom[k].points), custom: true }));
    return out;
  }
  function apply(btn, code, custom) {
    const clip = clipFor(code, custom);
    if (!clip || btn.querySelector(".shp")) return false;
    btn.classList.add("shaped");
    btn.style.setProperty("--clip", clip);
    const shp = document.createElement("span");
    shp.className = "shp";
    Array.from(btn.childNodes).forEach(n => shp.appendChild(n));
    btn.appendChild(shp);
    return true;
  }

  const CSS = "button.pin.shaped{border:0;background:transparent;overflow:visible;box-shadow:none;--ring:4px;filter:drop-shadow(0 0 1.5px #fff) drop-shadow(0 1px 3px rgba(0,0,0,.55))}" +
    "button.pin.shaped.parent{--ring:5px}" +
    "button.pin.shaped.sel,button.pin.shaped.nophoto{box-shadow:none;background:transparent}" +
    "button.pin.shaped.gone{filter:grayscale(1) drop-shadow(0 0 1.5px #fff) drop-shadow(0 1px 3px rgba(0,0,0,.55))}" +
    "button.pin.shaped .shp{position:absolute;inset:0;background:var(--c,#E47303);clip-path:var(--clip)}" +
    "button.pin.shaped.sel .shp{background:#ff9800}" +
    "button.pin.shaped .shp img{position:absolute;inset:var(--ring);width:calc(100% - 2 * var(--ring));height:calc(100% - 2 * var(--ring));clip-path:var(--clip);object-fit:cover}";
  if (typeof document !== "undefined" && !document.getElementById("marker-shapes-css")) {
    const st = document.createElement("style");
    st.id = "marker-shapes-css";
    st.textContent = CSS;
    (document.head || document.documentElement).appendChild(st);
  }

  window.MarkerShapes = { BUILTIN, TEMPLATES: POLY, slug, parsePoints, pointsToClip, parseRows, clipFor, list, apply };
})();
