/* Menu pages: Tabbed category navigation for Food and Drinks menus.
   Replaces downward scrolling with discrete tab panel switching. */
(function () {
  'use strict';

  var nav = document.querySelector('.menu-nav-in');
  if (!nav) return;

  var links = Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]'));
  if (!links.length) return;

  var tabs = [];
  var wineIntro = document.getElementById('wine');
  var wineIntroProse = wineIntro ? wineIntro.nextElementSibling : null;
  var wineTabIds = ['french-house-wine', 'white-wine', 'rose-wine', 'red-wine', 'champagne'];

  links.forEach(function (link, index) {
    var id = link.getAttribute('href').slice(1);
    var panel = document.getElementById(id);
    if (!panel) return;

    link.setAttribute('role', 'tab');
    link.id = 'tab-' + id;
    link.setAttribute('aria-controls', id);
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', link.id);

    tabs.push({
      id: id,
      link: link,
      panel: panel,
      index: index
    });
  });

  if (!tabs.length) return;

  function getTabById(id) {
    for (var i = 0; i < tabs.length; i++) {
      if (tabs[i].id === id) return tabs[i];
    }
    return null;
  }

  function activateTab(targetId, updateHash, shouldScroll) {
    // Alias redirects or section headers
    if (targetId === 'wine') targetId = 'french-house-wine';
    if (targetId === 'desserts-menu') targetId = 'desserts';

    var active = getTabById(targetId) || tabs[0];

    for (var i = 0; i < tabs.length; i++) {
      var t = tabs[i];
      var isCurrent = (t === active);
      t.link.classList.toggle('on', isCurrent);
      t.link.setAttribute('aria-selected', isCurrent ? 'true' : 'false');
      t.link.setAttribute('tabindex', isCurrent ? '0' : '-1');

      t.panel.classList.toggle('is-active', isCurrent);
      if (isCurrent) {
        t.panel.removeAttribute('hidden');
        // Ensure reveal items inside this panel are fully visible
        var reveals = t.panel.querySelectorAll('.reveal, .reveal-mask');
        reveals.forEach(function (r) { r.classList.add('in-view'); });
      } else {
        t.panel.setAttribute('hidden', '');
      }
    }

    // On drinks menu: display wine intro heading/prose if a wine tab is active
    if (wineIntro && wineIntroProse) {
      var isWine = wineTabIds.indexOf(active.id) !== -1;
      wineIntro.style.display = isWine ? '' : 'none';
      wineIntroProse.style.display = isWine ? '' : 'none';
      if (isWine) {
        wineIntro.classList.add('in-view');
        wineIntroProse.classList.add('in-view');
      }
    }

    // Keep active tab chip visible in scrollable nav
    if (nav.scrollWidth > nav.clientWidth) {
      nav.scrollTo({
        left: active.link.offsetLeft - (nav.clientWidth / 2) + (active.link.clientWidth / 2),
        behavior: 'smooth'
      });
    }

    // Scroll positioning:
    // If the user has scrolled past the menu navigation bar, scroll up smoothly
    if (shouldScroll) {
      var menuNav = nav.closest('.menu-nav');
      if (menuNav) {
        var rect = menuNav.getBoundingClientRect();
        if (rect.top < 0) {
          var y = window.pageYOffset + rect.top - 10;
          window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
        }
      }
    }

    // Update URL hash without disorienting jump
    if (updateHash && window.history && window.history.replaceState) {
      window.history.replaceState(null, '', '#' + active.id);
    }
  }

  // Click handler
  tabs.forEach(function (t) {
    t.link.addEventListener('click', function (e) {
      e.preventDefault();
      activateTab(t.id, true, true);
    });
  });

  // Keyboard navigation
  nav.setAttribute('role', 'tablist');
  nav.addEventListener('keydown', function (e) {
    var cur = null;
    for (var i = 0; i < tabs.length; i++) {
      if (tabs[i].link === document.activeElement) {
        cur = tabs[i];
        break;
      }
    }
    if (!cur) return;

    var newIndex = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      newIndex = (cur.index + 1) % tabs.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      newIndex = (cur.index - 1 + tabs.length) % tabs.length;
    } else if (e.key === 'Home') {
      newIndex = 0;
    } else if (e.key === 'End') {
      newIndex = tabs.length - 1;
    }

    if (newIndex >= 0) {
      e.preventDefault();
      tabs[newIndex].link.focus();
      activateTab(tabs[newIndex].id, true, false);
    }
  });

  // Handle hash changes (back/forward or external links)
  window.addEventListener('hashchange', function () {
    var hash = window.location.hash.slice(1);
    if (hash) activateTab(hash, false, true);
  });

  // Initial activation
  var initHash = window.location.hash.slice(1);
  activateTab(initHash, false, false);
})();
