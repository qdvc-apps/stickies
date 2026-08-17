/* preferences.js — the Preferences sheet: master list on the left, one pane
   on the right. Changes take effect on the board immediately. */
(function (QDVC) {
  'use strict';

  var state = QDVC.state;

  var sheet = null;

  function select(paneId) {
    Array.prototype.forEach.call(sheet.querySelectorAll('.prefs__tab'), function (tab) {
      tab.setAttribute('aria-selected', String(tab.getAttribute('data-pane') === paneId));
    });
    Array.prototype.forEach.call(sheet.querySelectorAll('.prefs__pane'), function (pane) {
      if (pane.getAttribute('data-pane-id') === paneId) { pane.setAttribute('data-active', 'true'); }
      else { pane.removeAttribute('data-active'); }
    });
  }

  function fillFonts() {
    var picker = sheet.querySelector('#pref-font');
    picker.innerHTML = '';
    QDVC.catalog.fonts.forEach(function (font) {
      var option = document.createElement('option');
      option.value = font.id;
      option.textContent = font.label + ' \u2014 ' + font.spec;
      picker.appendChild(option);
    });
  }

  QDVC.preferences = {

    bind: function (element) {
      sheet = element;
      fillFonts();

      sheet.addEventListener('click', function (event) {
        var tab = event.target.closest('.prefs__tab');
        if (tab) { select(tab.getAttribute('data-pane')); }
      });

      sheet.querySelector('#pref-font').addEventListener('change', function (event) {
        state.setPreference('noteFont', QDVC.catalog.font(event.target.value).id);
      });

      var size = sheet.querySelector('#pref-size');
      size.addEventListener('input', function (event) {
        state.setPreference('noteSize', parseInt(event.target.value, 10));
      });

      sheet.querySelector('[data-action="clear-storage"]').addEventListener('click', function () {
        QDVC.modal.confirm({
          title: 'Clear stored data',
          body: 'This empties this browser\u2019s storage for QDVC Stickies. Every note and preference goes with it, and it cannot be undone. Export first if you want a copy.',
          action: 'Clear everything',
          danger: true,
          onConfirm: function () {
            QDVC.storage.clearAll();
            state.reset();
            QDVC.board.applyPreferences();
            QDVC.preferences.refresh();
            QDVC.toast('Storage cleared. Fresh board.');
          }
        });
      });

      sheet.querySelector('[data-action="export-from-prefs"]').addEventListener('click', function () {
        QDVC.io.exportBoard();
      });
    },

    /* Pull the sheet's controls and readouts back in line with the state. */
    refresh: function () {
      if (!sheet) { return; }
      var prefs = state.get().preferences;

      sheet.querySelector('#pref-font').value = prefs.noteFont;
      sheet.querySelector('#pref-size').value = prefs.noteSize;
      sheet.querySelector('[data-size-value]').textContent = prefs.noteSize + ' px';

      var counts = state.get().notes.length;
      sheet.querySelector('[data-readout="notes"]').textContent = counts;
      sheet.querySelector('[data-readout="size"]').textContent =
        QDVC.util.formatBytes(QDVC.storage.footprint());
      sheet.querySelector('[data-readout="saved"]').textContent =
        QDVC.util.formatDate(state.get().savedAt);
    },

    open: function () {
      this.refresh();
      QDVC.modal.open('sheet-prefs');
    }
  };
}(window.QDVC));
