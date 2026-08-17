/* io.js — export to a JSON file, import one back.
   The file is plain, readable JSON: preferences, panels, notes. Anything the
   app cannot make sense of is repaired or dropped on the way in. */
(function (QDVC) {
  'use strict';

  var state = QDVC.state;
  var pending = null;

  function stamp() {
    var now = new Date();
    function pad(value) { return (value < 10 ? '0' : '') + value; }
    return now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()) +
           '-' + pad(now.getHours()) + pad(now.getMinutes());
  }

  function sheet() { return document.getElementById('sheet-import'); }

  function showError(message) {
    var el = sheet();
    el.setAttribute('data-state', 'error');
    el.querySelector('[data-import-error]').textContent = message;
    QDVC.modal.open('sheet-import');
  }

  function showSummary(file, board) {
    var el = sheet();
    var counts = {};
    board.notes.forEach(function (note) { counts[note.panel] = (counts[note.panel] || 0) + 1; });
    var breakdown = board.panels.map(function (panel) {
      return panel.name + ' ' + (counts[panel.id] || 0);
    }).join('  \u00b7  ');

    el.setAttribute('data-state', 'ready');
    el.querySelector('[data-import-file]').textContent = file.name;
    el.querySelector('[data-import-count]').textContent =
      board.notes.length + (board.notes.length === 1 ? ' note' : ' notes');
    el.querySelector('[data-import-breakdown]').textContent = breakdown;
    el.querySelector('[data-import-saved]').textContent = QDVC.util.formatDate(board.savedAt);
    QDVC.modal.open('sheet-import');
  }

  QDVC.io = {

    exportBoard: function () {
      var payload = state.exportPayload();
      QDVC.util.saveFile('qdvc-stickies-' + stamp() + '.json', JSON.stringify(payload, null, 2));
      QDVC.toast('Exported ' + payload.notes.length +
        (payload.notes.length === 1 ? ' note' : ' notes') + ' to a JSON file.');
    },

    pickFile: function () {
      document.getElementById('import-file').click();
    },

    read: function (file) {
      if (!file) { return; }
      var reader = new FileReader();

      reader.onload = function () {
        var board;
        try {
          board = state.normalise(JSON.parse(String(reader.result)));
        } catch (err) {
          pending = null;
          showError(err && err.message ? err.message :
            'That file could not be read as JSON. Choose a file exported from QDVC Stickies.');
          return;
        }
        pending = board;
        showSummary(file, board);
      };

      reader.onerror = function () {
        pending = null;
        showError('The file could not be opened. Try exporting it again.');
      };

      reader.readAsText(file);
    },

    bind: function () {
      var input = document.getElementById('import-file');

      input.addEventListener('change', function (event) {
        QDVC.io.read(event.target.files[0]);
        event.target.value = '';
      });

      sheet().addEventListener('click', function (event) {
        var action = event.target.closest('[data-import-action]');
        if (!action || !pending) { return; }
        var mode = action.getAttribute('data-import-action');
        var board = pending;
        pending = null;
        QDVC.modal.close('sheet-import');

        if (mode === 'replace') {
          state.replaceAll(board);
          QDVC.board.applyPreferences();
          QDVC.toast('Board replaced with ' + board.notes.length +
            (board.notes.length === 1 ? ' note.' : ' notes.'));
        } else {
          var added = state.mergeIn(board);
          QDVC.toast('Added ' + added + (added === 1 ? ' note' : ' notes') + ' to the board.');
        }
      });
    }
  };
}(window.QDVC));
