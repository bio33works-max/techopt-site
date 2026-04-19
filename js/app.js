/* ── MOBILE MENU ──────────────────────────────────────────────── */
(function () {
  const toggle = document.getElementById('navToggle');
  const overlay = document.getElementById('navOverlay');
  if (!toggle || !overlay) return;

  toggle.addEventListener('click', function () {
    const isOpen = document.body.classList.toggle('nav-open');
    toggle.setAttribute('aria-expanded', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Close on overlay link click
  overlay.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') {
      document.body.classList.remove('nav-open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  });

  // Close on ESC
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && document.body.classList.contains('nav-open')) {
      document.body.classList.remove('nav-open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  });
})();

/* ── BACK TO TOP ──────────────────────────────────────────────── */
(function () {
  const btn = document.getElementById('backToTop');
  if (!btn) return;

  window.addEventListener('scroll', function () {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });

  btn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();

/* ── COOKIE BANNER ────────────────────────────────────────────── */
function acceptCookies() {
  localStorage.setItem('cookie_ok', '1');
  const banner = document.getElementById('cookieBanner');
  if (banner) {
    banner.style.transform = 'translateY(120%)';
    setTimeout(function () { banner.style.display = 'none'; }, 400);
  }
}

(function () {
  if (localStorage.getItem('cookie_ok')) return;
  const banner = document.getElementById('cookieBanner');
  if (banner) {
    setTimeout(function () { banner.classList.add('visible'); }, 800);
  }
})();
