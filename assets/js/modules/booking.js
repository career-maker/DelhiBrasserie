/* Pre- and post-theatre booking wizards (5 steps each).
 *
 * Markup lives in src/pages/pre-post-theatre-dining. Each wizard root carries:
 *   data-wizard="pre|post"
 *   data-availability="URL"  optional. GET ?type=&date=YYYY-MM-DD&guests=N  ->  {"slots":["17:30","17:45"]}
 *                            When empty, times are generated from the opening hours below.
 *   data-endpoint="URL"      optional. POST JSON of the booking. When empty the wizard runs in PREVIEW mode:
 *                            it shows the confirmation screen but sends nothing.
 * Connect both to ReDi (or another booking system) before launch.
 */
(function () {
  'use strict';

  var CFG = {
    open: '17:00',
    close: { 0: '23:30', 1: '23:30', 2: '23:30', 3: '23:30', 4: '23:30', 5: '00:00', 6: '00:00' }, // Sun..Sat
    lastSeatingBeforeClose: 30,   // minutes: the last table time is this long before closing
    preRecommend: [120, 90],      // recommended arrival: 2 h to 1 h 30 before curtain up
    preSlotRange: [150, 75],      // bookable arrival times: 2 h 30 to 1 h 15 before curtain up
    preLatest: 60,                // arrival must be at least this long before curtain up
    postOffsets: [0, 15, 30, 45], // table times offered after the show ends
    postSuggest: 15,              // suggested table time: show end + 15 min
    bigParty: 8,                  // Fridays and Saturdays: more than this, please call
    maxGuests: 20,
    phone: '020 7437 8261',
    tel: 'tel:+442074378261',
    walkTheatre: 'Prince Edward Theatre'
  };

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var toMin = function (t) { var p = String(t).split(':'); return (+p[0]) * 60 + (+p[1]); };
  var hhmm = function (m) { m = ((m % 1440) + 1440) % 1440; return pad(Math.floor(m / 60)) + ':' + pad(m % 60); };
  var fmt = function (m) {
    m = ((m % 1440) + 1440) % 1440;
    var h = Math.floor(m / 60), mm = m % 60, ap = h >= 12 ? 'PM' : 'AM';
    return ((h % 12) || 12) + ':' + pad(mm) + ' ' + ap;
  };
  var dayOf = function (iso) { return new Date(iso + 'T12:00:00').getDay(); };
  var longDate = function (iso) {
    return new Date(iso + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };
  var todayISO = function () { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  function lastSeating(iso) {
    var c = toMin(CFG.close[dayOf(iso)]);
    if (c <= toMin(CFG.open)) c += 1440;
    return c - CFG.lastSeatingBeforeClose;
  }
  function fillTimes(sel) {
    var from = toMin(sel.dataset.from), to = toMin(sel.dataset.to), step = +sel.dataset.step || 15;
    var html = '<option value="">' + esc(sel.dataset.placeholder || 'Select time') + '</option>';
    for (var m = from; m <= to; m += step) html += '<option value="' + hhmm(m) + '">' + fmt(m) + '</option>';
    sel.innerHTML = html;
  }
  function setOptions(sel, mins, chosen) {
    sel.innerHTML = mins.map(function (m) { return '<option value="' + hhmm(m) + '"' + (m === chosen ? ' selected' : '') + '>' + fmt(m) + '</option>'; }).join('');
  }

  function Wizard(root) {
    this.root = root;
    this.type = root.dataset.wizard;
    this.form = $('form', root);
    this.steps = $$('.wz-step', root);
    this.dots = $$('.wz-steps li', root);
    this.status = $('.f-status', root);
    this.btnPrev = $('[data-prev]', root);
    this.btnNext = $('[data-next]', root);
    this.btnSubmit = $('[data-submit]', root);
    this.i = 0;
    this.slotsLive = false;
    var self = this;
    $$('select[data-times]', root).forEach(fillTimes);
    $$('input[data-min-today]', root).forEach(function (i) { i.min = todayISO(); });
    this.btnNext.addEventListener('click', function () { self.next(); });
    this.btnPrev.addEventListener('click', function () { self.go(self.i - 1); });
    this.form.addEventListener('submit', function (e) { e.preventDefault(); self.i === 3 ? self.submit() : self.next(); });
    this.form.addEventListener('change', function () { if (self.i === 1) self.callRule(); });
    this.form.addEventListener('input', function () { self.status.textContent = ''; self.status.className = 'f-status'; });
    if (this.type === 'pre') {
      $('[name=showDate]', root).addEventListener('change', function () { var d = $('[name=date]', root); if (!d.dataset.touched) d.value = this.value; });
      $('[name=date]', root).addEventListener('change', function () { this.dataset.touched = '1'; });
    } else {
      $('[name=showEnd]', root).addEventListener('change', function () { self.suggest(); });
      $('[name=showDate]', root).addEventListener('change', function () { self.suggest(); });
    }
    this.go(0, true);
  }

  Wizard.prototype.val = function (n) { var el = $('[name="' + n + '"]', this.root); return el ? el.value.trim() : ''; };
  Wizard.prototype.fail = function (msg, el) {
    this.status.textContent = msg; this.status.className = 'f-status err';
    if (el) { el.setAttribute('aria-invalid', 'true'); el.focus(); }
  };
  Wizard.prototype.clearInvalid = function () { $$('[aria-invalid]', this.root).forEach(function (e) { e.removeAttribute('aria-invalid'); }); };
  Wizard.prototype.isPet = function () { return this.val('theatre') === CFG.walkTheatre; };
  Wizard.prototype.dateISO = function () { return this.val(this.type === 'pre' ? 'date' : 'showDate'); };

  /* ---- guest rules: 20+ and busy nights are phone bookings ---- */
  Wizard.prototype.callRule = function () {
    var box = $('[data-call]', this.steps[1]), g = this.val('guests'), iso = this.dateISO(), big = false, msg = '';
    if (/more than/i.test(g) || parseInt(g, 10) > CFG.maxGuests) { big = true; msg = 'For more than ' + CFG.maxGuests + ' guests'; }
    else if (iso && (dayOf(iso) === 5 || dayOf(iso) === 6) && parseInt(g, 10) > CFG.bigParty) { big = true; msg = 'On Fridays &amp; Saturdays, for bookings of more than ' + CFG.bigParty + ' persons'; }
    if (box) {
      box.hidden = !big;
      if (big) box.innerHTML = '<strong>' + msg + ' please call the restaurant:</strong> <a href="' + CFG.tel + '">' + CFG.phone + '</a> (after 4 PM).';
    }
    return big;
  };

  /* ---- step 2 setup ---- */
  Wizard.prototype.enterPre2 = function () {
    var show = toMin(this.val('showTime')), open = toMin(CFG.open);
    var recA = Math.max(open, show - CFG.preRecommend[0]), recB = Math.max(recA, show - CFG.preRecommend[1]);
    var last = Math.min(show - CFG.preLatest, lastSeating(this.val('showDate')));
    var opts = [];
    for (var m = open; m <= last; m += 15) opts.push(m);
    setOptions($('[name=arrival]', this.root), opts, recA);
    var d = $('[name=date]', this.root);
    if (!d.value) d.value = this.val('showDate');
    var walk = this.isPet() ? ' The restaurant is approximately a 2–3 minute walk from ' + CFG.walkTheatre + '.' : '';
    $('[data-rec]', this.root).innerHTML = 'Your show starts at <strong>' + fmt(show) + '</strong>. We recommend dining between <strong>' + fmt(recA) + '–' + fmt(recB) + '</strong>.' + walk;
    this.rec = [recA, recB];
  };
  Wizard.prototype.suggest = function () {
    var end = this.val('showEnd'), box = $('[data-suggest]', this.root);
    if (!end) { box.hidden = true; return; }
    var m = toMin(end) + CFG.postSuggest;
    box.hidden = false;
    box.innerHTML = 'Your show ends at <strong>' + fmt(toMin(end)) + '</strong>. We suggest a table at <strong>' + fmt(m) + '</strong>.';
  };
  Wizard.prototype.enterPost2 = function () {
    var end = toMin(this.val('showEnd')), last = lastSeating(this.val('showDate')), opts = [];
    for (var m = end; m <= Math.max(last, end); m += 15) opts.push(m);
    setOptions($('[name=time]', this.root), opts, Math.min(end + CFG.postSuggest, last));
  };

  /* ---- step 3: available tables ---- */
  Wizard.prototype.candidates = function () {
    var iso = this.dateISO(), last = lastSeating(iso), out = [], m;
    if (this.type === 'pre') {
      var show = toMin(this.val('showTime')), open = toMin(CFG.open);
      for (m = Math.max(open, show - CFG.preSlotRange[0]); m <= show - CFG.preSlotRange[1]; m += 15) out.push(m);
      var a = toMin(this.val('arrival'));
      if (out.indexOf(a) < 0) out.push(a);
    } else {
      var end = toMin(this.val('showEnd'));
      CFG.postOffsets.forEach(function (o) { out.push(end + o); });
      var t = toMin(this.val('time'));
      if (out.indexOf(t) < 0) out.push(t);
    }
    return out.filter(function (x) { return x <= last; }).sort(function (a, b) { return a - b; });
  };
  Wizard.prototype.enter3 = function () {
    var self = this, holder = $('[data-slots]', this.steps[2]), hint = $('[data-slot-hint]', this.steps[2]);
    var iso = this.dateISO(), guests = this.val('guests'), want = this.type === 'pre' ? this.val('arrival') : this.val('time');
    var cands = this.candidates();
    hint.textContent = guests + (guests === '1' ? ' guest' : ' guests') + ', ' + longDate(iso);
    holder.innerHTML = '<p class="slots-empty">Checking tables…</p>';
    var url = this.root.dataset.availability;
    var done = function (mins, live) {
      self.slotsLive = live;
      if (!mins.length) {
        holder.innerHTML = '<p class="slots-empty">We could not find a table time that fits. Please call us on <a href="' + CFG.tel + '">' + CFG.phone + '</a> (after 4 PM).</p>';
        return;
      }
      var recA = self.rec ? self.rec[0] : -1, recB = self.rec ? self.rec[1] : -1;
      holder.innerHTML = mins.map(function (m, k) {
        var tag = self.type === 'pre' && m >= recA && m <= recB ? '<small>Recommended</small>' : '';
        return '<label class="slot"><input type="radio" name="slot" value="' + hhmm(m) + '"' + (hhmm(m) === want ? ' checked' : '') + (k === 0 ? ' required' : '') + '><span>' + fmt(m) + tag + '</span></label>';
      }).join('');
      if (!$('input:checked', holder)) $('input', holder).checked = true;
    };
    if (!url) { done(cands, false); return; }
    fetch(url + (url.indexOf('?') < 0 ? '?' : '&') + 'type=' + this.type + '&date=' + encodeURIComponent(iso) + '&guests=' + encodeURIComponent(parseInt(guests, 10) || guests), { headers: { Accept: 'application/json' } })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (j) {
        var ok = (j.slots || []).map(toMin);
        done(cands.filter(function (m) { return ok.indexOf(m) >= 0; }), true);
      })
      .catch(function () { done(cands, false); });
  };

  /* ---- validation ---- */
  Wizard.prototype.validate = function (i) {
    this.clearInvalid();
    var step = this.steps[i], fields = $$('input, select, textarea', step), bad = null, k, f, v;
    for (k = 0; k < fields.length; k++) {
      f = fields[k]; v = f.value.trim();
      if (f.required && f.type !== 'radio' && !v) { bad = f; break; }
      if (f.type === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) { bad = f; break; }
      if (f.type === 'tel' && v && v.replace(/\D/g, '').length < 7) { bad = f; break; }
      if (f.type === 'date' && v && v < todayISO()) { bad = f; break; }
    }
    if (bad) { this.fail('Please complete the highlighted field' + (bad.type === 'email' ? ' with a valid email address.' : '.'), bad); return false; }
    if (i === 1 && this.callRule()) { this.fail('Please call us to book this party size.'); return false; }
    if (i === 2 && !$('input[name=slot]:checked', step)) { this.fail('Please choose a table time.'); return false; }
    return true;
  };

  /* ---- navigation ---- */
  Wizard.prototype.next = function () {
    if (!this.validate(this.i)) return;
    if (this.i === 0) { this.type === 'pre' ? this.enterPre2() : (this.suggest(), this.enterPost2()); }
    if (this.i === 1) this.enter3();
    this.go(this.i + 1);
  };
  Wizard.prototype.go = function (n, silent) {
    var self = this;
    this.i = Math.max(0, Math.min(n, this.steps.length - 1));
    this.steps.forEach(function (s, k) { s.hidden = k !== self.i; });
    this.dots.forEach(function (d, k) {
      d.classList.toggle('is-on', k === self.i);
      d.classList.toggle('is-done', k < self.i);
      k === self.i ? d.setAttribute('aria-current', 'step') : d.removeAttribute('aria-current');
    });
    var last = this.i === this.steps.length - 1, guest = this.i === 3;
    this.btnPrev.hidden = this.i === 0 || last;
    this.btnNext.hidden = guest || last;
    this.btnSubmit.hidden = !guest;
    $('.wz-nav', this.root).hidden = last;
    this.status.textContent = ''; this.status.className = 'f-status';
    if (this.i === 1) this.callRule();
    if (!silent) {
      var h = $('h3', this.steps[this.i]);
      if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
      this.root.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  /* ---- submit + confirmation ---- */
  Wizard.prototype.data = function () {
    var d = { type: this.type }, self = this;
    ['theatre', 'show', 'showDate', 'showTime', 'showEnd', 'guests', 'date', 'arrival', 'time', 'seating', 'name', 'email', 'phone', 'dietary', 'requests'].forEach(function (n) {
      var el = $('[name="' + n + '"]', self.root);
      if (el && el.value.trim()) d[n] = el.value.trim();
    });
    d.slot = ($('input[name=slot]:checked', this.root) || {}).value || '';
    d.tableDate = this.dateISO();
    return d;
  };
  Wizard.prototype.submit = function () {
    if (!this.validate(3)) return;
    var self = this, d = this.data(), url = this.root.dataset.endpoint;
    this.btnSubmit.disabled = true; this.status.textContent = 'Sending…';
    var finish = function (live) { self.confirm(d, live); };
    if (!url) { finish(false); return; }
    fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(d) })
      .then(function (r) { if (!r.ok) throw new Error(r.status); finish(true); })
      .catch(function () {
        self.btnSubmit.disabled = false;
        self.fail('Sorry, we could not send your booking. Please call us on ' + CFG.phone + ' (after 4 PM).');
      });
  };
  Wizard.prototype.confirm = function (d, live) {
    var pre = this.type === 'pre', tm = toMin(d.slot), rows = [];
    var row = function (k, v) { if (v) rows.push('<dt>' + k + '</dt><dd>' + esc(v) + '</dd>'); };
    if (pre) {
      row('Date', longDate(d.tableDate)); row('Time', fmt(tm)); row('Guests', d.guests); row('Theatre', d.theatre); row('Show', d.show);
      if (d.seating) row('Table', d.seating);
    } else {
      row('Show', [d.show, d.theatre].filter(Boolean).join(', ')); row('Show ends', fmt(toMin(d.showEnd))); row('Table time', fmt(tm));
      row('Date', longDate(d.tableDate)); row('Guests', d.guests);
    }
    var walk = pre && d.theatre === CFG.walkTheatre ? '<small>Approx. 2–3 minutes from the theatre</small>' : '';
    var tick = '<svg viewBox="0 0 256 256" aria-hidden="true"><path fill="currentColor" d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z"/></svg>';
    var preview = live ? '' : '<p class="wz-note wz-note--warn"><strong>Preview only.</strong> The booking service is not connected yet, so nothing was sent. Set <code>data-endpoint</code> on this booking form to connect it.</p>';
    var el = this.steps[4];
    el.innerHTML = '<span class="tick">' + tick + '</span><h3 tabindex="-1">Your ' + (pre ? 'Pre' : 'Post') + '-Theatre Table is Reserved</h3>' +
      '<dl class="wz-sum">' + rows.join('') + '</dl>' +
      '<p class="wz-addr"><strong>The Delhi Brasserie</strong><br>44 Frith Street, Soho' + walk + '</p>' +
      '<p>A confirmation will be sent to you by email or SMS.</p>' + preview;
    this.btnSubmit.disabled = false;
    this.go(4);
  };

  /* ---- tabs: pre / post ---- */
  function initTabs(scope) {
    var tabs = $$('[data-tab]', scope), panels = tabs.map(function (t) { return document.getElementById(t.dataset.tab); });
    function show(k, focus) {
      tabs.forEach(function (t, j) { t.setAttribute('aria-selected', j === k ? 'true' : 'false'); t.tabIndex = j === k ? 0 : -1; if (panels[j]) panels[j].hidden = j !== k; });
      if (focus) tabs[k].focus();
    }
    tabs.forEach(function (t, k) {
      t.addEventListener('click', function () { show(k); history.replaceState(null, '', '#' + t.dataset.tab); });
      t.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); show((k + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length, true); }
      });
    });
    var start = tabs.map(function (t) { return t.dataset.tab; }).indexOf(location.hash.slice(1));
    show(start >= 0 ? start : 0);
  }

  var scope = document.querySelector('[data-booking]');
  if (!scope) return;
  $$('[data-wizard]', scope).forEach(function (r) { new Wizard(r); });
  initTabs(scope);
})();
