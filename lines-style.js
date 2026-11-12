/* lines-style.js: draws the hand-drawn lines (lines.geojson) the same way on the live page and in the Lines editor.
   Each line has: STYLE ("solid", "dashed" or "rail"), COLOR, WIDTH (pixels) and OPACITY (0 to 1).
   A "rail" is two thin solid lines with a see-through band between them, for trails, canals or roads too narrow to show as one line. */
window.ETSLines = {
  add: function (map, id) {   // id = the name of the geojson source that holds the lines
    var sc = function (k) { return ["interpolate", ["linear"], ["zoom"], 9, ["*", k, 0.5], 18, ["*", k, 1.6]]; };   // lines grow a little as you zoom in
    var W = ["to-number", ["get", "WIDTH"], 4], O = ["to-number", ["get", "OPACITY"], 1], C = ["coalesce", ["get", "COLOR"], "#D55E00"];
    var is = function (s) { return ["==", ["get", "STYLE"], s]; };
    var round = { "line-cap": "round", "line-join": "round" };
    ETSLines._base = ETSLines._base || {};
    function layer(name, filter, paint, layout) {
      ETSLines._base[id + "-" + name] = filter;
      map.addLayer({ id: id + "-" + name, type: "line", source: id, filter: filter, layout: layout || round, paint: paint });
    }
    layer("solid", ["any", is("solid"), ["!", ["has", "STYLE"]]], { "line-color": C, "line-width": sc(W), "line-opacity": O });
    layer("dashed", is("dashed"), { "line-color": C, "line-width": sc(W), "line-opacity": O, "line-dasharray": [2, 1.5] }, { "line-cap": "butt", "line-join": "round" });
    layer("band", is("rail"), { "line-color": C, "line-width": sc(W), "line-opacity": O });
    layer("railA", is("rail"), { "line-color": C, "line-width": 1.6, "line-offset": sc(["/", W, 2]) });
    layer("railB", is("rail"), { "line-color": C, "line-width": 1.6, "line-offset": sc(["/", W, -2]) });
  },
  setHidden: function (map, id, hidden) {   // hide the lines whose ID is in the list (the page shows a tour's line only while that tour is open)
    ["solid", "dashed", "band", "railA", "railB"].forEach(function (n) {
      var lid = id + "-" + n;
      if (map.getLayer(lid)) { map.setFilter(lid, ["all", ETSLines._base[lid], ["!", ["in", ["get", "ID"], ["literal", hidden]]]]); }
    });
  },
  layers: function (id) { return ["solid", "dashed", "band", "railA", "railB"].map(function (n) { return id + "-" + n; }); }
};
