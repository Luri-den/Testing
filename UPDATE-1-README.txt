UPDATE 1: one file list, plus "What's on" announcements
=======================================================

HOW TO INSTALL
Upload every file in this zip to your ETS repo, in the same place as the existing files
(the repo's top folder), replacing the old ones. Nothing is deleted. Demo2.html and
index.html are not touched.

These files were made from the zip you uploaded (ETS-main_5_.zip). If you changed any of
them since, tell me before uploading so I can merge instead of overwrite.

NEW FILES
  announcements.csv   Sample data: "Mary's Quilt Show" (on now) and "Fried Chicken Tour"
                      (coming soon). The text and dates are placeholders. Replace them.
  announcements.js    The shared code that reads announcements.csv.
  announce.html       The editor. It appears in the hub under Visitors > Announcements.

CHANGED FILES
  ets-config.js       Now holds the ONE list of data files (DATA) and the shared ones (GLOBAL).
  workspace.js, publish.js, events.html, check.html
                      Read that list instead of each keeping their own copy.
                      This fixes a real gap: prizes.csv and lines.geojson were missing from
                      the lists, so saving or publishing an event left them behind.
                      Events you saved BEFORE this update do not contain those two files
                      until you re-save them.
  Demo2a.html         Welcome screen shows what's on; Events panel has a "What's on" section;
                      the Events button says "Happening Now" when an announcement is on;
                      offline "save this map" now also saves lines.geojson and border.geojson.
  tabs.html           Adds the Announcements tab.
  sw.js               Caches the two new code files.

HOW IT WORKS FOR VISITORS
  An announcement shows while it is on, and for N days before it starts (default 14).
  The welcome screen alternates: what's on, a place, what's on, a place...
  Each one has a colored tag. A place that hosts an announcement wears its tag too.
  "See it on the map" goes to the first place you ticked. With no place, the button opens
  the web page you gave it. Full events (the folders) that have dates show up here as well.
  Announcements are shared by the whole site. They do not live inside event folders.
  A QR visitor's own place still comes first.

HOW YOU USE IT
  Hub > Visitors > Announcements > "+ New announcement". Fill in the name, tag, color, a
  sentence, tick the places, set the dates. The preview shows what visitors will see.
  Download Updated announcements.csv (or Publish), then upload it next to the map page.

WHAT I TESTED, AND WHAT I COULD NOT
  Tested in a headless browser: the editor (edit, add, validate, download), the date logic
  (once, yearly, weekly, monthly), the welcome-screen slide logic including QR visitors and
  the no-announcement case, and the Events panel section.
  Not tested: the whole Demo2a page loading end to end. The map libraries load from the
  internet and my test machine has none. After uploading, open the live page, then
  open it with ?skipWelcome removed to see the intro, and tell me what you see.
