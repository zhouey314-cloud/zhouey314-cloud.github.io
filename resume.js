/* Printing is optional; the complete resume and its evidence links are HTML. */
(() => {
  'use strict';
  if (typeof window.print !== 'function') return;
  document.querySelectorAll('[data-print-resume]').forEach((button) => {
    button.addEventListener('click', () => window.print());
    button.hidden = false;
  });
})();
