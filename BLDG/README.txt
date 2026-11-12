# Building Map Designer — prototype

## Files
- `index.html`: standalone editor; open it in a modern desktop browser.
- `blank-project.json`: blank multi-floor project to import with **Open JSON**.
- `shapes.json`: reference list of built-in reusable shape types.
- `inventory-template.csv`: optional starter equipment inventory spreadsheet.

## Included in this prototype
- Example two-floor community-center plan.
- Select and move objects; draw walls, lines, rectangles, ellipses, freehand lines, and text.
- Add/remove walls (use **Wall** and **Remove** tools).
- Door swing symbols; to model an opening, split the wall into two wall segments and place the door in the gap.
- Furniture, restroom, safety equipment, stair up/down arrows, and elevator symbols.
- Grid and snap toggle, basic placement collision checks, object properties, labels, rotation and skew.
- Add, rename, duplicate, and remove floors.
- Undo/redo, JSON save/load, background image upload, PNG export, browser print/PDF.

## Important limitations
This is a functional starting prototype, not a validated architectural CAD tool. Collision detection is approximate: it uses axis-aligned footprints for object-to-object collisions and geometric segment checks for solid walls. Rotated/skewed footprints are not fully collision-tested. Wall junctions, angled walls, true door openings, scale calibration, room-boundary detection, dimension chains, and accessibility/code compliance are not fully modeled. The door symbol does not automatically cut an opening in an existing wall; draw walls as separate segments around the opening. PNG export exports the current SVG drawing but does not include the uploaded raster background image. For poster-quality exports with uploaded plans, use Print / PDF or take this prototype into a later iteration with a more complete export pipeline.

Before posting maps publicly, verify all measurements and routes onsite. Do not treat this prototype as an official life-safety or code-compliance plan.
