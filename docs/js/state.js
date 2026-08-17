/* state.js — the board's data, its rules, and its persistence.
   Nothing else writes to storage; nothing else invents defaults. */
(function (QDVC) {
  'use strict';

  var util = QDVC.util;
  var storage = QDVC.storage;

  var SCHEMA = 1;
  var NOTE = { w: 208, h: 176, minW: 150, minH: 110, maxW: 900, maxH: 900, maxChars: 8000 };

  var data = null;
  var listeners = [];
  var placeCount = 0;

  function defaults() {
    return {
      app: 'QDVC Stickies',
      schema: SCHEMA,
      savedAt: util.isoNow(),
      preferences: { noteFont: 'humanist', noteSize: 15 },
      panels: [
        { id: 'now',   name: 'Now',   share: 1 },
        { id: 'later', name: 'Later', share: 2 }
      ],
      notes: []
    };
  }

  function num(value, fallback) {
    var parsed = typeof value === 'number' ? value : parseFloat(value);
    return isFinite(parsed) ? parsed : fallback;
  }

  function cleanNote(raw, panelIds, index) {
    var id = typeof raw.id === 'string' && raw.id ? raw.id : util.uid('note');
    var panel = panelIds.indexOf(raw.panel) > -1 ? raw.panel : panelIds[0];
    return {
      id: id,
      panel: panel,
      x: Math.round(util.clamp(num(raw.x, 24), -2000, 20000)),
      y: Math.round(util.clamp(num(raw.y, 60), -2000, 20000)),
      w: Math.round(util.clamp(num(raw.w, NOTE.w), NOTE.minW, NOTE.maxW)),
      h: Math.round(util.clamp(num(raw.h, NOTE.h), NOTE.minH, NOTE.maxH)),
      color: QDVC.catalog.paper(raw.color).id,
      text: String(raw.text === undefined || raw.text === null ? '' : raw.text).slice(0, NOTE.maxChars),
      z: Math.round(num(raw.z, index + 1)),
      createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : util.isoNow(),
      updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : util.isoNow()
    };
  }

  /* Accepts anything (old save, hand-edited export, junk) and returns a board
     that is safe to render. Throws only when the payload is not a board. */
  function normalise(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      throw new Error('That file does not contain a QDVC Stickies board.');
    }
    if (!Array.isArray(raw.notes)) {
      throw new Error('That file has no notes list, so there is nothing to load.');
    }

    var base = defaults();
    var panels = Array.isArray(raw.panels) && raw.panels.length
      ? raw.panels.map(function (p, i) {
          return {
            id: typeof p.id === 'string' && p.id ? p.id : 'panel-' + (i + 1),
            name: typeof p.name === 'string' && p.name ? p.name : 'Panel ' + (i + 1),
            share: util.clamp(num(p.share, 1), 0.2, 12)
          };
        })
      : base.panels;

    var panelIds = panels.map(function (p) { return p.id; });
    var prefs = raw.preferences && typeof raw.preferences === 'object' ? raw.preferences : {};

    return {
      app: base.app,
      schema: SCHEMA,
      savedAt: typeof raw.savedAt === 'string' ? raw.savedAt : util.isoNow(),
      preferences: {
        noteFont: QDVC.catalog.font(prefs.noteFont).id,
        noteSize: Math.round(util.clamp(num(prefs.noteSize, 15), 12, 26))
      },
      panels: panels,
      notes: raw.notes.filter(function (n) { return n && typeof n === 'object'; })
                      .map(function (n, i) { return cleanNote(n, panelIds, i); })
    };
  }

  function announce(reason) {
    listeners.forEach(function (fn) { fn(data, reason || 'change'); });
  }

  var persist = util.debounce(function () {
    data.savedAt = util.isoNow();
    if (!storage.write(data)) {
      announce('storage-failed');
    }
  }, 180);

  function commit(reason, opts) {
    persist();
    if (!(opts && opts.quiet)) { announce(reason); }
  }

  function topZ() {
    return data.notes.reduce(function (max, n) { return Math.max(max, n.z); }, 0);
  }

  QDVC.state = {

    limits: NOTE,

    load: function () {
      var stored = storage.read();
      if (stored) {
        try { data = normalise(stored); } catch (err) { data = defaults(); }
      } else {
        data = defaults();
      }
      return data;
    },

    get: function () { return data; },

    panel: function (id) {
      return data.panels.filter(function (p) { return p.id === id; })[0] || data.panels[0];
    },

    note: function (id) {
      return data.notes.filter(function (n) { return n.id === id; })[0] || null;
    },

    notesIn: function (panelId) {
      return data.notes.filter(function (n) { return n.panel === panelId; });
    },

    subscribe: function (fn) { listeners.push(fn); },

    /* --- notes ---------------------------------------------------------- */

    addNote: function (spec) {
      spec = spec || {};
      var panel = this.panel(spec.panel).id;
      var placed = spec.x === undefined || spec.y === undefined;
      var step = placeCount * 22;
      placeCount = (placeCount + 1) % 8;

      var note = cleanNote({
        panel: panel,
        x: placed ? 26 + step : spec.x,
        y: placed ? 62 + step : spec.y,
        w: spec.w, h: spec.h,
        color: spec.color || QDVC.catalog.papers[data.notes.length % QDVC.catalog.papers.length].id,
        text: spec.text || '',
        z: topZ() + 1
      }, data.panels.map(function (p) { return p.id; }), data.notes.length);

      data.notes.push(note);
      commit('note-added');
      return note;
    },

    patchNote: function (id, changes, opts) {
      var note = this.note(id);
      if (!note) { return null; }
      Object.keys(changes).forEach(function (key) {
        if (key === 'id' || key === 'createdAt') { return; }
        note[key] = changes[key];
      });
      note.updatedAt = util.isoNow();
      commit('note-changed', opts);
      return note;
    },

    removeNote: function (id) {
      var before = data.notes.length;
      data.notes = data.notes.filter(function (n) { return n.id !== id; });
      if (data.notes.length !== before) { commit('note-removed'); }
    },

    raiseNote: function (id) {
      var note = this.note(id);
      if (!note) { return 0; }
      var highestOther = data.notes.reduce(function (max, other) {
        return other.id === id ? max : Math.max(max, other.z);
      }, 0);
      if (note.z <= highestOther) {
        note.z = highestOther + 1;
        commit('note-raised', { quiet: true });
      }
      return note.z;
    },

    /* --- preferences ---------------------------------------------------- */

    setPreference: function (key, value) {
      data.preferences[key] = value;
      commit('preference-changed');
    },

    /* --- whole-board operations ----------------------------------------- */

    normalise: normalise,

    replaceAll: function (payload) {
      data = normalise(payload);
      commit('board-replaced');
      return data;
    },

    /* Keeps what is on the board and drops the incoming notes in beside it,
       with fresh ids so nothing is overwritten. */
    mergeIn: function (payload) {
      var incoming = normalise(payload);
      var panelIds = data.panels.map(function (p) { return p.id; });
      var z = topZ();
      var added = 0;

      incoming.notes.forEach(function (note, i) {
        z += 1;
        added += 1;
        data.notes.push(cleanNote({
          panel: panelIds.indexOf(note.panel) > -1 ? note.panel : panelIds[0],
          x: note.x + 16, y: note.y + 16,
          w: note.w, h: note.h,
          color: note.color, text: note.text, z: z,
          createdAt: note.createdAt
        }, panelIds, i));
      });

      commit('board-merged');
      return added;
    },

    /* Board back to two empty panels and default preferences. */
    reset: function () {
      data = defaults();
      commit('board-reset');
      return data;
    },

    /* Save the board as it currently stands, without asking for a redraw. */
    touch: function () { commit('touched', { quiet: true }); },

    exportPayload: function () {
      return {
        app: data.app,
        schema: data.schema,
        savedAt: util.isoNow(),
        exportedBy: 'QDVC Stickies',
        preferences: data.preferences,
        panels: data.panels,
        notes: data.notes
      };
    }
  };
}(window.QDVC));
