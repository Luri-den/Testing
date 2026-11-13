/* ets-config.js: the ONE place that names the live page, the boundary file, and the data files.
   Change LIVE_PAGE if the live page is ever renamed; the hub, event previews, QR tool, checker and publisher all follow it.
   Add a new data file to DATA (once, here) and the event saver, the publisher, the event editors and the checker all pick it up. */
window.ETS_CONFIG = {
  LIVE_PAGE: "Demo2a.html",
  BOUNDARY_FILE: "border.geojson",

  // Content files: copied into an event folder when you save an event, and read from it while you design one.
  DATA: [
    "site.csv", "locations.csv", "childmarkers.csv", "categories.csv",
    "spots.csv", "tours.csv", "tourstops.csv", "lines.geojson",
    "stamps.csv", "tasks.csv", "prizes.csv",
    "photos.csv", "shapes.csv", "media.csv",
    "overlays.json", "border.geojson", "backdrop.json"
  ],

  // Shared by every event and the live map; never copied into an event folder.
  GLOBAL: ["announcements.csv", "labels.csv"],

  ANNOUNCEMENTS_FILE: "announcements.csv",
  LABELS_FILE: "labels.csv"
};
