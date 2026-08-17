/* util.js — small shared helpers. No dependencies, no build step.
   Everything hangs off one global so the files can be plain <script> tags
   and still load straight from the filesystem. */
window.QDVC = window.QDVC || {};

(function (QDVC) {
  'use strict';

  var idCounter = 0;

  QDVC.util = {

    /* Short, sortable, collision-resistant enough for one browser tab. */
    uid: function (prefix) {
      idCounter += 1;
      return (prefix || 'id') + '-' +
        Date.now().toString(36) + '-' +
        idCounter.toString(36) +
        Math.floor(Math.random() * 1296).toString(36);
    },

    clamp: function (value, min, max) {
      if (max < min) { return min; }
      return Math.min(Math.max(value, min), max);
    },

    /* Deterministic tilt so a note always leans the same way it did before. */
    tiltFor: function (id) {
      var hash = 0;
      for (var i = 0; i < id.length; i += 1) {
        hash = (hash * 31 + id.charCodeAt(i)) % 100000;
      }
      return ((hash % 240) / 100 - 1.2).toFixed(2) + 'deg';
    },

    debounce: function (fn, wait) {
      var timer = null;
      return function () {
        var args = arguments, self = this;
        window.clearTimeout(timer);
        timer = window.setTimeout(function () { fn.apply(self, args); }, wait);
      };
    },

    isoNow: function () { return new Date().toISOString(); },

    /* Blob download — works from file:// as well as over http. */
    saveFile: function (filename, text, mime) {
      var blob = new Blob([text], { type: (mime || 'application/json') + ';charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    },

    formatBytes: function (bytes) {
      if (bytes < 1024) { return bytes + ' B'; }
      if (bytes < 1024 * 1024) { return (bytes / 1024).toFixed(1) + ' kB'; }
      return (bytes / 1048576).toFixed(2) + ' MB';
    },

    formatDate: function (iso) {
      if (!iso) { return 'unknown'; }
      var date = new Date(iso);
      if (isNaN(date.getTime())) { return 'unknown'; }
      return date.toLocaleString();
    },

    isApple: function () {
      return /Mac|iPhone|iPad|iPod/.test(window.navigator.platform || '') ||
             /Mac OS X/.test(window.navigator.userAgent || '');
    }
  };
}(window.QDVC));
