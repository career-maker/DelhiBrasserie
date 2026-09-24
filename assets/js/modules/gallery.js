/* Gallery lightbox: native <dialog>, arrow keys, swipe, focus returns to the photo you opened. */
(function () {
  'use strict';
  var items = Array.prototype.slice.call(document.querySelectorAll('[data-gallery] [data-lightbox]'));
  if (!items.length || typeof HTMLDialogElement === 'undefined') return;

  var icon = function (id) { return '<svg class="ic" aria-hidden="true"><use href="#' + id + '"/></svg>'; };
  var dlg = document.createElement('dialog');
  dlg.className = 'lb';
  dlg.setAttribute('aria-label', 'Photo viewer');
  dlg.innerHTML =
    '<div class="lb-stage"><img alt="">' +
    '<button class="lb-close" type="button" aria-label="Close">' + icon('i-close') + '</button>' +
    '<button class="lb-prev" type="button" aria-label="Previous photo">' + icon('i-arrow') + '</button>' +
    '<button class="lb-next" type="button" aria-label="Next photo">' + icon('i-arrow') + '</button></div>' +
    '<div class="lb-bar" aria-live="polite"></div>';
  document.body.appendChild(dlg);

  var img = dlg.querySelector('img'), bar = dlg.querySelector('.lb-bar'), cur = 0, opener = null;

  function show(n) {
    cur = (n + items.length) % items.length;
    var a = items[cur], t = a.querySelector('img');
    img.src = a.href;
    img.alt = t ? t.alt : '';
    bar.textContent = (cur + 1) + ' / ' + items.length;
    var pre = new Image(); pre.src = items[(cur + 1) % items.length].href;
  }
  function open(n) { opener = items[n]; show(n); if (!dlg.open) dlg.showModal(); }
  function close() { dlg.close(); }

  items.forEach(function (a, n) { a.addEventListener('click', function (e) { e.preventDefault(); open(n); }); });
  dlg.querySelector('.lb-close').addEventListener('click', close);
  dlg.querySelector('.lb-prev').addEventListener('click', function () { show(cur - 1); });
  dlg.querySelector('.lb-next').addEventListener('click', function () { show(cur + 1); });
  dlg.addEventListener('click', function (e) { if (e.target === dlg || e.target.classList.contains('lb-stage')) close(); });
  dlg.addEventListener('close', function () { if (opener) opener.focus(); });
  dlg.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') show(cur - 1);
    if (e.key === 'ArrowRight') show(cur + 1);
  });
  var x0 = null;
  dlg.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  dlg.addEventListener('touchend', function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 50) show(cur + (dx < 0 ? 1 : -1));
  }, { passive: true });
})();
