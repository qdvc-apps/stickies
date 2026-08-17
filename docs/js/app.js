/* app.js — wiring. Loads the board, registers menu commands, starts drawing. */
(function (QDVC) {
  'use strict';

  var toastTimer = null;

  QDVC.toast = function (message) {
    var el = document.getElementById('toast');
    el.textContent = message;
    el.setAttribute('data-open', 'true');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { el.removeAttribute('data-open'); }, 3200);
  };

  function registerCommands() {
    var state = QDVC.state;

    QDVC.commands['note.new'] = function () {
      QDVC.board.addTo(state.get().panels[0].id);
    };
    QDVC.commands['note.new.later'] = function () {
      QDVC.board.addTo(state.get().panels[1].id);
    };
    QDVC.commands['file.import'] = function () { QDVC.io.pickFile(); };
    QDVC.commands['file.export'] = function () { QDVC.io.exportBoard(); };
    QDVC.commands['edit.preferences'] = function () { QDVC.preferences.open(); };
    QDVC.commands['help.about'] = function () { QDVC.modal.open('sheet-about'); };
  }

  function start() {
    var state = QDVC.state;
    state.load();

    QDVC.modal.bind();
    QDVC.menubar.bind(document.getElementById('menubar'));
    QDVC.preferences.bind(document.getElementById('sheet-prefs'));
    QDVC.io.bind();
    registerCommands();

    var boardEl = document.getElementById('board');
    QDVC.board.mount(boardEl);
    QDVC.drag.bind(boardEl);

    state.subscribe(function (data, reason) {
      if (reason === 'storage-failed') {
        QDVC.toast('This browser refused to save. Notes will last until you close the tab.');
        return;
      }
      if (reason === 'board-replaced' || reason === 'board-reset') {
        QDVC.board.mount(boardEl);
      } else {
        QDVC.board.applyPreferences();
        QDVC.board.render();
      }
      if (QDVC.modal.isOpen('sheet-prefs')) { QDVC.preferences.refresh(); }
      var sizeValue = document.querySelector('[data-size-value]');
      if (sizeValue) { sizeValue.textContent = data.preferences.noteSize + ' px'; }
    });

    if (!QDVC.storage.available()) {
      QDVC.toast('Storage is blocked in this browser, so nothing will be saved between visits.');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
}(window.QDVC));
