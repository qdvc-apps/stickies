/* board.js — the mat: panels, the channel between them, and note placement. */
(function (QDVC) {
  'use strict';

  var util = QDVC.util;
  var state = QDVC.state;

  var root = null;
  var surfaces = {};
  var elements = {};
  var bound = false;

  function buildPanel(panel) {
    var section = document.createElement('section');
    section.className = 'panel';
    section.setAttribute('data-panel-id', panel.id);
    section.setAttribute('aria-label', panel.name + ' panel');
    /* Longhands rather than the flex shorthand: same result, and it survives
       stricter CSS parsers. Now gets one share, Later gets two. */
    section.style.flexGrow = String(panel.share);
    section.style.flexShrink = '1';
    section.style.flexBasis = '0';

    var plate = document.createElement('div');
    plate.className = 'panel__plate';

    var name = document.createElement('h2');
    name.className = 'panel__name';
    name.textContent = panel.name;

    var tally = document.createElement('span');
    tally.className = 'panel__tally';
    tally.setAttribute('data-tally', panel.id);

    var add = document.createElement('button');
    add.type = 'button';
    add.className = 'panel__add';
    add.setAttribute('data-add-to', panel.id);
    add.setAttribute('aria-label', 'Add a note to ' + panel.name);
    add.title = 'Add a note to ' + panel.name;
    add.textContent = '+';

    plate.appendChild(name);
    plate.appendChild(tally);
    plate.appendChild(add);

    var surface = document.createElement('div');
    surface.className = 'panel__surface';
    surface.setAttribute('data-surface', panel.id);

    var empty = document.createElement('div');
    empty.className = 'panel__empty';
    var strong = document.createElement('strong');
    strong.textContent = panel.name + ' is clear';
    var span = document.createElement('span');
    span.textContent = 'Double-click anywhere here to start a note.';
    empty.appendChild(strong);
    empty.appendChild(span);
    surface.appendChild(empty);

    section.appendChild(plate);
    section.appendChild(surface);
    return section;
  }

  QDVC.board = {

    mount: function (element) {
      root = element;
      root.innerHTML = '';
      surfaces = {};

      state.get().panels.forEach(function (panel, index) {
        if (index > 0) {
          var channel = document.createElement('div');
          channel.className = 'channel';
          channel.setAttribute('aria-hidden', 'true');
          channel.title = 'Notes cannot rest in the channel';
          root.appendChild(channel);
        }
        var section = buildPanel(panel);
        root.appendChild(section);
        surfaces[panel.id] = section.querySelector('.panel__surface');
      });

      elements = {};
      this.bind();
      this.applyPreferences();
      this.render();
    },

    surface: function (panelId) { return surfaces[panelId] || surfaces[state.get().panels[0].id]; },

    element: function (noteId) { return elements[noteId] || null; },

    /* Which panel is under this point? A point in the channel belongs to the
       nearer panel, so a note released there still lands somewhere sensible. */
    panelAt: function (clientX, clientY) {
      var best = null, bestDistance = Infinity;
      Object.keys(surfaces).forEach(function (id) {
        var box = surfaces[id].getBoundingClientRect();
        var dx = Math.max(box.left - clientX, 0, clientX - box.right);
        var dy = Math.max(box.top - clientY, 0, clientY - box.bottom);
        var distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < bestDistance) { bestDistance = distance; best = id; }
      });
      return best;
    },

    applyPreferences: function () {
      var prefs = state.get().preferences;
      var style = document.documentElement.style;
      style.setProperty('--note-face', QDVC.catalog.font(prefs.noteFont).stack);
      style.setProperty('--note-size', prefs.noteSize + 'px');
    },

    /* Reuses existing note elements so typing and focus survive a redraw. */
    render: function () {
      var data = state.get();
      var seen = {};
      var nudged = false;

      data.notes.forEach(function (note) {
        var el = elements[note.id];
        if (!el) {
          el = QDVC.notes.build(note);
          elements[note.id] = el;
        }
        var surface = QDVC.board.surface(note.panel);
        if (el.parentNode !== surface) { surface.appendChild(el); }

        var box = surface.getBoundingClientRect();
        var x = Math.round(util.clamp(note.x, 0, box.width - note.w));
        var y = Math.round(util.clamp(note.y, 0, box.height - note.h));
        if (x !== note.x || y !== note.y) {
          note.x = x;
          note.y = y;
          nudged = true;
        }
        QDVC.notes.paint(el, note);
        seen[note.id] = true;
      });

      Object.keys(elements).forEach(function (id) {
        if (!seen[id]) {
          if (elements[id].parentNode) { elements[id].parentNode.removeChild(elements[id]); }
          delete elements[id];
        }
      });

      /* A note pushed back into view by a window resize keeps its new spot. */
      if (nudged) { state.touch(); }

      this.tally();
    },

    tally: function () {
      var data = state.get();
      data.panels.forEach(function (panel) {
        var count = state.notesIn(panel.id).length;
        var readout = root.querySelector('[data-tally="' + panel.id + '"]');
        if (readout) { readout.textContent = count === 0 ? '' : count; }
        var section = root.querySelector('[data-panel-id="' + panel.id + '"]');
        if (section) { section.setAttribute('data-populated', String(count > 0)); }
      });
      var total = document.querySelector('[data-total]');
      if (total) {
        total.textContent = data.notes.length + (data.notes.length === 1 ? ' note' : ' notes');
      }
    },

    /* A new note centred on a point, kept fully inside the panel. */
    addAt: function (panelId, clientX, clientY) {
      var box = this.surface(panelId).getBoundingClientRect();
      var limits = state.limits;
      var note = state.addNote({
        panel: panelId,
        x: Math.round(util.clamp(clientX - box.left - limits.w / 2, 0, box.width - limits.w)),
        y: Math.round(util.clamp(clientY - box.top - 20, 0, box.height - limits.h))
      });
      this.focusNote(note.id);
      return note;
    },

    addTo: function (panelId) {
      var note = state.addNote({ panel: panelId });
      this.focusNote(note.id);
      return note;
    },

    focusNote: function (noteId) {
      var el = elements[noteId];
      if (!el) { return; }
      var text = el.querySelector('.note__text');
      if (text) { text.focus(); }
    },

    closePalettes: function (except) {
      Object.keys(elements).forEach(function (id) {
        if (elements[id] !== except) { elements[id].removeAttribute('data-palette'); }
      });
    },

    bind: function () {
      if (bound) { return; }
      bound = true;

      var saveText = util.debounce(function (id, value) {
        state.patchNote(id, { text: value }, { quiet: true });
      }, 250);

      root.addEventListener('dblclick', function (event) {
        if (event.target.closest('.note')) { return; }
        var surface = event.target.closest('.panel__surface');
        if (!surface) { return; }
        QDVC.board.addAt(surface.getAttribute('data-surface'), event.clientX, event.clientY);
      });

      root.addEventListener('click', function (event) {
        var add = event.target.closest('[data-add-to]');
        if (add) {
          QDVC.board.addTo(add.getAttribute('data-add-to'));
          return;
        }

        var note = event.target.closest('.note');
        if (!note) {
          QDVC.board.closePalettes(null);
          return;
        }
        var id = note.getAttribute('data-id');

        if (event.target.closest('.note__tool--kill')) {
          state.removeNote(id);
          return;
        }
        if (event.target.closest('.note__swatch')) {
          var open = note.getAttribute('data-palette') === 'true';
          QDVC.board.closePalettes(note);
          if (open) { note.removeAttribute('data-palette'); }
          else { note.setAttribute('data-palette', 'true'); }
          return;
        }
        var chip = event.target.closest('.note__chip');
        if (chip) {
          state.patchNote(id, { color: chip.getAttribute('data-paper') });
          note.removeAttribute('data-palette');
          return;
        }
        QDVC.board.closePalettes(note);
      });

      root.addEventListener('input', function (event) {
        var text = event.target.closest('.note__text');
        if (!text) { return; }
        var note = text.closest('.note');
        saveText(note.getAttribute('data-id'), text.value);
      });

      window.addEventListener('resize', util.debounce(function () {
        QDVC.board.render();
      }, 120));
    }
  };
}(window.QDVC));
