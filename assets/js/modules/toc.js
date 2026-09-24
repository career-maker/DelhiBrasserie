/* Contents list for long pages (legal pages, blog articles).
   Built from the headings of the text; the headings themselves are not changed, they only get an id.
   Pages with fewer than three headings get no list. */
(function () {
  'use strict';
  var toc = document.querySelector('[data-toc]');
  var src = document.querySelector('[data-toc-src]');
  if (!toc || !src) return;
  var doc = toc.closest('.doc');

  var level = ['h2', 'h3', 'h4'].filter(function (l) { return src.querySelectorAll(l).length >= 3; })[0];
  if (!level) {
    toc.parentNode.removeChild(toc);
    if (doc && !doc.querySelector('.doc-side')) doc.classList.add('doc--flat');
    return;
  }

  var used = {};
  var heads = Array.prototype.slice.call(src.querySelectorAll(level));
  var items = heads.map(function (h) {
    var base = (h.textContent || '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'section';
    var id = base, n = 2;
    while (used[id] || document.getElementById(id)) id = base + '-' + n++;
    used[id] = true;
    if (!h.id) h.id = id;
    return '<li><a href="#' + h.id + '">' + h.innerHTML.replace(/<[^>]+>/g, '') + '</a></li>';
  });
  toc.innerHTML = '<p class="doc-toc-h">' + (toc.getAttribute('aria-label') || 'Contents') + '</p><ol>' + items.join('') + '</ol>';

  if (!('IntersectionObserver' in window)) return;
  var links = Array.prototype.slice.call(toc.querySelectorAll('a'));
  var seen = {};
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { seen[e.target.id] = e.isIntersecting; });
    var first = heads.filter(function (h) { return seen[h.id]; })[0];
    if (!first) return;
    links.forEach(function (a) { a.classList.toggle('on', a.getAttribute('href') === '#' + first.id); });
  }, { rootMargin: '-15% 0px -70% 0px' });
  heads.forEach(function (h) { io.observe(h); });
})();
