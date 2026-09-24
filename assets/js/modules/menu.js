/* Menu pages: highlight the section chip that matches what is on screen. */
(function () {
  'use strict';
  var nav = document.querySelector('.menu-nav-in');
  if (!nav || !('IntersectionObserver' in window)) return;
  var links = Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]'));
  var map = {};
  links.forEach(function (a) {
    var el = document.getElementById(a.getAttribute('href').slice(1));
    if (el) map[el.id] = a;
  });
  var ids = Object.keys(map);
  if (!ids.length) return;
  var visible = {};
  function paint() {
    var first = ids.filter(function (id) { return visible[id]; })[0];
    links.forEach(function (a) { a.classList.remove('on'); a.removeAttribute('aria-current'); });
    if (first && map[first]) {
      map[first].classList.add('on');
      map[first].setAttribute('aria-current', 'true');
      var l = map[first];
      if (nav.scrollWidth > nav.clientWidth) nav.scrollTo({ left: l.offsetLeft - nav.clientWidth / 3, behavior: 'smooth' });
    }
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { visible[e.target.id] = e.isIntersecting; });
    paint();
  }, { rootMargin: '-25% 0px -55% 0px' });
  ids.forEach(function (id) { io.observe(document.getElementById(id)); });
})();
