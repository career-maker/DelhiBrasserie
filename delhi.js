/* Delhi Brasserie - shared behaviour: sticky header, drawer, reveal-on-scroll,
   photo carousel, booking marquee pause, scroll-to-top, hide-empty sections.
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
      }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
      reveals.forEach(function (el) { io.observe(el); });
    } else {
      reveals.forEach(function (el) { el.classList.add('in-view'); });
    }
  }

  /* ---------- photo carousel (native scroll-snap + arrows + gentle autoplay) ---------- */
  doc.querySelectorAll('[data-carousel]').forEach(function (root) {
    var track = root.querySelector('[data-track]');
    var prev = root.querySelector('[data-prev]');
    var next = root.querySelector('[data-next]');
    var interval = parseInt(root.getAttribute('data-interval'), 10) || 5500;
    var timer = null, paused = false;
    if (!track) return;

    function step() {
      var first = track.firstElementChild;
      if (!first) return 300;
      var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      return first.getBoundingClientRect().width + gap;
    }
    function atEnd() {
      return track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
    }
    function move(dir) {
      if (dir > 0 && atEnd()) { track.scrollTo({ left: 0, behavior: reduceMotion ? 'auto' : 'smooth' }); return; }
      track.scrollBy({ left: dir * step(), behavior: reduceMotion ? 'auto' : 'smooth' });
    }
    function sync() {
      if (prev) prev.disabled = track.scrollLeft < 4;
    }
    function stop() { clearInterval(timer); timer = null; }
    function play() {
      stop();
      if (reduceMotion || paused) return;
      timer = setInterval(function () { move(1); }, interval);
    }

    if (prev) prev.addEventListener('click', function () { move(-1); play(); });
    if (next) next.addEventListener('click', function () { move(1); play(); });
    track.addEventListener('scroll', function () { window.requestAnimationFrame(sync); }, { passive: true });
    ['mouseenter', 'focusin', 'touchstart'].forEach(function (ev) {
      root.addEventListener(ev, function () { paused = true; stop(); }, { passive: true });
    });
    ['mouseleave', 'focusout'].forEach(function (ev) {
      root.addEventListener(ev, function () { paused = false; play(); });
    });
    root.addEventListener('touchend', function () {
      setTimeout(function () { paused = false; play(); }, 4000);
    }, { passive: true });
    doc.addEventListener('visibilitychange', function () { paused = doc.hidden; if (paused) stop(); else play(); });

    /* only run the autoplay while the carousel is on screen */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          paused = !en.isIntersecting;
          if (paused) stop(); else play();
        });
      }, { threshold: 0.35 }).observe(root);
    } else {
      play();
    }
    sync();
  });

  /* ---------- marquee pause button ---------- */
  doc.querySelectorAll('.marquee').forEach(function (m) {
    var btn = m.querySelector('.marquee-pause');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var on = m.classList.toggle('is-paused');
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      btn.setAttribute('aria-label', on ? 'Play notice' : 'Pause notice');
    });
  });

  /* ---------- hide a section when its content is empty ---------- */
  doc.querySelectorAll('[data-hide-if-empty]').forEach(function (sec) {
    var probe = sec.querySelector('[data-required]');
    if (!probe || !probe.textContent.trim()) sec.hidden = true;
  });
})();
