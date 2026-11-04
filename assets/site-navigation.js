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
      logo.classList.add('nav-arrival-start');
      window.setTimeout(() => {
        logo.classList.remove('nav-arrival-start');
        logo.classList.add('nav-arriving');
        window.setTimeout(() => logo.classList.remove('nav-arriving'), 650);
      }, 120);
    }
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
