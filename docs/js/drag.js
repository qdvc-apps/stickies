/* drag.js — picking notes up, carrying them between panels, resizing them.
   While a note is in hand it is parented to the board rather than a panel, so
   it can cross the channel without being clipped. */
(function (QDVC) {
  'use strict';

  var util = QDVC.util;
  var state = QDVC.state;

  var board = null;
  var session = null;

  function surfaceBox(panelId) {
    return QDVC.board.surface(panelId).getBoundingClientRect();
  }

  function markTarget(panelId) {
    Array.prototype.forEach.call(board.querySelectorAll('.panel'), function (panel) {
      if (panel.getAttribute('data-panel-id') === panelId) {
        panel.setAttribute('data-target', 'true');
      } else {
        panel.removeAttribute('data-target');
      }
    });
  }

  function clearTargets() {
    Array.prototype.forEach.call(board.querySelectorAll('.panel'), function (panel) {
      panel.removeAttribute('data-target');
    });
    board.removeAttribute('data-dragging');
  }

  function startMove(el, note, event) {
    var boardBox = board.getBoundingClientRect();
    var box = surfaceBox(note.panel);

    session = {
      mode: 'move',
      id: note.id,
      el: el,
      grabX: event.clientX - (box.left + note.x),
      grabY: event.clientY - (box.top + note.y),
      boardBox: boardBox,
      origin: { panel: note.panel, x: note.x, y: note.y },
      left: box.left - boardBox.left + note.x,
      top: box.top - boardBox.top + note.y,
      panel: note.panel
    };

    board.appendChild(el);
    el.setAttribute('data-lifted', 'true');
    board.setAttribute('data-dragging', 'true');
    el.style.left = session.left + 'px';
    el.style.top = session.top + 'px';
    markTarget(note.panel);
  }

  function startResize(el, note, event) {
    session = {
      mode: 'resize',
      id: note.id,
      el: el,
      startX: event.clientX,
      startY: event.clientY,
      w: note.w,
      h: note.h,
      box: surfaceBox(note.panel),
      note: note
    };
    el.setAttribute('data-lifted', 'true');
  }

  function onMove(event) {
    if (!session) { return; }

    if (session.mode === 'move') {
      var left = event.clientX - session.grabX - session.boardBox.left;
      var top = event.clientY - session.grabY - session.boardBox.top;
      session.left = util.clamp(left, -40, session.boardBox.width - 40);
      session.top = util.clamp(top, 0, session.boardBox.height - 34);
      session.el.style.left = session.left + 'px';
      session.el.style.top = session.top + 'px';

      var panel = QDVC.board.panelAt(event.clientX, event.clientY);
      if (panel !== session.panel) {
        session.panel = panel;
        markTarget(panel);
      }
      return;
    }

    var limits = state.limits;
    var note = session.note;
    var width = util.clamp(session.w + (event.clientX - session.startX),
                           limits.minW, Math.min(limits.maxW, session.box.width - note.x));
    var height = util.clamp(session.h + (event.clientY - session.startY),
                            limits.minH, Math.min(limits.maxH, session.box.height - note.y));
    session.width = Math.round(width);
    session.height = Math.round(height);
    session.el.style.width = session.width + 'px';
    session.el.style.height = session.height + 'px';
  }

  function finish(cancelled) {
    if (!session) { return; }
    var current = session;
    session = null;
    current.el.removeAttribute('data-lifted');

    if (current.mode === 'move') {
      clearTargets();
      if (cancelled) {
        state.patchNote(current.id, current.origin);
        return;
      }
      var panel = current.panel || current.origin.panel;
      var box = surfaceBox(panel);
      var note = state.note(current.id);
      if (!note) { return; }
      state.patchNote(current.id, {
        panel: panel,
        x: Math.round(util.clamp(current.left + current.boardBox.left - box.left, 0, box.width - note.w)),
        y: Math.round(util.clamp(current.top + current.boardBox.top - box.top, 0, box.height - note.h))
      });
      return;
    }

    if (cancelled || current.width === undefined) {
      QDVC.board.render();
      return;
    }
    state.patchNote(current.id, { w: current.width, h: current.height });
  }

  QDVC.drag = {

    bind: function (element) {
      board = element;

      board.addEventListener('pointerdown', function (event) {
        if (event.button !== 0 && event.pointerType === 'mouse') { return; }
        var el = event.target.closest('.note');
        if (!el) { return; }

        var note = state.note(el.getAttribute('data-id'));
        if (!note) { return; }

        /* Anything you touch comes to the top of the pile. */
        el.style.zIndex = String(state.raiseNote(note.id));

        if (event.target.closest('[data-resize]')) {
          event.preventDefault();
          el.setPointerCapture(event.pointerId);
          startResize(el, note, event);
          return;
        }

        /* Only the handle bar picks a note up, and only where it is bare:
           the tools sitting on it do their own jobs. Anything that shows the
           grab cursor drags, and nothing else does. */
        if (!event.target.closest('[data-handle]') || event.target.closest('button')) { return; }

        event.preventDefault();
        el.setPointerCapture(event.pointerId);
        startMove(el, note, event);
      });

      board.addEventListener('pointermove', onMove);

      board.addEventListener('pointerup', function () { finish(false); });
      board.addEventListener('pointercancel', function () { finish(true); });

      document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && session) { finish(true); }
      });
    }
  };
}(window.QDVC));
