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
  var lastY = window.pageYOffset || doc.documentElement.scrollTop;

  function onScroll() {
    var y = window.pageYOffset || doc.documentElement.scrollTop;
    if (header) {
      header.classList.toggle('is-stuck', y > 40);
      if (y > lastY && y > 150) {
        header.classList.add('is-hidden');
      } else if (y < lastY) {
        header.classList.remove('is-hidden');
      }
    }
    lastY = Math.max(0, y);
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
  doc.querySelectorAll('section:not(#top), h1, h2, h3, h4, p').forEach(function(el) {
    if (!el.classList.contains('reveal') && !el.classList.contains('reveal-mask') && !el.closest('.hero-slides') && !el.closest('footer')) {
      el.classList.add('reveal');
    }
  });
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



  /* ---------- preloader (same sequence as the Pandhal site) ---------- */
  (function () {
    var pre = doc.getElementById('preloader');
    var html = doc.documentElement;
    if (!pre) { html.classList.add('pre-done'); doc.dispatchEvent(new Event('db:ready')); return; }
    var circle = pre.querySelector('.circle');
    var done = false;
    function finish() {
      if (done) return;
      done = true;
      if (circle) { circle.style.transition = 'transform 1.6s'; circle.style.transform = 'scale(16)'; }
      pre.style.opacity = '0';
      html.classList.add('pre-done');
      doc.dispatchEvent(new Event('db:ready'));
      setTimeout(function () { pre.style.display = 'none'; }, 1000);
    }
    if (reduceMotion) { pre.style.display = 'none'; html.classList.add('pre-done'); doc.dispatchEvent(new Event('db:ready')); return; }
    if (doc.readyState === 'complete') finish();
    else window.addEventListener('load', finish);
    setTimeout(finish, 6000); /* never leave visitors on the loader */
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

  /* ---------- cookie consent ---------- */
  (function () {
    var bar = doc.getElementById('cookieBar');
    var modal = doc.getElementById('cookieModal');
    if (!bar || !modal) return;
    var html = doc.documentElement;
    var NAME = 'db_consent';
    var cats = ['analytics', 'functional'];
    var boxes = [].slice.call(modal.querySelectorAll('[data-cookie-cat]'));
    var lastFocus = null;

    function read() {
      var m = doc.cookie.match(new RegExp('(?:^|;\\s*)' + NAME + '=([^;]+)'));
      if (!m) return null;
      try { return JSON.parse(decodeURIComponent(m[1])); } catch (e) { return null; }
    }
    function write(choice) {
      var c = NAME + '=' + encodeURIComponent(JSON.stringify(choice)) + '; max-age=' + (60 * 60 * 24 * 365) + '; path=/; SameSite=Lax';
      if (location.protocol === 'https:') c += '; Secure';
      doc.cookie = c;
    }
    /* switch on scripts that were held back: <script type="text/plain" data-cookie="analytics" src="..."> */
    function activate(choice) {
      [].slice.call(doc.querySelectorAll('script[type="text/plain"][data-cookie]')).forEach(function (old) {
        if (!choice[old.getAttribute('data-cookie')] || old.getAttribute('data-done')) return;
        var s = doc.createElement('script');
        [].slice.call(old.attributes).forEach(function (a) {
          if (a.name !== 'type' && a.name !== 'data-cookie') s.setAttribute(a.name, a.value);
        });
        s.text = old.text;
        old.setAttribute('data-done', '1');
        old.parentNode.insertBefore(s, old.nextSibling);
      });
    }
    function all(v) { var c = {}; cats.forEach(function (k) { c[k] = v; }); return c; }

    /* bar */
    function measure() { html.style.setProperty('--cc-h', bar.classList.contains('is-open') ? bar.offsetHeight + 'px' : '0px'); }
    function showBar() {
      bar.classList.add('is-open');
      html.classList.add('cc-open');
      measure();
    }
    function hideBar() {
      bar.classList.remove('is-open');
      html.classList.remove('cc-open');
      measure();
    }
    window.addEventListener('resize', measure);

    /* dialog */
    function focusables() { return modal.querySelectorAll('button:not([disabled]),input:not([disabled])'); }
    function openModal() {
      var cur = read() || {};
      boxes.forEach(function (b) { b.checked = !!cur[b.getAttribute('data-cookie-cat')]; });
      lastFocus = doc.activeElement;
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      doc.body.classList.add('no-scroll');
      setTimeout(function () { var f = focusables(); if (f.length) f[0].focus(); }, 60);
    }
    function closeModal(skipFocus) {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      doc.body.classList.remove('no-scroll');
      if (!skipFocus && lastFocus && lastFocus.focus) lastFocus.focus();
    }
    function save(choice) {
      choice.necessary = true;
      write(choice);
      activate(choice);
      window.dbConsent = choice;
      doc.dispatchEvent(new CustomEvent('db:consent', { detail: choice }));
      closeModal(true);
      hideBar();
    }

    doc.querySelectorAll('[data-cookie-open]').forEach(function (b) { b.addEventListener('click', openModal); });
    doc.querySelectorAll('[data-cookie-accept],[data-cookie-all]').forEach(function (b) { b.addEventListener('click', function () { save(all(true)); }); });
    var rej = modal.querySelector('[data-cookie-reject]');
    if (rej) rej.addEventListener('click', function () { save(all(false)); });
    var sv = modal.querySelector('[data-cookie-save]');
    if (sv) sv.addEventListener('click', function () {
      var c = {};
      boxes.forEach(function (b) { c[b.getAttribute('data-cookie-cat')] = b.checked; });
      save(c);
    });
    modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
    doc.addEventListener('keydown', function (e) {
      if (!modal.classList.contains('is-open')) return;
      if (e.key === 'Escape') { closeModal(); return; }
      if (e.key === 'Tab') {
        var f = focusables(); if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    /* first visit: show the bar once the preloader has finished. Returning visitor: apply the stored choice. */
    var stored = read();
    if (stored) { window.dbConsent = stored; activate(stored); return; }
    function later() { setTimeout(showBar, 1300); }  /* after the preloader circle has swelled away */
    if (html.classList.contains('pre-done')) later();
    else doc.addEventListener('db:ready', later, { once: true });
  })();

  /* ---------- hide a section when its content is empty ---------- */
  doc.querySelectorAll('[data-hide-if-empty]').forEach(function (sec) {
    var probe = sec.querySelector('[data-required]');
    if (!probe || !probe.textContent.trim()) sec.hidden = true;
  });
})();
