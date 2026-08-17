/* notes.js — building and updating one sticky note's DOM. */
(function (QDVC) {
  'use strict';

  var util = QDVC.util;

  function tool(className, label, glyph) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'note__tool ' + className;
    button.setAttribute('aria-label', label);
    button.title = label;
    button.textContent = glyph;
    return button;
  }

  QDVC.notes = {

    build: function (note) {
      var el = document.createElement('article');
      el.className = 'note';
      el.setAttribute('data-id', note.id);
      el.style.setProperty('--tilt', util.tiltFor(note.id));

      var grip = document.createElement('div');
      grip.className = 'note__grip';
      grip.setAttribute('data-handle', 'true');
      grip.title = 'Drag to move this note';

      /* The markings that say "pick me up here". */
      var bars = document.createElement('div');
      bars.className = 'note__bars';
      bars.setAttribute('aria-hidden', 'true');
      bars.appendChild(document.createElement('span'));
      grip.appendChild(bars);

      var swatch = tool('note__swatch', 'Change paper colour', '');
      swatch.appendChild(document.createElement('span'));
      grip.appendChild(swatch);
      grip.appendChild(tool('note__tool--kill', 'Delete this note', '\u00d7'));

      var palette = document.createElement('div');
      palette.className = 'note__palette';
      palette.setAttribute('role', 'group');
      palette.setAttribute('aria-label', 'Paper colour');
      QDVC.catalog.papers.forEach(function (paper) {
        var chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'note__chip';
        chip.setAttribute('data-paper', paper.id);
        chip.setAttribute('aria-label', paper.label);
        chip.setAttribute('aria-pressed', String(paper.id === note.color));
        chip.title = paper.label;
        chip.style.background = paper.hex;
        palette.appendChild(chip);
      });

      var text = document.createElement('textarea');
      text.className = 'note__text';
      text.setAttribute('spellcheck', 'false');
      text.placeholder = 'Write it down\u2026';
      text.setAttribute('aria-label', 'Note text');
      text.value = note.text;

      var corner = document.createElement('div');
      corner.className = 'note__corner';
      corner.setAttribute('data-resize', 'true');
      corner.title = 'Drag to resize';

      el.appendChild(grip);
      el.appendChild(palette);
      el.appendChild(text);
      el.appendChild(corner);

      this.paint(el, note);
      return el;
    },

    /* Geometry and colour, applied without disturbing what is being typed. */
    paint: function (el, note) {
      el.style.left = note.x + 'px';
      el.style.top = note.y + 'px';
      el.style.width = note.w + 'px';
      el.style.height = note.h + 'px';
      el.style.zIndex = String(note.z);
      el.style.setProperty('--paper', QDVC.catalog.paper(note.color).hex);
      el.setAttribute('data-color', note.color);
      Array.prototype.forEach.call(el.querySelectorAll('.note__chip'), function (chip) {
        chip.setAttribute('aria-pressed', String(chip.getAttribute('data-paper') === note.color));
      });
    }
  };
}(window.QDVC));
