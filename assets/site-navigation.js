(() => {
  const logo = document.getElementById('logo');
  if (!logo) return;

  const glyphTargets = {
    ch: 'M12.9989 238.313V0H67.3276V88.6591H68.3275Q87.9925 62.6613 118.99 62.6613Q146.654 62.6613 162.486 80.4931Q178.318 98.3249 178.318 127.322V238.313H123.989V138.322Q123.989 124.323 117.157 116.157Q110.324 107.991 97.325 107.991Q83.9928 107.991 75.6602 117.99Q67.3276 127.989 67.3276 143.988V238.313Z',
    cw: 'M354.306 238.313L301.977 67.6609H357.306L375.971 138.322L383.637 171.319H384.304Q388.303 151.654 391.97 137.322L409.968 67.6609H455.964L474.629 137.322L482.629 171.652H483.295Q487.628 151.987 491.295 138.322L510.293 67.6609H563.955L511.626 238.313H460.631L440.632 160.986L433.3 130.322H432.633Q428.633 147.654 424.967 160.986L404.635 238.313Z',
    cf: 'M648.964 238.313V102.325H626.966V67.6609H648.964V55.3286Q648.964 29.6641 662.963 15.6653Q683.295 -4.33296 735.29 0.999915V39.33Q717.959 38.6634 710.626 42.3297Q703.293 45.9961 703.293 59.3283V67.6609H735.29V102.325H703.293V238.313Z',
    dash: 'M239.817 238.313V182.318H296.812V238.313Z'
  };
  const logoGlyphs = [...logo.querySelectorAll('.cs.ch .g path, .cs.cw .g path, .cs.cf .g path, .sep .dash .g path')]
    .map(path => {
      const slot = path.closest('.cs, .dash');
      const name = ['ch', 'cw', 'cf', 'dash'].find(className => slot.classList.contains(className));
      return { path, target: glyphTargets[name], original: path.getAttribute('d') };
    })
    .filter(glyph => glyph.target);
  const hoverCapable = window.matchMedia('(hover:hover)').matches;
  const reduceLogoMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let morphFrame = 0;
  let morphOpen = false;

  const samplePath = (path, d, count) => {
    const previous = path.getAttribute('d');
    path.setAttribute('d', d);
    const length = path.getTotalLength();
    const points = Array.from({ length: count }, (_, index) => {
      const point = path.getPointAtLength(length * index / count);
      return [point.x, point.y];
    });
    path.setAttribute('d', previous);
    return points;
  };

  const alignPathSamples = (from, to) => {
    let bestScore = Infinity;
    let bestOffset = 0;
    let bestReverse = false;
    const count = from.length;
    for (const reverse of [false, true]) {
      for (let offset = 0; offset < count; offset++) {
        let score = 0;
        for (let index = 0; index < count; index += 2) {
          const targetIndex = (offset + (reverse ? count - index : index)) % count;
          const dx = from[index][0] - to[targetIndex][0];
          const dy = from[index][1] - to[targetIndex][1];
          score += dx * dx + dy * dy;
        }
        if (score < bestScore) {
          bestScore = score;
          bestOffset = offset;
          bestReverse = reverse;
        }
      }
    }
    return from.map((_, index) => to[(bestOffset + (bestReverse ? count - index : index)) % count]);
  };

  const pathFromPoints = points => `M${points.map(point => `${point[0].toFixed(2)} ${point[1].toFixed(2)}`).join('L')}Z`;

  const morphLogoGlyphs = (open, instant = false) => {
    const frameId = ++morphFrame;
    if (instant) {
      logoGlyphs.forEach(({ path, target, original }) => {
        path.setAttribute('d', open ? target : original);
      });
      return;
    }
    const sampleCount = 144;
    const records = logoGlyphs.map(({ path, target, original }) => {
      const start = path.getAttribute('d');
      const end = open ? target : original;
      const from = samplePath(path, start, sampleCount);
      const to = alignPathSamples(from, samplePath(path, end, sampleCount));
      return { path, start, end, from, to };
    });

    if (reduceLogoMotion.matches) {
      records.forEach(({ path, end }) => path.setAttribute('d', end));
      return;
    }

    const startTime = performance.now();
    const duration = 420;
    const tick = now => {
      if (frameId !== morphFrame) return;
      const progress = Math.min(1, (now - startTime) / duration);
      const eased = 1 - (1 - progress) ** 3;
      records.forEach(({ path, start, end, from, to }) => {
        if (progress === 0) {
          path.setAttribute('d', start);
          return;
        }
        if (progress === 1) {
          path.setAttribute('d', end);
          return;
        }
        const points = from.map((point, index) => [
          point[0] + (to[index][0] - point[0]) * eased,
          point[1] + (to[index][1] - point[1]) * eased
        ]);
        path.setAttribute('d', pathFromPoints(points));
      });
      if (progress < 1) window.requestAnimationFrame(tick);
    };
    window.requestAnimationFrame(tick);
  };

  const syncLogoMorph = () => {
    window.requestAnimationFrame(() => {
      const root = document.documentElement;
      if (root.classList.contains('nav-home-returning') || root.classList.contains('nav-home-arrival')) {
        morphOpen = false;
        morphLogoGlyphs(false, true);
        return;
      }
      const forcedClosed = logo.classList.contains('nav-collapsing') || logo.classList.contains('nav-leaving') ||
        root.classList.contains('nav-home-arrival');
      const expanded = !forcedClosed && (logo.classList.contains('open') || logo.matches(':focus-visible') ||
        (hoverCapable && logo.matches(':hover')));
      if (expanded === morphOpen) return;
      morphOpen = expanded;
      morphLogoGlyphs(expanded);
    });
  };

  if (logoGlyphs.length) {
    const logoClassObserver = new MutationObserver(syncLogoMorph);
    logoClassObserver.observe(logo, { attributes: true, attributeFilter: ['class'] });
    logo.addEventListener('pointerenter', syncLogoMorph);
    logo.addEventListener('pointerleave', syncLogoMorph);
    logo.addEventListener('focusin', syncLogoMorph);
    logo.addEventListener('focusout', syncLogoMorph);
    syncLogoMorph();
  }

  const utilityControls = document.getElementById('mobile-utility-controls');
  const fullscreenToggle = document.getElementById('fullscreen-toggle');
  const clearStickers = document.getElementById('clear-stickers');

  if (utilityControls && fullscreenToggle && clearStickers) {
    utilityControls.append(fullscreenToggle, clearStickers);
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
    const root = document.documentElement;
    let homeCoverComplete = root.classList.contains('nav-home-cover-complete');
    let homeFontsReady = false;
    const revealHomeContent = () => {
      if (homeCoverComplete && homeFontsReady) root.classList.add('nav-home-revealing');
    };
    const completeHomeCover = () => {
      if (homeCoverComplete) return;
      homeCoverComplete = true;
      root.classList.add('nav-home-cover-complete');
      revealHomeContent();
    };
    const finishReveal = event => {
      if (event.animationName === 'nav-page-cover' && root.classList.contains('nav-home-arrival')) {
        completeHomeCover();
        return;
      }
      if (event.animationName !== 'nav-page-reveal' || !root.classList.contains('nav-page-arrival')) return;
      document.documentElement.classList.remove('nav-page-revealing');
      document.documentElement.classList.remove('nav-page-arrival');
      document.documentElement.classList.remove('nav-home-arrival', 'nav-home-returning', 'nav-home-scaling', 'nav-home-revealing', 'nav-home-cover-complete');
      document.documentElement.classList.remove('nav-transition-active');
    };

    document.documentElement.addEventListener('animationend', finishReveal);
    if (document.documentElement.classList.contains('nav-home-arrival')) {
      if (reducedMotion.matches) {
        root.classList.remove('nav-page-arrival', 'nav-home-arrival', 'nav-home-returning', 'nav-home-scaling', 'nav-home-revealing', 'nav-home-cover-complete', 'nav-transition-active');
      } else {
        window.requestAnimationFrame(() => root.classList.add('nav-home-scaling'));
        whenFontsReady(() => {
          homeFontsReady = true;
          revealHomeContent();
        });
        const remaining = parseFloat(getComputedStyle(root).getPropertyValue('--nav-home-cover-duration')) || 0;
        window.setTimeout(completeHomeCover, remaining + 80);
      }
    } else {
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
  }

  window.addEventListener('pageshow', event => {
    if (!event.persisted) return;
    navigationPending = false;
    document.documentElement.classList.remove('nav-page-arrival', 'nav-page-revealing', 'nav-home-arrival', 'nav-home-returning', 'nav-home-scaling', 'nav-home-revealing', 'nav-home-cover-complete', 'nav-transition-active');
    document.body.classList.remove('nav-page-cover', 'nav-home-cover');
    logo.classList.remove('nav-leaving', 'nav-collapsing');
  });

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

    const root = document.documentElement;
    if (root.classList.contains('nav-page-arrival')) {
      root.classList.remove('nav-page-arrival', 'nav-page-revealing', 'nav-home-arrival', 'nav-home-returning', 'nav-home-scaling', 'nav-home-revealing', 'nav-home-cover-complete', 'nav-transition-active');
    }

    if (headingHome) {
      if (navigationPending) {
        event.preventDefault();
        return;
      }
      if (reducedMotion.matches) return;

      event.preventDefault();
      try {
        window.sessionStorage.setItem('hwf-page-arrival', `${destinationPath}|${Date.now()}`);
      } catch {
        window.location.assign(destination.href);
        return;
      }

      navigationPending = true;
      document.documentElement.style.setProperty('--nav-page-target', '#141413');
      document.documentElement.classList.add('nav-transition-active', 'nav-home-returning');
      logo.classList.remove('open');
      logo.classList.add('nav-leaving', 'nav-collapsing');
      document.body.classList.add('nav-page-cover');
      window.setTimeout(() => window.location.assign(destination.href), 120);
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
      logo.classList.add('nav-leaving');
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
