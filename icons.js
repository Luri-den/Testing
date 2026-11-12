/* icons.js — shared by the map page and the editor.
   To add an icon: copy one entry, give it a new key, a label, and your own artwork.
   "vb" is the SVG viewBox. Artwork below is drawn on a 60 x 60 canvas
   (the older vehicle icons are wider than tall, so they use a cropped viewBox to fill the circle).

   Optional tour settings (only used when the icon travels on a tour or sits on a passport stamp):
     scene: "rail" | "water" | "road"   moving scenery behind it (leave out for none)
     puff:  true                         little smoke puff beside it (steam engines) */

const ICONS = {

  generic: { label: "Plain building", vb: "8 0 44 30", art: `
    <path d="M12 28V12L30 3l18 9v16z" fill="#8a6f4d"/>
    <rect x="18" y="14" width="6" height="8" fill="#f5e6c8"/>
    <rect x="36" y="14" width="6" height="8" fill="#f5e6c8"/>
    <rect x="26" y="18" width="8" height="10" fill="#4a3a28"/>
    <rect x="12" y="26" width="36" height="3" fill="#E47303"/>` },

  house: { label: "Victorian house", vb: "0 0 60 60", art: `
    <rect x="12" y="28" width="30" height="24" fill="#c9a66b"/>
    <path d="M8 30L27 10l19 20z" fill="#7a3b2e"/>
    <rect x="38" y="20" width="12" height="32" fill="#b8905a"/>
    <path d="M36 22L44 6l8 16z" fill="#7a3b2e"/>
    <circle cx="27" cy="22" r="3" fill="#f5e6c8"/>
    <rect x="17" y="34" width="6" height="9" fill="#f5e6c8"/>
    <rect x="31" y="34" width="6" height="9" fill="#f5e6c8"/>
    <rect x="41" y="28" width="6" height="8" fill="#f5e6c8"/>
    <rect x="24" y="42" width="8" height="10" fill="#4a3a28"/>
    <rect x="8" y="52" width="44" height="3" fill="#6b5a45"/>` },

  store: { label: "Storefront", vb: "0 0 60 60", art: `
    <rect x="8" y="14" width="44" height="38" fill="#a8492e"/>
    <rect x="6" y="9" width="48" height="6" fill="#5a3a1a"/>
    <rect x="14" y="18" width="32" height="7" fill="#f5e6c8"/>
    <path d="M8 28H52V34H8z" fill="#E47303"/>
    <path d="M8 28H16V34H8zM24 28H32V34H24zM40 28H48V34H40z" fill="#fff"/>
    <rect x="12" y="36" width="16" height="14" fill="#cfe6ee"/>
    <rect x="34" y="36" width="10" height="16" fill="#4a3a28"/>
    <rect x="6" y="52" width="48" height="3" fill="#6b5a45"/>` },

  church: { label: "Church with steeple", vb: "0 0 60 60", art: `
    <rect x="14" y="32" width="32" height="20" fill="#e8e2d2"/>
    <path d="M11 33L30 23l19 10z" fill="#6b4a3a"/>
    <rect x="25" y="20" width="10" height="13" fill="#e8e2d2"/>
    <path d="M23 21L30 8l7 13z" fill="#6b4a3a"/>
    <rect x="29.3" y="1" width="1.4" height="8" fill="#3a3a3a"/>
    <rect x="27.5" y="3.2" width="5" height="1.4" fill="#3a3a3a"/>
    <rect x="28" y="24" width="4" height="7" rx="2" fill="#4a3a28"/>
    <rect x="18" y="38" width="4" height="8" rx="2" fill="#7fa7c9"/>
    <rect x="38" y="38" width="4" height="8" rx="2" fill="#7fa7c9"/>
    <path d="M26 52V44a4 4 0 0 1 8 0V52z" fill="#4a3a28"/>
    <rect x="10" y="52" width="40" height="3" fill="#6b5a45"/>` },

  school: { label: "Schoolhouse", vb: "0 0 60 60", art: `
    <rect x="10" y="28" width="40" height="24" fill="#b5483a"/>
    <path d="M7 29L30 16l23 13z" fill="#4a4a4a"/>
    <rect x="26" y="9" width="8" height="9" fill="#e8e2d2"/>
    <path d="M25 10L30 3l5 7z" fill="#4a4a4a"/>
    <circle cx="30" cy="14" r="2" fill="#E47303"/>
    <rect x="14" y="34" width="6" height="8" fill="#f5e6c8"/>
    <rect x="40" y="34" width="6" height="8" fill="#f5e6c8"/>
    <rect x="26" y="40" width="8" height="12" fill="#4a3a28"/>
    <rect x="8" y="52" width="44" height="3" fill="#6b5a45"/>` },

  courthouse: { label: "Courthouse / civic", vb: "0 0 60 60", art: `
    <rect x="26" y="8" width="8" height="9" fill="#c9c3b4"/>
    <path d="M25 9L30 3l5 6z" fill="#8a8578"/>
    <path d="M8 27L30 14l22 13z" fill="#d8d2c2"/>
    <circle cx="30" cy="22" r="2.4" fill="#8a8578"/>
    <rect x="8" y="27" width="44" height="4" fill="#bdb7a6"/>
    <rect x="12" y="31" width="4" height="17" fill="#e8e2d2"/>
    <rect x="21" y="31" width="4" height="17" fill="#e8e2d2"/>
    <rect x="30" y="31" width="4" height="17" fill="#e8e2d2"/>
    <rect x="39" y="31" width="4" height="17" fill="#e8e2d2"/>
    <rect x="47" y="31" width="4" height="17" fill="#e8e2d2"/>
    <rect x="8" y="48" width="44" height="3" fill="#bdb7a6"/>
    <rect x="6" y="51" width="48" height="4" fill="#a39d8c"/>` },

  hotel: { label: "Hotel / inn", vb: "0 0 60 60", art: `
    <rect x="8" y="14" width="44" height="38" fill="#c9a66b"/>
    <rect x="6" y="9" width="48" height="6" fill="#5a3a1a"/>
    <rect x="14" y="19" width="6" height="8" fill="#f5e6c8"/>
    <rect x="27" y="19" width="6" height="8" fill="#f5e6c8"/>
    <rect x="40" y="19" width="6" height="8" fill="#f5e6c8"/>
    <rect x="14" y="32" width="6" height="8" fill="#f5e6c8"/>
    <rect x="40" y="32" width="6" height="8" fill="#f5e6c8"/>
    <rect x="22" y="30" width="16" height="2" fill="#3a3a3a"/>
    <rect x="27" y="32" width="6" height="10" fill="#4a3a28"/>
    <rect x="25" y="42" width="10" height="10" fill="#4a3a28"/>
    <rect x="6" y="52" width="48" height="3" fill="#6b5a45"/>` },

  depot: { label: "Train depot", vb: "0 0 60 60", art: `
    <path d="M3 25L30 14l27 11z" fill="#5a3a1a"/>
    <rect x="10" y="25" width="40" height="21" fill="#a8492e"/>
    <circle cx="30" cy="31" r="5" fill="#f5e6c8" stroke="#3a3a3a" stroke-width="1.5"/>
    <path d="M30 31v-3M30 31h3" stroke="#3a3a3a" stroke-width="1.3" fill="none"/>
    <rect x="14" y="37" width="7" height="9" fill="#f5e6c8"/>
    <rect x="39" y="37" width="7" height="9" fill="#f5e6c8"/>
    <rect x="2" y="46" width="56" height="4" fill="#8a8578"/>
    <rect x="0" y="52" width="60" height="2.5" fill="#444"/>
    <path d="M6 51v5M18 51v5M30 51v5M42 51v5M54 51v5" stroke="#6b5a45" stroke-width="2.5"/>` },

  mill: { label: "Mill with water wheel", vb: "0 0 60 60", art: `
    <rect x="0" y="50" width="60" height="9" fill="#3a6ea8"/>
    <rect x="22" y="22" width="30" height="28" fill="#8a6f4d"/>
    <path d="M18 24L37 8l19 16z" fill="#5a3a1a"/>
    <rect x="31" y="32" width="8" height="12" fill="#4a3a28"/>
    <rect x="42" y="28" width="6" height="6" fill="#f5e6c8"/>
    <circle cx="14" cy="40" r="10" fill="none" stroke="#5a3a1a" stroke-width="3"/>
    <path d="M14 30V50M4 40H24M7 33L21 47M21 33L7 47" stroke="#5a3a1a" stroke-width="2"/>` },

  barn: { label: "Barn / farm", vb: "0 0 60 60", art: `
    <path d="M8 52V26l8-10h28l8 10v26z" fill="#a8392e"/>
    <path d="M6 27l9-12h30l9 12" fill="none" stroke="#f5e6c8" stroke-width="2"/>
    <rect x="22" y="34" width="16" height="18" fill="#8f2d24"/>
    <path d="M22 34L38 52M38 34L22 52" stroke="#f5e6c8" stroke-width="2"/>
    <rect x="26" y="20" width="8" height="6" fill="#f5e6c8"/>
    <rect x="6" y="52" width="48" height="3" fill="#6b5a45"/>` },

  bridge: { label: "Bridge", vb: "0 0 60 60", art: `
    <rect x="0" y="44" width="60" height="16" fill="#3a6ea8"/>
    <rect x="4" y="28" width="52" height="18" fill="#a39d8c"/>
    <path d="M10 46V40a8 8 0 0 1 16 0V46zM34 46V40a8 8 0 0 1 16 0V46z" fill="#3a6ea8"/>
    <rect x="4" y="23" width="52" height="3" fill="#6b5a45"/>
    <path d="M8 23v5M20 23v5M32 23v5M44 23v5M52 23v5" stroke="#6b5a45" stroke-width="2.5"/>` },

  monument: { label: "Monument", vb: "0 0 60 60", art: `
    <path d="M30 3l5 11v26H25V14z" fill="#cfcabd"/>
    <path d="M30 3l5 11v26H30z" fill="#b8b2a3"/>
    <rect x="21" y="40" width="18" height="6" fill="#b3ad9d"/>
    <rect x="16" y="46" width="28" height="6" fill="#9a9484"/>
    <rect x="12" y="52" width="36" height="4" fill="#85806f"/>` },

  grave: { label: "Cemetery / headstone", vb: "0 0 60 60", art: `
    <path d="M18 50V25a12 12 0 0 1 24 0V50z" fill="#b8b2a3"/>
    <rect x="29" y="16" width="2" height="15" fill="#6b6658"/>
    <rect x="24" y="21" width="12" height="2" fill="#6b6658"/>
    <rect x="8" y="50" width="44" height="5" fill="#5d7a43"/>` },

  hospital: { label: "Hospital / doctor", vb: "0 0 60 60", art: `
    <rect x="10" y="20" width="40" height="32" fill="#e8e2d2"/>
    <rect x="8" y="16" width="44" height="6" fill="#8a8578"/>
    <rect x="27" y="25" width="6" height="16" fill="#b5483a"/>
    <rect x="22" y="30" width="16" height="6" fill="#b5483a"/>
    <rect x="26" y="43" width="8" height="9" fill="#4a3a28"/>
    <rect x="14" y="43" width="6" height="6" fill="#7fa7c9"/>
    <rect x="40" y="43" width="6" height="6" fill="#7fa7c9"/>
    <rect x="8" y="52" width="44" height="3" fill="#6b5a45"/>` },

  factory: { label: "Factory", vb: "2 -4 52 32", art: `
    <path d="M11 24 L11 14 L21 18 L21 12 L31 16 L31 10 L41 14 L41 24 Z" fill="#4a4a4a"/>
    <rect x="11" y="22" width="30" height="4" fill="#2a2a2a"/>
    <rect x="41" y="6" width="8" height="20" fill="#3a3a3a"/>
    <rect x="40" y="4" width="10" height="3" fill="#2a2a2a"/>
    <rect x="14" y="19" width="4" height="3" fill="#f5e6c8"/>
    <rect x="24" y="19" width="4" height="3" fill="#f5e6c8"/>
    <rect x="34" y="19" width="4" height="3" fill="#f5e6c8"/>
    <g opacity="0.75" transform="translate(-1 0)"><circle cx="46" cy="2" r="2.2" fill="#cfd6df"/><circle cx="50" cy="-1" r="1.6" fill="#cfd6df"/><circle cx="43" cy="-1" r="1.4" fill="#cfd6df"/></g>
    <rect x="11" y="17" width="30" height="1.5" fill="#e47303"/>
  ` },

  trainmodern: { label: "Modern train", vb: "2 4 56 26", scene: "rail", art: `
    <path d="M4 22V12a4 4 0 0 1 4-4h36q12 0 12 10v4z" fill="#dfe3e8"/>
    <rect x="4" y="18" width="52" height="2.6" fill="#E47303"/>
    <rect x="10" y="11" width="5" height="4" fill="#4a6a8a"/><rect x="17" y="11" width="5" height="4" fill="#4a6a8a"/>
    <rect x="24" y="11" width="5" height="4" fill="#4a6a8a"/><rect x="31" y="11" width="5" height="4" fill="#4a6a8a"/>
    <path d="M45 11h5q3 0 4 5h-9z" fill="#4a6a8a"/>
    <circle cx="55" cy="19" r="1.2" fill="#ffd54a"/>
    <rect x="6" y="22" width="48" height="2" fill="#555"/>
    <circle cx="14" cy="25" r="3" fill="#1c1c1c"/><circle cx="22" cy="25" r="3" fill="#1c1c1c"/>
    <circle cx="38" cy="25" r="3" fill="#1c1c1c"/><circle cx="46" cy="25" r="3" fill="#1c1c1c"/>` },

  train: { label: "Train", vb: "2 -1 52 30", scene: "rail", puff: true, art: `
    <rect x="6" y="8" width="34" height="12" fill="#3a3a3a" rx="2"/>
    <rect x="34" y="4" width="16" height="16" fill="#3a3a3a" rx="2"/>
    <rect x="36" y="7" width="6" height="5" fill="#f5e6c8"/>
    <rect x="44" y="7" width="4" height="5" fill="#f5e6c8"/>
    <rect x="4" y="18" width="4" height="5" fill="#3a3a3a"/>
    <circle cx="14" cy="22" r="4" fill="#1c1c1c"/><circle cx="24" cy="22" r="4" fill="#1c1c1c"/>
    <circle cx="34" cy="22" r="4" fill="#1c1c1c"/><circle cx="44" cy="22" r="3" fill="#1c1c1c"/>
    <rect x="16" y="2" width="4" height="6" fill="#3a3a3a"/>
    <rect x="6" y="11" width="30" height="2" fill="#E47303"/>` },

  boat: { label: "Canal boat", vb: "2 0 56 32", scene: "water", art: `
    <path d="M4 20 L10 16 L50 16 L56 20 L56 24 L4 24 Z" fill="#5a3a1a"/>
    <rect x="14" y="10" width="30" height="6" fill="#8a5a2a"/>
    <rect x="18" y="12" width="6" height="4" fill="#f5e6c8"/>
    <rect x="30" y="12" width="6" height="4" fill="#f5e6c8"/>
    <rect x="4" y="8" width="4" height="8" fill="#3a3a3a"/>
    <path d="M6 10 Q 20 4 40 8" stroke="#3a3a3a" stroke-width="1.5" fill="none"/>
    <path d="M6 16 Q 20 20 40 16" stroke="#E47303" stroke-width="1.5" fill="none"/>` },

  car: { label: "Car / road", vb: "4 4 52 28", scene: "road", art: `
    <path d="M6 18 L14 12 L44 12 L54 18 L54 24 L6 24 Z" fill="#8b1a1a"/>
    <rect x="16" y="9" width="24" height="6" fill="#8b1a1a" rx="2"/>
    <rect x="18" y="10" width="8" height="4" fill="#f5e6c8"/>
    <rect x="30" y="10" width="8" height="4" fill="#f5e6c8"/>
    <circle cx="16" cy="24" r="4" fill="#1c1c1c"/><circle cx="44" cy="24" r="4" fill="#1c1c1c"/>
    <rect x="6" y="18" width="48" height="1.5" fill="#E47303"/>` },
  walk: { label: "Walker", vb: "12 0 36 30", scene: "road", art: `
    <circle cx="30" cy="6" r="3.6" fill="#3a3a3a"/>
    <rect x="24.5" y="10" width="5" height="8" rx="1.5" fill="#E47303"/>
    <g stroke="#3a3a3a" stroke-width="3" stroke-linecap="round" fill="none"><path d="M30 10 L29 19"/><path d="M30 12 L36 17"/><path d="M29 19 L35 27"/><path d="M29 19 L23 27"/></g>` },
  bike: { label: "Bicycle", vb: "6 0 48 30", scene: "road", art: `
    <g fill="none" stroke="#1c1c1c" stroke-width="2"><circle cx="14" cy="22" r="6"/><circle cx="46" cy="22" r="6"/></g>
    <g fill="none" stroke="#8b1a1a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 22 L22 13 L38 13 L28 22 Z"/><path d="M38 13 L46 22"/><path d="M38 13 L40 10 L43 10"/><path d="M22 13 L21 10"/></g>
    <rect x="18.5" y="8.5" width="5.5" height="2" rx="1" fill="#3a3a3a"/>
    <g stroke="#3a3a3a" stroke-width="2.6" stroke-linecap="round" fill="none"><path d="M23 9 L30 5"/><path d="M30 5 L40 10"/><path d="M24 10 L29 20"/></g>
    <circle cx="32" cy="1.9" r="2.3" fill="#3a3a3a"/>` }
};

/* Turn an icon key into an image address usable as <img src="...">.
   Unknown keys fall back to the plain building. */
const _iconCache = {};
function iconUrl(key) {
  const k = ICONS[key] ? key : "generic";
  if (!_iconCache[k]) {
    const i = ICONS[k];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="${i.vb}">${i.art}</svg>`;
    _iconCache[k] = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }
  return _iconCache[k];
}
