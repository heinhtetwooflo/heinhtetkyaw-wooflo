(() => {
  const logo = document.getElementById('logo');
  if (!logo) return;

  const homePaths = new Set(['/', '/index.html']);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let navigationPending = false;
  const isHome = homePaths.has(window.location.pathname);

  if (isHome && window.sessionStorage.getItem('home-logo-arrival') === '1') {
    window.sessionStorage.removeItem('home-logo-arrival');
    if (!reducedMotion.matches) {
      logo.animate([
        { transform: 'translate(-50%, -50%) scale(.84)', opacity: .8 },
        { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 }
      ], { duration: 360, easing: 'cubic-bezier(.2,.7,.25,1)' });
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
      window.sessionStorage.setItem('home-logo-arrival', '1');
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
