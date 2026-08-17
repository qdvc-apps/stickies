/* menubar.js — the menu strip: opening, closing, keyboard, shortcuts.
   Menus are declared in index.html; each item names a command. */
(function (QDVC) {
  'use strict';

  QDVC.commands = {};

  var bar = null;

  function menus() {
    return Array.prototype.slice.call(bar.querySelectorAll('.menu'));
  }

  function closeAll() {
    menus().forEach(function (menu) {
      menu.removeAttribute('data-open');
      menu.querySelector('.menu__label').setAttribute('aria-expanded', 'false');
    });
  }

  function openMenu(menu) {
    closeAll();
    menu.setAttribute('data-open', 'true');
    menu.querySelector('.menu__label').setAttribute('aria-expanded', 'true');
  }

  function isOpen() {
    return !!bar.querySelector('.menu[data-open="true"]');
  }

  function items(menu) {
    return Array.prototype.slice.call(menu.querySelectorAll('.menu__item'));
  }

  function run(command) {
    closeAll();
    if (QDVC.commands[command]) { QDVC.commands[command](); }
  }

  function labelKeys() {
    var mod = QDVC.util.isApple() ? '\u2318' : 'Ctrl';
    var shift = QDVC.util.isApple() ? '\u21e7' : 'Shift';
    Array.prototype.forEach.call(bar.querySelectorAll('[data-key]'), function (el) {
      el.textContent = el.getAttribute('data-key')
        .replace('mod', mod)
        .replace('shift', shift)
        .split('+')
        .join(QDVC.util.isApple() ? '' : '+');
    });
  }

  QDVC.menubar = {

    bind: function (element) {
      bar = element;
      labelKeys();

      bar.addEventListener('click', function (event) {
        var label = event.target.closest('.menu__label');
        if (label) {
          var menu = label.closest('.menu');
          if (menu.getAttribute('data-open') === 'true') { closeAll(); } else { openMenu(menu); }
          return;
        }
        var item = event.target.closest('.menu__item');
        if (item) { run(item.getAttribute('data-command')); }
      });

      /* Once a menu is open, sliding sideways switches between them. */
      bar.addEventListener('mouseover', function (event) {
        if (!isOpen()) { return; }
        var label = event.target.closest('.menu__label');
        if (label) { openMenu(label.closest('.menu')); }
      });

      bar.addEventListener('keydown', function (event) {
        var menu = event.target.closest('.menu');
        if (!menu) { return; }
        var all = menus();
        var index = all.indexOf(menu);

        if (event.key === 'ArrowDown' && event.target.closest('.menu__label')) {
          event.preventDefault();
          openMenu(menu);
          var first = items(menu)[0];
          if (first) { first.focus(); }
          return;
        }
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          var list = items(menu);
          var at = list.indexOf(event.target);
          if (at > -1) {
            event.preventDefault();
            var next = event.key === 'ArrowDown' ? at + 1 : at - 1;
            list[(next + list.length) % list.length].focus();
          }
          return;
        }
        if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
          event.preventDefault();
          var step = event.key === 'ArrowRight' ? 1 : -1;
          var sibling = all[(index + step + all.length) % all.length];
          openMenu(sibling);
          sibling.querySelector('.menu__label').focus();
        }
      });

      document.addEventListener('click', function (event) {
        if (!event.target.closest('.menubar')) { closeAll(); }
      });

      document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && isOpen()) {
          closeAll();
          return;
        }
        var mod = event.metaKey || event.ctrlKey;
        if (!mod) { return; }
        var key = event.key.toLowerCase();

        if (key === 'n' && event.shiftKey) { event.preventDefault(); run('note.new'); }
        else if (key === 'e' && !event.shiftKey) { event.preventDefault(); run('file.export'); }
        else if (key === 'o' && !event.shiftKey) { event.preventDefault(); run('file.import'); }
        else if (key === ',') { event.preventDefault(); run('edit.preferences'); }
      });
    },

    close: closeAll
  };
}(window.QDVC));
