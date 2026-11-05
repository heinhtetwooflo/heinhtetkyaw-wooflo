(() => {
  const logo = document.getElementById('logo');
  if (!logo) return;

  const controlGroup = document.getElementById('mobile-control-group');
  const topControls = document.getElementById('top-controls');
  const utilityControls = document.getElementById('mobile-utility-controls');
  const fullscreenToggle = document.getElementById('fullscreen-toggle');
  const clearStickers = document.getElementById('clear-stickers');
  const mobileViewport = window.matchMedia('(max-width: 600px)');

  if (controlGroup && topControls && utilityControls && fullscreenToggle && clearStickers) {
    const placeUtilityControls = event => {
      if (event.matches) {
        utilityControls.append(fullscreenToggle, clearStickers);
      } else {
        controlGroup.insertBefore(fullscreenToggle, topControls);
        controlGroup.append(clearStickers);
      }
    };

    placeUtilityControls(mobileViewport);
    mobileViewport.addEventListener('change', placeUtilityControls);
  }

  const homePaths = new Set(['/', '/index.html']);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let navigationPending = false;
  const isHome = homePaths.has(window.location.pathname);
  const whenFontsReady = callback => {
    const root = document.documentElement;
    if (!root.classList.contains('fonts-pending')) {
      callback();
      return;
    }

    const observer = new MutationObserver(() => {
      if (root.classList.contains('fonts-pending')) return;
      observer.disconnect();
      callback();
    });
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
  };

  if (document.documentElement.classList.contains('nav-page-arrival')) {
    const finishReveal = event => {
      if (event.animationName !== 'nav-page-reveal') return;
      document.documentElement.classList.remove('nav-page-revealing');
      document.documentElement.classList.remove('nav-page-arrival');
      document.documentElement.classList.remove('nav-transition-active');
    };

    document.documentElement.addEventListener('animationend', finishReveal);
    const revealPage = () => whenFontsReady(() => {
      if (reducedMotion.matches) {
        document.documentElement.classList.remove('nav-page-arrival');
        document.documentElement.classList.remove('nav-transition-active');
        return;
      }
      window.requestAnimationFrame(() => document.documentElement.classList.add('nav-page-revealing'));
    });
    if (document.readyState === 'complete') revealPage();
    else window.addEventListener('load', revealPage, { once: true });
  }

  if (isHome && document.documentElement.classList.contains('nav-home-return')) {
    const finishReveal = event => {
      if (event.animationName !== 'nav-home-reveal') return;
      document.body.classList.remove('nav-home-reveal');
      document.documentElement.classList.remove('nav-home-return');
      document.documentElement.classList.remove('nav-transition-active');
    };

    document.body.addEventListener('animationend', finishReveal);
    const revealHome = () => whenFontsReady(() => {
      if (reducedMotion.matches) {
        document.documentElement.classList.remove('nav-home-return');
        document.documentElement.classList.remove('nav-transition-active');
        return;
      }
      document.body.classList.add('nav-home-reveal');
    });
    if (document.readyState === 'complete') revealHome();
    else window.addEventListener('load', revealHome, { once: true });
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

    const currentPath = window.location.pathname.replace(/\/+$/, '') || '/';
    const destinationPath = destination.pathname.replace(/\/+$/, '') || '/';
    if (currentPath === destinationPath) return;

    const leavingHome = isHome;
    const headingHome = homePaths.has(destinationPath);
    if (leavingHome && headingHome) return;

    if (headingHome) {
      if (reducedMotion.matches) return;
      event.preventDefault();
      if (navigationPending) return;

      try {
        window.sessionStorage.setItem('hwf-home-return', String(Date.now()));
      } catch {
        window.location.assign(destination.href);
        return;
      }

      navigationPending = true;
      document.documentElement.classList.add('nav-transition-active');
      logo.classList.remove('open');
      logo.classList.add('nav-returning');
      document.body.classList.add('nav-return-cover');
      window.setTimeout(() => window.location.assign(destination.href), 460);
      return;
    }

    if (!leavingHome) {
      if (reducedMotion.matches) {
        window.location.assign(destination.href);
        return;
      }

      event.preventDefault();
      if (navigationPending) return;

      try {
        window.sessionStorage.setItem('hwf-page-arrival', `${destinationPath}|${Date.now()}`);
      } catch {
        window.location.assign(destination.href);
        return;
      }

      navigationPending = true;
      const targetColor = destinationPath === '/work' ? '#ffffff' : '#141413';
      document.documentElement.style.setProperty('--nav-page-target', targetColor);
      document.documentElement.classList.add('nav-transition-active');
      document.body.classList.add('nav-page-cover');
      window.setTimeout(() => window.location.assign(destination.href), 240);
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
    try {
      window.sessionStorage.setItem('hwf-page-arrival', `${destinationPath}|${Date.now()}`);
    } catch {
      window.location.assign(destination.href);
      return;
    }

    const targetColor = destinationPath === '/work' ? '#ffffff' : '#141413';
    document.documentElement.style.setProperty('--nav-page-target', targetColor);
    document.documentElement.classList.add('nav-transition-active');
    logo.classList.remove('open');
    logo.classList.add('nav-leaving');
    document.body.classList.add('nav-page-cover', 'nav-home-cover');
    window.setTimeout(() => window.location.assign(destination.href), 440);
  });
})();
