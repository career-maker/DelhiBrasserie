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
    if (header) header.classList.toggle('is-stuck', y > 40);
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
    setTimeout(function () { closeBtn.focus(); }, 140);
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
  var reveals = doc.querySelectorAll('.reveal, .reveal-mask');
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

  /* ---------- photo carousel (native scroll-snap, arrows, dots, gentle autoplay) ---------- */
  doc.querySelectorAll('[data-carousel]').forEach(function (root) {
    var track = root.querySelector('[data-track]');
    var prev = root.querySelector('[data-prev]');
    var next = root.querySelector('[data-next]');
    var dotsWrap = root.querySelector('[data-dots]');
    var interval = parseInt(root.getAttribute('data-interval'), 10) || 5500;
    var timer = null, paused = false, dots = [];
    if (!track) return;
    var items = [].slice.call(track.children);

    function offsetOf(el) {
      return el.getBoundingClientRect().left - track.getBoundingClientRect().left + track.scrollLeft;
    }
    function current() {
      var best = 0, min = Infinity;
      items.forEach(function (el, i) {
        var d = Math.abs(offsetOf(el) - track.scrollLeft);
        if (d < min) { min = d; best = i; }
      });
      return best;
    }
    function atEnd() { return track.scrollLeft + track.clientWidth >= track.scrollWidth - 4; }
    function goTo(i) {
      i = Math.max(0, Math.min(items.length - 1, i));
      track.scrollTo({ left: offsetOf(items[i]), behavior: reduceMotion ? 'auto' : 'smooth' });
    }
    function move(dir) {
      if (dir > 0 && atEnd()) { goTo(0); return; }
      goTo(current() + dir);
    }
    function sync() {
      var i = atEnd() ? items.length - 1 : current();
      if (prev) prev.disabled = track.scrollLeft < 4;
      dots.forEach(function (d, k) { d.classList.toggle('on', k === i); });
    }
    function stop() { clearInterval(timer); timer = null; }
    function play() {
      stop();
      if (reduceMotion || paused) return;
      timer = setInterval(function () { move(1); }, interval);
    }

    if (dotsWrap) {
      dots = items.map(function (_, i) {
        var b = doc.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', 'Show photo ' + (i + 1) + ' of ' + items.length);
        b.addEventListener('click', function () { goTo(i); play(); });
        dotsWrap.appendChild(b);
        return b;
      });
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


  /* ---------- live opening status (London time) ---------- */
  (function () {
    var status = doc.querySelector('[data-open-status]');
    var hoursEl = doc.querySelector('[data-open-hours]');
    if (!status || !hoursEl) return;
    var open = { Mon: [17, 0, 23, 30], Tue: [17, 0, 23, 30], Wed: [17, 0, 23, 30], Thu: [17, 0, 23, 30],
                 Fri: [17, 0, 24, 0], Sat: [17, 0, 24, 0], Sun: [17, 0, 23, 30] };
    function label(mins) {
      if (mins >= 24 * 60) return 'midnight';
      var h = Math.floor(mins / 60), m = mins % 60;
      return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
    }
    try {
      var parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/London', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23'
      }).formatToParts(new Date());
      var get = function (t) { for (var i = 0; i < parts.length; i++) if (parts[i].type === t) return parts[i].value; return ''; };
      var day = get('weekday').slice(0, 3);
      var now = parseInt(get('hour'), 10) * 60 + parseInt(get('minute'), 10);
      var d = open[day];
      if (!d) return;
      var from = d[0] * 60 + d[1], to = d[2] * 60 + d[3];
      if (now >= from && now < to) { status.textContent = 'Open now'; hoursEl.textContent = 'Until ' + label(to); }
      else if (now < from) { status.textContent = 'Open tonight'; hoursEl.textContent = 'From ' + label(from); }
      else { status.textContent = 'Open tomorrow'; hoursEl.textContent = 'From 17:00'; }
    } catch (e) { /* keep the static text */ }
  })();



  /* ---------- preloader: gold circle swells, then the page is revealed (once per visit) ---------- */
  (function () {
    var pre = doc.getElementById('preloader');
    if (!pre) return;
    var html = doc.documentElement;
    function finish() {
      pre.classList.add('go');
      setTimeout(function () { pre.classList.add('gone'); }, 1300);
      try { sessionStorage.setItem('dbPre', '1'); } catch (e) { /* private mode */ }
    }
    if (!html.classList.contains('pre-on')) { pre.classList.add('gone'); return; }
    if (doc.readyState === 'complete') setTimeout(finish, 350);
    else window.addEventListener('load', function () { setTimeout(finish, 350); });
    setTimeout(function () { if (!pre.classList.contains('go')) finish(); }, 5000);
  })();

  /* ---------- hero slides: fade, counter, arrows, slow autoplay ---------- */
  doc.querySelectorAll('[data-hero]').forEach(function (hero) {
    var slides = [].slice.call(hero.querySelectorAll('.hero-slide'));
    var cur = hero.querySelector('[data-count-cur]');
    var tot = hero.querySelector('[data-count-tot]');
    var prev = hero.querySelector('[data-hero-prev]');
    var next = hero.querySelector('[data-hero-next]');
    var i = 0, timer = null;
    if (slides.length < 2) return;
    function pad(n) { return (n < 10 ? '0' : '') + n; }
    if (tot) tot.textContent = pad(slides.length);
    function go(n) {
      i = (n + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.classList.toggle('is-active', k === i); });
      if (cur) cur.textContent = pad(i + 1);
    }
    function restart() {
      clearInterval(timer);
      if (reduceMotion) return;
      timer = setInterval(function () { if (!doc.hidden) go(i + 1); }, 7000);
    }
    if (prev) prev.addEventListener('click', function () { go(i - 1); restart(); });
    if (next) next.addEventListener('click', function () { go(i + 1); restart(); });
    restart();
  });

  /* ---------- hide a section when its content is empty ---------- */
  doc.querySelectorAll('[data-hide-if-empty]').forEach(function (sec) {
    var probe = sec.querySelector('[data-required]');
    if (!probe || !probe.textContent.trim()) sec.hidden = true;
  });
})();
