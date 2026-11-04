(() => {
  const logo = document.getElementById('logo');
  if (!logo) return;

  const homePaths = new Set(['/', '/index.html']);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let navigationPending = false;
  const isHome = homePaths.has(window.location.pathname);

  if (isHome) {
    const arrivalTime = Number(window.sessionStorage.getItem('home-logo-arrival'));
    window.sessionStorage.removeItem('home-logo-arrival');
    if (arrivalTime > 0 && Date.now() - arrivalTime < 30000 && !reducedMotion.matches) {
      logo.classList.add('nav-arriving-home');
      const startArrival = () => window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => logo.classList.remove('nav-arriving-home'));
      });
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startArrival, { once: true });
      } else {
        startArrival();
      }
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
        window.sessionStorage.setItem('home-logo-arrival', String(Date.now()));
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
    logo.classList.add(headingHome ? 'nav-leaving-home' : 'nav-leaving');
    window.setTimeout(() => window.location.assign(destination.href), 440);
  });
})();
