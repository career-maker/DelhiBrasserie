/* Contact, feedback and reservation forms.
 *
 * Each <form data-form="contact|feedback|reservation" data-endpoint="URL"> does the same thing:
 *   - validates required fields, e-mail and phone
 *   - with data-endpoint set: POSTs the fields as JSON and shows the reply
 *   - without an endpoint: opens the visitor's e-mail app with the message filled in (mailto),
 *     so the form still works on plain static hosting.
 * Point data-endpoint at Brevo, Formspree, ReDi or your own handler when ready.
 */
(function () {
  'use strict';
  var TO = 'info@delhibrasserie.com';
  var SUBJECT = { contact: 'Website enquiry', feedback: 'Customer feedback', reservation: 'Table booking request' };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };

  /* reservation: today as the earliest date, time list follows opening hours (Fri/Sat open until midnight) */
  var res = document.querySelector('form[data-form=reservation]');
  if (res) {
    var d = res.querySelector('[name=date]'), t = res.querySelector('[name=time]');
    var now = new Date();
    d.min = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
    var fill = function () {
      var wd = d.value ? new Date(d.value + 'T12:00:00').getDay() : -1, last = (wd === 5 || wd === 6) ? 23 * 60 + 30 : 23 * 60;
      var html = '<option value="">Select time</option>';
      for (var m = 17 * 60; m <= last; m += 15) {
        var h = Math.floor(m / 60), mm = m % 60;
        html += '<option value="' + pad(h) + ':' + pad(mm) + '">' + ((h % 12) || 12) + ':' + pad(mm) + ' ' + (h >= 12 ? 'PM' : 'AM') + '</option>';
      }
      t.innerHTML = html;
    };
    d.addEventListener('change', fill);
    fill();
  }

  $$('form[data-form]').forEach(function (form) {
    var kind = form.dataset.form, status = form.querySelector('.f-status');
    var say = function (msg, cls) { status.textContent = msg; status.className = 'f-status' + (cls ? ' ' + cls : ''); };

    form.addEventListener('input', function (e) { if (e.target.removeAttribute) e.target.removeAttribute('aria-invalid'); });
    form.addEventListener('reset', function () { say(''); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = null;
      $$('input, select, textarea', form).forEach(function (f) {
        f.removeAttribute('aria-invalid');
        var v = (f.value || '').trim();
        var wrong = (f.required && !v) ||
          (f.type === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) ||
          (f.type === 'tel' && v && v.replace(/\D/g, '').length < 7);
        if (wrong) { f.setAttribute('aria-invalid', 'true'); if (!bad) bad = f; }
      });
      if (bad) { say('Please complete the highlighted fields.', 'err'); bad.focus(); return; }

      var data = {}, lines = [];
      $$('input, select, textarea', form).forEach(function (f) {
        if (!f.name || f.type === 'submit' || f.type === 'reset') return;
        if ((f.type === 'radio' || f.type === 'checkbox') && !f.checked) return;
        if (f.value === '') return;
        data[f.name] = f.value;
        var label = form.querySelector('label[for="' + f.id + '"]');
        var name = label ? label.textContent.replace(/[*:]+$/, '') : (f.closest('fieldset') ? f.closest('fieldset').querySelector('legend').textContent : f.name);
        lines.push(name + ': ' + f.value);
      });

      var url = form.dataset.endpoint;
      if (!url) {
        window.location.href = 'mailto:' + TO + '?subject=' + encodeURIComponent(SUBJECT[kind] || 'Website form') + '&body=' + encodeURIComponent(lines.join('\n'));
        say('Your email app should open with your message ready to send. If it does not, email ' + TO + ' or call 020 7437 8261.', 'ok');
        return;
      }
      say('Sending…');
      fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) })
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r; })
        .then(function () { form.reset(); say('Thank you. Your message has been sent.', 'ok'); })
        .catch(function () { say('Sorry, that did not send. Please email ' + TO + ' or call 020 7437 8261.', 'err'); });
    });
  });
})();
