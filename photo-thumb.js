/* photo-thumb.js: small copies of photos so the map can show its pins quickly.
   A photo at  folder/name.ext  gets a thumbnail at  folder/thumbs/name.jpg  (longest side 400 px).
   The editors call PhotoThumb.entry() whenever they stage a photo, and addButton() adds "Make missing thumbnails"
   for photos that are already on the site. Demo2.html looks for the thumbnail first and falls back to the full photo. */
(function () {
  "use strict";
  const MAX = 400, QUALITY = 0.8, IMG = /\.(jpe?g|png|webp)$/i;

  function path(p) {                       // photos/abc.png -> photos/thumbs/abc.jpg
    const m = /^(?:(.*)\/)?([^\/]+?)(?:\.[^.\/]+)?$/.exec(String(p || "").replace(/^\/+/, ""));
    return m ? (m[1] ? m[1] + "/" : "") + "thumbs/" + m[2] + ".jpg" : "";
  }

  async function make(blob) {
    const url = URL.createObjectURL(blob);
    try {
      const im = new Image(); im.src = url; await im.decode();
      const k = Math.min(1, MAX / Math.max(im.naturalWidth, im.naturalHeight));
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(im.naturalWidth * k));
      c.height = Math.max(1, Math.round(im.naturalHeight * k));
      const g = c.getContext("2d");
      g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height);
      g.imageSmoothingQuality = "high";
      g.drawImage(im, 0, 0, c.width, c.height);
      return await new Promise(ok => c.toBlob(ok, "image/jpeg", QUALITY));
    } catch (e) { return null; }
    finally { URL.revokeObjectURL(url); }
  }

  // { name, blob, dl } ready to add to the editor's staged list. dl is a unique download name so it never
  // collides with the full photo; the editor's Publish route maps it back to name (the real folder).
  async function entry(fullPath, blob) {
    if (!IMG.test(fullPath || "")) return null;
    const name = path(fullPath), t = await make(blob);
    return t ? { name, blob: t, dl: "thumb__" + name.replace(/\//g, "__") } : null;
  }

  // thumbnails for photos already in the repo that don't have one yet
  async function backfill(add, say) {
    const ev = window.Workspace && Workspace.current && Workspace.current();
    const dir = ev ? "events/" + ev + "/" : "";
    const all = await GHPublish.listFiles();
    const rel = (dir ? all.filter(p => p.startsWith(dir)) : all.filter(p => !p.startsWith("events/"))).map(p => p.slice(dir.length));
    const have = new Set(rel);
    const todo = rel.filter(p => /^(photos|spots|stories)\//.test(p) && !/\/thumbs\//.test(p) && IMG.test(p) && !have.has(path(p)));
    let made = 0;
    for (let i = 0; i < todo.length; i++) {
      say("Thumbnail " + (i + 1) + " of " + todo.length + ": " + todo[i]);
      try {
        const r = await fetch(dir + todo[i].split("/").map(encodeURIComponent).join("/"), { cache: "no-store" });
        if (!r.ok) continue;
        const e = await entry(todo[i], await r.blob());
        if (e) { add(e); made++; }
      } catch (e) { /* skip this one */ }
    }
    return made;
  }

  function addButton(anchorId, add, done) {
    const a = document.getElementById(anchorId);
    if (!a || !window.GHPublish || !GHPublish.listFiles) return;
    const b = document.createElement("button");
    b.type = "button"; b.textContent = "Make missing thumbnails";
    b.className = a.className.replace(/\bprimary\b/, "").trim();
    b.style.marginLeft = "6px";
    b.title = "Makes small copies of photos already on the site. Then click Publish to GitHub to upload them.";
    a.parentNode.appendChild(b);
    const say = t => { if (typeof toast === "function") toast(t); };
    b.onclick = async () => {
      b.disabled = true;
      try {
        const n = await backfill(add, say);
        if (done) done();
        say(n ? "Made " + n + " thumbnails. Click Publish to GitHub to upload them." : "Every photo already has a thumbnail.");
      } catch (e) { say("Could not list the photos: " + e.message); }
      finally { b.disabled = false; }
    };
  }

  window.PhotoThumb = { path, make, entry, backfill, addButton };
})();
