(() => {
  const logo = document.getElementById('logo');
  if (!logo) return;

  const homePaths = new Set(['/', '/index.html']);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let navigationPending = false;

  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link || event.defaultPrevented || event.button !== 0 ||
        event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
        (link.target && link.target !== '_self') || link.hasAttribute('download')) return;

    const destination = new URL(link.href, window.location.href);
    if (destination.origin !== window.location.origin) return;

    const leavingHome = homePaths.has(window.location.pathname);
    const headingHome = homePaths.has(destination.pathname);
    if (leavingHome === headingHome) return;
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
    logo.classList.add(leavingHome ? 'nav-leaving' : 'nav-leaving-home');
    logo.blur();
    window.setTimeout(() => window.location.assign(destination.href), leavingHome ? 620 : 440);
  });
})();
