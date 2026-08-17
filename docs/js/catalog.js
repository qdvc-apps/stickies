/* catalog.js — the fixed stock: typefaces and paper colours.
   Font stacks are made only of faces that ship with an operating system, so
   nothing is ever fetched from a font service. */
(function (QDVC) {
  'use strict';

  QDVC.catalog = {

    fonts: [
      { id: 'humanist',   label: 'Humanist',   spec: 'Optima, Candara, Gill Sans',
        stack: '"Optima", "Candara", "Gill Sans MT", "Trebuchet MS", "Segoe UI", sans-serif' },
      { id: 'marker',     label: 'Marker',     spec: 'Bradley Hand, Segoe Print',
        stack: '"Bradley Hand", "Segoe Print", "Comic Sans MS", "Chalkboard SE", cursive' },
      { id: 'grotesque',  label: 'Grotesque',  spec: 'Helvetica Neue, Arial',
        stack: '"Helvetica Neue", Helvetica, Arial, "Liberation Sans", sans-serif' },
      { id: 'oldstyle',   label: 'Old style',  spec: 'Iowan, Palatino, Georgia',
        stack: '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif' },
      { id: 'typewriter', label: 'Typewriter', spec: 'American Typewriter, Courier',
        stack: '"American Typewriter", "Courier New", Courier, monospace' },
      { id: 'mono',       label: 'Mono',       spec: 'SF Mono, Consolas',
        stack: 'ui-monospace, "SF Mono", "Cascadia Mono", Consolas, "DejaVu Sans Mono", monospace' },
      { id: 'system',     label: 'System',     spec: 'Whatever this device uses',
        stack: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }
    ],

    papers: [
      { id: 'canary', label: 'Canary', hex: '#ffe45c' },
      { id: 'guava',  label: 'Guava',  hex: '#ff9e7a' },
      { id: 'mint',   label: 'Mint',   hex: '#a9e6a1' },
      { id: 'sky',    label: 'Sky',    hex: '#9bd3f5' },
      { id: 'lilac',  label: 'Lilac',  hex: '#d6b9f5' },
      { id: 'bone',   label: 'Bone',   hex: '#f2ecdc' }
    ],

    font: function (id) {
      return this.fonts.filter(function (f) { return f.id === id; })[0] || this.fonts[0];
    },

    paper: function (id) {
      return this.papers.filter(function (p) { return p.id === id; })[0] || this.papers[0];
    }
  };
}(window.QDVC));
