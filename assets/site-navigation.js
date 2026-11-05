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

})();
