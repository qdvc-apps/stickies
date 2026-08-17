# QDVC Stickies

A mat for sticky notes. **Now** takes a third of the screen, **Later** takes the rest,
and notes sit wherever you drop them inside either panel — never in the ruled channel
between the two.

## Running it

Open `docs/index.html` in a browser. There is no build step, no server required and no
external dependency: no CDN, no web font, no framework. Scripts are loaded as plain
`<script>` tags rather than ES modules, because modules cannot be fetched over `file://`.

The folder is named `docs/` so the same tree can be served by GitHub Pages as-is.

## Using it

| Action | How |
| --- | --- |
| New note | Double-click the mat, press `+` on a panel, or File → New note |
| Move a note | Drag the paper (drag it across to the other panel to move it there) |
| Resize a note | Drag the bottom-right corner |
| Recolour a note | Hover the note, then use the colour button |
| Delete a note | Hover the note, then use `×` |
| Cancel a drag | `Esc` while still holding |

Shortcuts: `Ctrl/⌘ Shift N` new note, `Ctrl/⌘ O` import, `Ctrl/⌘ E` export, `Ctrl/⌘ ,` preferences.

## Storage

The board is kept in this browser's `localStorage` under the single key
`qdvc.stickies.v1`. Nothing leaves the device.

Edit → Preferences → Storage shows what is stored and can clear it. File → Export writes
a JSON file; File → Import reads one back, either replacing the board or merging the
incoming notes into it. Anything malformed in an imported file is repaired or dropped
rather than crashing the board.

```json
{
  "app": "QDVC Stickies",
  "schema": 1,
  "savedAt": "2026-08-17T09:00:00.000Z",
  "preferences": { "noteFont": "humanist", "noteSize": 15 },
  "panels": [
    { "id": "now",   "name": "Now",   "share": 1 },
    { "id": "later", "name": "Later", "share": 2 }
  ],
  "notes": [
    {
      "id": "note-mf2k1a-1-4x",
      "panel": "now",
      "x": 26, "y": 62, "w": 208, "h": 176,
      "color": "canary",
      "text": "Draft the handover notes",
      "z": 1,
      "createdAt": "2026-08-17T09:00:00.000Z",
      "updatedAt": "2026-08-17T09:00:00.000Z"
    }
  ]
}
```

`panels[].share` is a flex ratio, which is where the one-third / two-thirds split comes
from. Note coordinates are pixels measured from the top-left of their own panel, and are
nudged back inside the panel if the window becomes too small to hold them.

## Layout

```
docs/
  index.html        markup, menus and dialogs
  css/
    base.css        design tokens, reset, shared controls
    menubar.css     the menu strip
    board.css       panels and the channel between them
    note.css        the paper
    modal.css       dialogs and the toast
    preferences.css the master/detail settings sheet
  js/
    util.js         helpers
    catalog.js      the available typefaces and paper colours
    storage.js      the only module that touches localStorage
    state.js        board data, rules, validation, persistence
    modal.js        dialog manager
    notes.js        one note's DOM
    board.js        panels, rendering, placement
    drag.js         carrying and resizing notes
    menubar.js      menus, keyboard, shortcuts
    preferences.js  the Preferences sheet
    io.js           import and export
    app.js          wiring
```

Typeface choices are limited to families that ship with an operating system, so the app
never has to fetch a font.
