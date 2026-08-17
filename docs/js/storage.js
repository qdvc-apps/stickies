/* storage.js — the only place that touches localStorage. */
(function (QDVC) {
  'use strict';

  var KEY = 'qdvc.stickies.v1';

  QDVC.storage = {

    key: KEY,

    available: function () {
      try {
        window.localStorage.setItem(KEY + '.probe', '1');
        window.localStorage.removeItem(KEY + '.probe');
        return true;
      } catch (err) {
        return false;
      }
    },

    read: function () {
      try {
        var raw = window.localStorage.getItem(KEY);
        return raw ? JSON.parse(raw) : null;
      } catch (err) {
        return null;
      }
    },

    write: function (data) {
      try {
        window.localStorage.setItem(KEY, JSON.stringify(data));
        return true;
      } catch (err) {
        return false;
      }
    },

    /* Wipes this origin's localStorage entirely, not just the board's key. */
    clearAll: function () {
      try {
        window.localStorage.clear();
        return true;
      } catch (err) {
        return false;
      }
    },

    /* Rough character count of everything stored for this origin. */
    footprint: function () {
      var total = 0, i, k;
      try {
        for (i = 0; i < window.localStorage.length; i += 1) {
          k = window.localStorage.key(i);
          total += k.length + (window.localStorage.getItem(k) || '').length;
        }
      } catch (err) { return 0; }
      return total * 2; /* UTF-16 code units */
    },

    keyCount: function () {
      try { return window.localStorage.length; } catch (err) { return 0; }
    }
  };
}(window.QDVC));
