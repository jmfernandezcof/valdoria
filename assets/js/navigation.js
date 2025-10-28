document.addEventListener('DOMContentLoaded', () => {
  const mobileViewportQuery = window.matchMedia('(max-width: 960px)');
  const isMobileViewport = () => mobileViewportQuery.matches;

  let navControls = [];

  const disclaimerElement = document.querySelector('[data-disclaimer]');
  const disclaimerStorageKey = 'valdoriaDisclaimerSeen';

  if (disclaimerElement) {
    const video = disclaimerElement.querySelector('video');
    const skipButton = disclaimerElement.querySelector('[data-disclaimer-skip]');
    const audioButton = disclaimerElement.querySelector('[data-disclaimer-audio]');
    let keydownHandler = null;
    let videoEndedHandler = null;
    let audioClickHandler = null;
    let audioEnabled = false;
    let audioUnlockHandler = null;

    const updateAudioButtonLabel = () => {
      if (!audioButton) {
        return;
      }
      audioButton.textContent = audioEnabled ? 'Silenciar sonido' : 'Activar sonido';
      audioButton.setAttribute('aria-pressed', String(audioEnabled));
    };

    const removeAudioUnlockHandler = () => {
      if (!audioUnlockHandler) {
        return;
      }
      window.removeEventListener('pointerdown', audioUnlockHandler);
      window.removeEventListener('keydown', audioUnlockHandler);
      audioUnlockHandler = null;
    };

    const registerAudioUnlockHandler = () => {
      if (audioUnlockHandler) {
        return;
      }
      audioUnlockHandler = (event) => {
        if (event.type === 'keydown' && event.key !== 'Enter' && event.key !== ' ') {
          return;
        }
        removeAudioUnlockHandler();
        enableVideoSound(true);
      };
      window.addEventListener('pointerdown', audioUnlockHandler);
      window.addEventListener('keydown', audioUnlockHandler);
    };

    const muteVideo = (pausePlayback = false) => {
      if (!video) {
        return;
      }
      video.muted = true;
      video.defaultMuted = true;
      video.setAttribute('muted', '');
      if (pausePlayback) {
        video.pause();
        video.currentTime = 0;
      }
      audioEnabled = false;
      updateAudioButtonLabel();
    };

    const enableVideoSound = (resetPlayback = false) => {
      if (!video) {
        return Promise.resolve(false);
      }

      video.defaultMuted = false;
      video.removeAttribute('muted');
      video.muted = false;
      video.volume = 1;
      if (resetPlayback) {
        video.currentTime = 0;
      }

      const playPromise = video.play();
      if (playPromise && typeof playPromise.then === 'function') {
        return playPromise
          .then(() => {
            audioEnabled = true;
            updateAudioButtonLabel();
            removeAudioUnlockHandler();
            return true;
          })
          .catch(() => {
            muteVideo(true);
            registerAudioUnlockHandler();
            return false;
          });
      }

      audioEnabled = !video.muted;
      updateAudioButtonLabel();
      return Promise.resolve(audioEnabled);
    };

    const closeDisclaimer = () => {
      disclaimerElement.classList.add('disclaimer--hidden');
      disclaimerElement.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('disclaimer-open');
      sessionStorage.setItem(disclaimerStorageKey, 'acknowledged');

      if (keydownHandler) {
        document.removeEventListener('keydown', keydownHandler);
        keydownHandler = null;
      }
      if (video && videoEndedHandler) {
        video.removeEventListener('ended', videoEndedHandler);
        videoEndedHandler = null;
      }
      if (audioButton && audioClickHandler) {
        audioButton.removeEventListener('click', audioClickHandler);
        audioClickHandler = null;
      }
      removeAudioUnlockHandler();
      audioEnabled = false;

      window.setTimeout(() => {
        if (video) {
          video.pause();
        }
        disclaimerElement.remove();
      }, 400);
    };

    const showDisclaimer = () => {
      disclaimerElement.setAttribute('aria-hidden', 'false');
      document.body.classList.add('disclaimer-open');
      audioEnabled = false;
      updateAudioButtonLabel();
      if (video) {
        videoEndedHandler = () => closeDisclaimer();
        video.addEventListener('ended', videoEndedHandler, { once: true });
      }
      if (skipButton) {
        skipButton.addEventListener('click', closeDisclaimer, { once: true });
      }
      if (audioButton && video) {
        audioClickHandler = () => {
          if (audioEnabled) {
            muteVideo(false);
          } else {
            enableVideoSound(false);
          }
        };
        audioButton.addEventListener('click', audioClickHandler);
      }
      if (video) {
        enableVideoSound(true);
      }
      keydownHandler = (event) => {
        if (event.key === 'Escape') {
          closeDisclaimer();
        }
      };
      document.addEventListener('keydown', keydownHandler);
    };

    if (sessionStorage.getItem(disclaimerStorageKey)) {
      disclaimerElement.remove();
    } else {
      showDisclaimer();
    }
  }

  function updateBodyState() {
    const anyOpen = navControls.some(({ nav }) => nav.classList.contains('nav--open'));
    document.body.classList.toggle('menu-open', anyOpen);
  }

  navControls = Array.from(document.querySelectorAll('.nav'))
    .map((nav) => {
      const toggle = nav.querySelector('.nav__toggle');
      const menu = nav.querySelector('.nav__links');

      if (!toggle || !menu) {
        return null;
      }

      toggle.setAttribute('aria-expanded', toggle.getAttribute('aria-expanded') || 'false');
      toggle.setAttribute('aria-label', toggle.getAttribute('aria-label') || 'Abrir menú');

      const setState = (isOpen) => {
        const shouldOpen = isOpen && isMobileViewport();
        nav.classList.toggle('nav--open', shouldOpen);
        toggle.setAttribute('aria-expanded', String(shouldOpen));
        toggle.setAttribute('aria-label', shouldOpen ? 'Cerrar menú' : 'Abrir menú');
        menu.setAttribute('aria-hidden', isMobileViewport() ? (shouldOpen ? 'false' : 'true') : 'false');
        updateBodyState();
      };

      const closeMenu = (focusToggle = false) => {
        setState(false);
        if (focusToggle) {
          toggle.focus();
        }
      };

      const openMenu = () => {
        setState(true);
      };

      toggle.addEventListener('click', () => {
        if (nav.classList.contains('nav--open')) {
          closeMenu();
        } else {
          openMenu();
        }
      });

      menu.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => closeMenu());
      });

      return { nav, toggle, menu, closeMenu, setState };
    })
    .filter(Boolean);

  if (!navControls.length) {
    return;
  }

  const syncMenusWithViewport = () => {
    navControls.forEach(({ setState }) => setState(false));
  };

  syncMenusWithViewport();

  const handleBreakpointChange = () => {
    syncMenusWithViewport();
  };

  if (typeof mobileViewportQuery.addEventListener === 'function') {
    mobileViewportQuery.addEventListener('change', handleBreakpointChange);
  } else if (typeof mobileViewportQuery.addListener === 'function') {
    mobileViewportQuery.addListener(handleBreakpointChange);
  }

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') {
      return;
    }

    const activeControl = navControls.find(({ nav }) => nav.classList.contains('nav--open'));
    if (activeControl) {
      activeControl.closeMenu(true);
    }
  });
});
