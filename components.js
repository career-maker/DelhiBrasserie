document.addEventListener("DOMContentLoaded", async () => {
  try {
    const headerResponse = await fetch("header.html");
    const headerHtml = await headerResponse.text();
    const headerPlaceholder = document.getElementById("header-placeholder");
    if (headerPlaceholder) {
        headerPlaceholder.innerHTML = headerHtml;
    }

    const footerResponse = await fetch("footer.html");
    const footerHtml = await footerResponse.text();
    const footerPlaceholder = document.getElementById("footer-placeholder");
    if (footerPlaceholder) {
        footerPlaceholder.innerHTML = footerHtml;
    }

  } catch (err) {
    console.error("Failed to load components", err);
  } finally {
    initActiveLinks();
    initHeaderScroll();
    initHamburger();
    initFooterAccordion();
    initReveal();
  }
});

function initActiveLinks() {
  const currentPath = window.location.pathname.split("/").pop() || "index.html";
  const navLinks = document.querySelectorAll("nav a, .drawer-nav a");
  navLinks.forEach(link => {
    if (link.getAttribute("href") === currentPath) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
}

function initHeaderScroll() {
  var header = document.querySelector('header');
  var hero = document.querySelector('.hero');
  if(!header) return;
  
  var forceSticky = document.body.classList.contains('force-sticky-header');
  if (forceSticky) {
    header.classList.add('scrolled');
  }
  
  var lastY = window.scrollY;
  function onScroll() {
    var y = window.scrollY;
    var threshold = hero ? hero.offsetHeight - 80 : 200;
    
    if (forceSticky) {
       header.classList.add('scrolled');
       if (y > lastY + 4 && y > 100) { header.classList.add('hide'); }
       else if (y < lastY - 4) { header.classList.remove('hide'); }
    } else {
      if (y > threshold) {
        header.classList.add('scrolled');
        if (y > lastY + 4) { header.classList.add('hide'); }
        else if (y < lastY - 4) { header.classList.remove('hide'); }
      } else {
        header.classList.remove('scrolled');
        header.classList.remove('hide');
      }
    }
    lastY = y;
  }
  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();
}

function initHamburger() {
  var btn = document.getElementById('hamburgerBtn');
  var drawer = document.getElementById('mobileDrawer');
  var backdrop = document.getElementById('drawerBackdrop');
  var closeBtn = document.getElementById('drawerClose');
  if(!btn || !drawer || !backdrop) return;
  
  var links = drawer.querySelectorAll('a');
  function open() {
    drawer.classList.add('open');
    backdrop.classList.add('open');
    document.body.classList.add('drawer-open');
    btn.setAttribute('aria-expanded', 'true');
  }
  function close() {
    drawer.classList.remove('open');
    backdrop.classList.remove('open');
    document.body.classList.remove('drawer-open');
    btn.setAttribute('aria-expanded', 'false');
  }
  btn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  backdrop.addEventListener('click', close);
  links.forEach(function (a) { a.addEventListener('click', close); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
}

function initFooterAccordion() {
  document.querySelectorAll('.footer-accordion h3').forEach(function (h3) {
    h3.addEventListener('click', function () {
      h3.closest('.footer-accordion').classList.toggle('open');
    });
  });
}

function initReveal() {
  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length === 0) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
  reveals.forEach(r => observer.observe(r));
}
