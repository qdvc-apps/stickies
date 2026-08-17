/* modal.js — one tiny dialog manager for every sheet in the app. */
(function (QDVC) {
  'use strict';

  var stack = [];
  var returnFocus = [];

  function focusables(root) {
    return Array.prototype.filter.call(
      root.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'),
      function (el) { return !el.disabled && el.offsetParent !== null; }
    );
  }

  QDVC.modal = {

    open: function (id) {
      var scrim = document.getElementById(id);
      if (!scrim || stack.indexOf(id) > -1) { return; }
      returnFocus.push(document.activeElement);
      scrim.setAttribute('data-open', 'true');
      stack.push(id);
      var first = focusables(scrim)[0];
      if (first) { first.focus(); }
    },

    close: function (id) {
      var scrim = document.getElementById(id);
      if (!scrim) { return; }
      scrim.removeAttribute('data-open');
      stack = stack.filter(function (open) { return open !== id; });
      var previous = returnFocus.pop();
      if (previous && previous.focus) { previous.focus(); }
    },

    closeTop: function () {
      if (stack.length) { this.close(stack[stack.length - 1]); }
    },

    isOpen: function (id) { return stack.indexOf(id) > -1; },

    anyOpen: function () { return stack.length > 0; },

    /* Reusable yes/no sheet, so destructive actions always ask first. */
    confirm: function (options) {
      var scrim = document.getElementById('sheet-confirm');
      scrim.querySelector('[data-confirm-title]').textContent = options.title;
      scrim.querySelector('[data-confirm-body]').textContent = options.body;

      /* Replacing the button drops any handler left over from last time. */
      var previous = scrim.querySelector('[data-confirm-go]');
      var go = previous.cloneNode(false);
      go.textContent = options.action;
      go.className = 'btn ' + (options.danger ? 'btn--danger' : 'btn--primary');
      previous.parentNode.replaceChild(go, previous);

      var self = this;
      go.addEventListener('click', function () {
        self.close('sheet-confirm');
        options.onConfirm();
      });

      this.open('sheet-confirm');
      go.focus();
    },

    bind: function () {
      var self = this;

      document.addEventListener('click', function (event) {
        var closer = event.target.closest('[data-close]');
        if (closer) {
          self.close(closer.getAttribute('data-close'));
          return;
        }
        if (event.target.classList.contains('scrim')) {
          self.close(event.target.id);
        }
      });

      document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && stack.length) {
          event.preventDefault();
          self.closeTop();
        }
      });
    }
  };
}(window.QDVC));
