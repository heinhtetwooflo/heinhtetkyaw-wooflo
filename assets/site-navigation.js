(() => {
  const logo = document.getElementById('logo');
  if (!logo) return;

  const homePaths = new Set(['/', '/index.html']);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let navigationPending = false;
  const isHome = homePaths.has(window.location.pathname);

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
      if (navigationPending) {
        event.preventDefault();
        return;
      }

      if (reducedMotion.matches) return;

      event.preventDefault();
      navigationPending = true;
      logo.classList.remove('open');
      logo.classList.add('nav-returning');
      window.setTimeout(() => window.location.assign(destination.href), 600);
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
