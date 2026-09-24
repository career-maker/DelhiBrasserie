/* Delhi Brasserie — shared behaviour: sticky header, drawer, reveal-on-scroll,
   image slider, notice ticker, scroll-to-top, hide-empty sections.
   No dependencies. Everything degrades gracefully without JS. */
(function () {
  'use strict';

  var doc = document;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- sticky header + scroll-to-top ---------- */
  var header = doc.querySelector('.site-header');
  var topbar = doc.querySelector('.topbar');
  var toTop = doc.querySelector('.to-top');
  var ticking = false;

  function onScroll() {
    var y = window.pageYOffset || doc.documentElement.scrollTop;
    if (header) header.classList.toggle('is-stuck', y > (topbar ? topbar.offsetHeight : 0));
    if (toTop) toTop.classList.toggle('show', y > 700);
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* ---------- drawer ---------- */
  var drawer = doc.getElementById('drawer');
  var backdrop = doc.getElementById('drawerBackdrop');
  var openBtn = doc.getElementById('menuBtn');
  var closeBtn = doc.getElementById('drawerClose');
  var lastFocus = null;

  function focusables() {
    return drawer.querySelectorAll('a[href],button:not([disabled])');
  }
  function openDrawer() {
    lastFocus = doc.activeElement;
    drawer.classList.add('open');
    backdrop.classList.add('open');
    doc.body.classList.add('no-scroll');
    openBtn.setAttribute('aria-expanded', 'true');
    drawer.removeAttribute('inert');
    /* wait a tick: the drawer is visibility:hidden until its transition starts */
    setTimeout(function () { closeBtn.focus(); }, 60);
  }
  function closeDrawer() {
    drawer.classList.remove('open');
    backdrop.classList.remove('open');
    doc.body.classList.remove('no-scroll');
    openBtn.setAttribute('aria-expanded', 'false');
    drawer.setAttribute('inert', '');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  if (drawer && backdrop && openBtn && closeBtn) {
    drawer.setAttribute('inert', '');
    openBtn.addEventListener('click', openDrawer);
    closeBtn.addEventListener('click', closeDrawer);
    backdrop.addEventListener('click', closeDrawer);
    drawer.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeDrawer();
    });
    doc.addEventListener('keydown', function (e) {
      if (!drawer.classList.contains('open')) return;
      if (e.key === 'Escape') { closeDrawer(); return; }
      if (e.key === 'Tab') {
        var f = focusables();
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* ---------- reveal on scroll ---------- */
  var reveals = doc.querySelectorAll('.reveal');
  if (reveals.length) {
    if ('IntersectionObserver' in window && !reduceMotion) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('in-view'); io.unobserve(en.target); }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
      reveals.forEach(function (el) { io.observe(el); });
    } else {
      reveals.forEach(function (el) { el.classList.add('in-view'); });
    }
  }

  /* ---------- image slider (fade) ---------- */
  doc.querySelectorAll('[data-slider]').forEach(function (root) {
    var slides = [].slice.call(root.querySelectorAll('[data-slide]'));
    var dotsWrap = root.querySelector('[data-dots]');
    var prev = root.querySelector('[data-prev]');
    var next = root.querySelector('[data-next]');
    var interval = parseInt(root.getAttribute('data-interval'), 10) || 6000;
    var index = 0, timer = null, paused = false;
    if (slides.length < 2) return;

    var dots = slides.map(function (_, i) {
      var b = doc.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'Show photo ' + (i + 1) + ' of ' + slides.length);
      b.addEventListener('click', function () { go(i); restart(); });
      if (dotsWrap) dotsWrap.appendChild(b);
      return b;
    });

    function go(i) {
      index = (i + slides.length) % slides.length;
      slides.forEach(function (s, k) {
        var on = k === index;
        s.classList.toggle('is-active', on);
        s.setAttribute('aria-hidden', on ? 'false' : 'true');
      });
      dots.forEach(function (d, k) {
        d.classList.toggle('on', k === index);
        if (k === index) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current');
      });
    }
    function restart() {
      clearInterval(timer);
      if (reduceMotion || paused) return;
      timer = setInterval(function () { go(index + 1); }, interval);
    }
    if (prev) prev.addEventListener('click', function () { go(index - 1); restart(); });
    if (next) next.addEventListener('click', function () { go(index + 1); restart(); });
    root.addEventListener('mouseenter', function () { paused = true; restart(); });
    root.addEventListener('mouseleave', function () { paused = false; restart(); });
    root.addEventListener('focusin', function () { paused = true; restart(); });
    root.addEventListener('focusout', function () { paused = false; restart(); });
    doc.addEventListener('visibilitychange', function () {
      paused = doc.hidden; restart();
    });

    /* swipe */
    var sx = null;
    root.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    root.addEventListener('touchend', function (e) {
      if (sx === null) return;
      var dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 40) { go(index + (dx < 0 ? 1 : -1)); restart(); }
      sx = null;
    }, { passive: true });

    go(0);
    restart();
  });

  /* ---------- notice ticker (hero bottom strip) ---------- */
  doc.querySelectorAll('[data-ticker]').forEach(function (root) {
    var items = [].slice.call(root.querySelectorAll('[data-tick]'));
    if (items.length < 2) return;
    var i = 0;
    root.classList.add('is-live');
    function show(n) {
      items.forEach(function (it, k) { it.classList.toggle('is-active', k === n); });
    }
    show(0);
    if (reduceMotion) return;
    setInterval(function () {
      if (doc.hidden) return;
      i = (i + 1) % items.length; show(i);
    }, 5500);
  });

  /* ---------- hide a section when its content is empty ---------- */
  doc.querySelectorAll('[data-hide-if-empty]').forEach(function (sec) {
    var probe = sec.querySelector('[data-required]');
    if (!probe || !probe.textContent.trim()) sec.hidden = true;
  });
})();
