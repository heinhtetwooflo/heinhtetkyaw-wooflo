(() => {
  const logo = document.getElementById('logo');
  if (!logo) return;

  const homePaths = new Set(['/', '/index.html']);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let navigationPending = false;
  const isHome = homePaths.has(window.location.pathname);

  if (isHome) {
    let returningHome = false;
    try {
      returningHome = sessionStorage.getItem('hwf-return-home') === '1';
      sessionStorage.removeItem('hwf-return-home');
    } catch {}

    if (returningHome && !reducedMotion.matches) {
      logo.classList.add('nav-home-arriving');
      window.setTimeout(() => logo.classList.remove('nav-home-arriving'), 700);
    }
  }

  let pressTimer = 0;
  let pressPointerId = null;
  let pressStartX = 0;
  let pressStartY = 0;
  let longPressTriggered = false;
  let suppressLogoClick = false;

  if (logo.classList.contains('logo-compact')) {
    logo.addEventListener('pointerdown', event => {
      if (event.pointerType !== 'touch' || event.button !== 0) return;
      clearTimeout(pressTimer);
      pressPointerId = event.pointerId;
      pressStartX = event.clientX;
      pressStartY = event.clientY;
      longPressTriggered = false;
      pressTimer = window.setTimeout(() => {
        longPressTriggered = true;
        logo.classList.add('open');
      }, 420);
    });

    window.addEventListener('pointermove', event => {
      if (event.pointerId !== pressPointerId || !pressTimer) return;
      if (Math.hypot(event.clientX - pressStartX, event.clientY - pressStartY) > 8) {
        clearTimeout(pressTimer);
        pressTimer = 0;
      }
    }, { passive: true });

    window.addEventListener('pointerup', event => {
      if (event.pointerId !== pressPointerId) return;
      clearTimeout(pressTimer);
      pressTimer = 0;
      pressPointerId = null;
      if (longPressTriggered) {
        logo.classList.remove('open');
        suppressLogoClick = true;
        window.setTimeout(() => { suppressLogoClick = false; }, 500);
      }
    });

    window.addEventListener('pointercancel', event => {
      if (event.pointerId !== pressPointerId) return;
      clearTimeout(pressTimer);
      pressTimer = 0;
      pressPointerId = null;
      longPressTriggered = false;
      logo.classList.remove('open');
    });

    logo.addEventListener('click', event => {
      if (!suppressLogoClick) return;
      event.preventDefault();
      event.stopPropagation();
      suppressLogoClick = false;
    });
  }

  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link || event.defaultPrevented || event.button !== 0 ||
        event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
        (link.target && link.target !== '_self') || link.hasAttribute('download')) return;

    const destination = new URL(link.href, window.location.href);
    if (destination.origin !== window.location.origin) return;

    const leavingHome = isHome;
    const headingHome = homePaths.has(destination.pathname);
    if (leavingHome === headingHome) return;

    if (headingHome) {
      if (!reducedMotion.matches) {
        try { sessionStorage.setItem('hwf-return-home', '1'); } catch {}
      }
      return;
    }

    if (navigationPending) {
      event.preventDefault();
      return;
    }

    event.preventDefault();
    if (reducedMotion.matches) {
      window.location.assign(destination.href);
      return;
    }

    navigationPending = true;
    logo.classList.remove('open');
    logo.classList.add('nav-leaving');
    window.setTimeout(() => window.location.assign(destination.href), 440);
  });
})();
