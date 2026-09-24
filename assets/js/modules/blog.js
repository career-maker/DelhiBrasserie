/* Blog: show the first nine articles, reveal the rest nine at a time.
   Without JS every article is visible (the "more" state is applied here, not in the markup). */
(function () {
  'use strict';
  var grid = document.querySelector('[data-posts]');
  var btn = document.querySelector('[data-more-btn]');
  if (!grid || !btn) return;
  var STEP = 9;
  var hidden = Array.prototype.slice.call(grid.querySelectorAll('[data-more]'));
  if (!hidden.length) return;
  hidden.forEach(function (c) { c.hidden = true; });
  btn.hidden = false;
  btn.addEventListener('click', function () {
    hidden.splice(0, STEP).forEach(function (c, i) {
      c.hidden = false;
      c.classList.add('in-view');
      if (i === 0) { var a = c.querySelector('a'); if (a) a.focus({ preventScroll: true }); }
    });
    if (!hidden.length) btn.hidden = true;
  });
})();
