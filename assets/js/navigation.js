document.addEventListener('DOMContentLoaded', () => {
  const mobileViewportQuery = window.matchMedia('(max-width: 960px)');
  const isMobileViewport = () => mobileViewportQuery.matches;

  const supportedLanguages = ['es', 'en'];
  const defaultLanguage = 'es';
  const languageStorageKey = 'valdoriaLang';

  const navToggleLabels = {
    open: { es: 'Abrir menú', en: 'Open menu' },
    close: { es: 'Cerrar menú', en: 'Close menu' },
  };

  const audioButtonLabels = {
    play: { es: 'Activar sonido', en: 'Enable sound' },
    pause: { es: 'Pausar video', en: 'Pause video' },
  };

  const weatherStrings = {
    city: { es: 'Tarancón', en: 'Tarancón' },
    loading: { es: 'Cargando clima…', en: 'Loading weather…' },
    unavailable: { es: 'No disponible', en: 'Unavailable' },
    unknown: { es: 'Condición desconocida', en: 'Unknown conditions' },
  };

  const weatherCodeMap = {
    0: { icon: '☀️', es: 'Cielo despejado', en: 'Clear sky' },
    1: { icon: '🌤️', es: 'Casi despejado', en: 'Mostly clear' },
    2: { icon: '⛅️', es: 'Parcialmente nublado', en: 'Partly cloudy' },
    3: { icon: '☁️', es: 'Cubierto', en: 'Overcast' },
    45: { icon: '🌫️', es: 'Niebla', en: 'Fog' },
    48: { icon: '🌫️', es: 'Niebla con escarcha', en: 'Freezing fog' },
    51: { icon: '🌦️', es: 'Llovizna ligera', en: 'Light drizzle' },
    53: { icon: '🌦️', es: 'Llovizna moderada', en: 'Moderate drizzle' },
    55: { icon: '🌧️', es: 'Llovizna densa', en: 'Dense drizzle' },
    56: { icon: '🌧️', es: 'Llovizna helada ligera', en: 'Light freezing drizzle' },
    57: { icon: '🌧️', es: 'Llovizna helada intensa', en: 'Heavy freezing drizzle' },
    61: { icon: '🌧️', es: 'Lluvia ligera', en: 'Light rain' },
    63: { icon: '🌧️', es: 'Lluvia moderada', en: 'Moderate rain' },
    65: { icon: '🌧️', es: 'Lluvia intensa', en: 'Heavy rain' },
    66: { icon: '🌧️', es: 'Lluvia helada ligera', en: 'Light freezing rain' },
    67: { icon: '🌧️', es: 'Lluvia helada intensa', en: 'Heavy freezing rain' },
    71: { icon: '❄️', es: 'Nieve ligera', en: 'Light snow' },
    73: { icon: '❄️', es: 'Nieve moderada', en: 'Moderate snow' },
    75: { icon: '❄️', es: 'Nieve intensa', en: 'Heavy snow' },
    77: { icon: '❄️', es: 'Granizo fino', en: 'Snow grains' },
    80: { icon: '🌦️', es: 'Chubascos ligeros', en: 'Light showers' },
    81: { icon: '🌧️', es: 'Chubascos moderados', en: 'Moderate showers' },
    82: { icon: '🌧️', es: 'Chubascos intensos', en: 'Heavy showers' },
    85: { icon: '❄️', es: 'Chubascos de nieve', en: 'Snow showers' },
    86: { icon: '❄️', es: 'Chubascos fuertes de nieve', en: 'Heavy snow showers' },
    95: { icon: '⛈️', es: 'Tormenta', en: 'Thunderstorm' },
    96: { icon: '⛈️', es: 'Tormenta con granizo ligero', en: 'Thunderstorm with light hail' },
    99: { icon: '⛈️', es: 'Tormenta con granizo intenso', en: 'Thunderstorm with heavy hail' },
  };

  const htmlElement = document.documentElement;
  const langOptionButtons = Array.from(document.querySelectorAll('[data-lang-option]'));
  const weatherElement = document.querySelector('[data-weather]');
  const weatherTextNodes = weatherElement
    ? {
        es: weatherElement.querySelector('.nav__weather-text[lang="es"]'),
        en: weatherElement.querySelector('.nav__weather-text[lang="en"]'),
      }
    : null;
  const weatherIconNode = weatherElement ? weatherElement.querySelector('.nav__weather-icon') : null;
  const lightboxModal = document.querySelector('[data-lightbox-modal]');
  const lightboxDialog = lightboxModal ? lightboxModal.querySelector('.lightbox__dialog') : null;
  const lightboxImage = lightboxModal ? lightboxModal.querySelector('[data-lightbox-image]') : null;
  const lightboxCaptionNode = lightboxModal ? lightboxModal.querySelector('[data-lightbox-caption]') : null;
  const lightboxCloseElements = lightboxModal ? Array.from(lightboxModal.querySelectorAll('[data-lightbox-close]')) : [];
  const lightboxTriggers = lightboxModal ? Array.from(document.querySelectorAll('[data-lightbox-trigger]')) : [];

  let storedLanguage = null;
  try {
    storedLanguage = window.localStorage ? localStorage.getItem(languageStorageKey) : null;
  } catch {
    storedLanguage = null;
  }

  let currentLanguage = supportedLanguages.includes(storedLanguage || '') ? storedLanguage : defaultLanguage;
  let navControls = [];
  let disclaimerControls = null;
  let weatherData = null;
  let weatherIsLoading = Boolean(weatherElement);
  let weatherFailed = false;
  let lightboxIsOpen = false;
  let activeLightboxTrigger = null;

  const getWeatherEntry = (code) => weatherCodeMap[code] || null;
  const upperFirst = (value) => (value ? value.charAt(0).toUpperCase() + value.slice(1) : '');

  const getLightboxCaption = (trigger, lang) => {
    if (!trigger) {
      return '';
    }
    const datasetKey = `lightboxCaption${upperFirst(lang)}`;
    const captionFromDataset = trigger.dataset[datasetKey];
    if (captionFromDataset && captionFromDataset.trim()) {
      return captionFromDataset.trim();
    }
    const image = trigger.querySelector('img');
    if (image && image.alt) {
      return image.alt;
    }
    return '';
  };

  const updateLightboxLabels = () => {
    if (!lightboxModal || !lightboxDialog) {
      return;
    }
    const key = currentLanguage === 'es' ? 'langAriaLabelEs' : 'langAriaLabelEn';
    const label = lightboxModal.dataset[key];
    if (label) {
      lightboxDialog.setAttribute('aria-label', label);
    }
  };

  const syncLightboxContent = () => {
    if (!lightboxIsOpen || !activeLightboxTrigger || !lightboxImage) {
      return;
    }
    const source = activeLightboxTrigger.getAttribute('href') || activeLightboxTrigger.dataset.lightboxSrc;
    if (source && lightboxImage.getAttribute('src') !== source) {
      lightboxImage.src = source;
    }
    const triggerImage = activeLightboxTrigger.querySelector('img');
    lightboxImage.alt = (triggerImage && triggerImage.alt) || '';

    if (lightboxCaptionNode) {
      const caption = getLightboxCaption(activeLightboxTrigger, currentLanguage);
      if (caption) {
        lightboxCaptionNode.textContent = caption;
        lightboxCaptionNode.hidden = false;
      } else {
        lightboxCaptionNode.textContent = '';
        lightboxCaptionNode.hidden = true;
      }
    }
  };

  const closeLightbox = (focusReturn = true) => {
    if (!lightboxModal || !lightboxIsOpen) {
      return;
    }
    lightboxIsOpen = false;
    lightboxModal.classList.remove('lightbox--open');
    lightboxModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lightbox-open');
    if (lightboxImage) {
      lightboxImage.removeAttribute('src');
      lightboxImage.alt = '';
    }
    if (lightboxCaptionNode) {
      lightboxCaptionNode.textContent = '';
      lightboxCaptionNode.hidden = true;
    }
    const trigger = activeLightboxTrigger;
    activeLightboxTrigger = null;
    if (focusReturn && trigger && typeof trigger.focus === 'function') {
      trigger.focus();
    }
  };

  const openLightbox = (trigger) => {
    if (!lightboxModal || !lightboxImage || !trigger) {
      return;
    }
    const source = trigger.getAttribute('href') || trigger.dataset.lightboxSrc;
    if (!source) {
      return;
    }

    activeLightboxTrigger = trigger;
    lightboxIsOpen = true;
    lightboxModal.classList.add('lightbox--open');
    lightboxModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lightbox-open');

    syncLightboxContent();
    updateLightboxLabels();

    const primaryClose = lightboxCloseElements.length ? lightboxCloseElements[0] : null;
    window.requestAnimationFrame(() => {
      if (primaryClose && typeof primaryClose.focus === 'function') {
        primaryClose.focus();
      } else if (lightboxDialog && typeof lightboxDialog.focus === 'function') {
        lightboxDialog.focus();
      }
    });
  };

  const renderWeather = () => {
    if (!weatherElement || !weatherTextNodes) {
      return;
    }

    supportedLanguages.forEach((lang) => {
      const node = weatherTextNodes[lang];
      if (!node) {
        return;
      }

      let text = weatherStrings.loading[lang];
      if (!weatherIsLoading) {
        if (weatherFailed || !weatherData) {
          text = `${weatherStrings.city[lang]} · ${weatherStrings.unavailable[lang]}`;
        } else {
          const { temperature, code } = weatherData;
          const entry = getWeatherEntry(code);
          const description = entry ? entry[lang] : weatherStrings.unknown[lang];
          const temperatureText = typeof temperature === 'number' ? `${temperature}°C` : '--';
          text = `${weatherStrings.city[lang]} · ${temperatureText} · ${description}`;
        }
      }

      node.textContent = text;
    });

    if (weatherIconNode) {
      let icon = '–';
      if (!weatherIsLoading) {
        if (weatherFailed || !weatherData) {
          icon = '⚠️';
        } else {
          icon = (getWeatherEntry(weatherData.code) || {}).icon || 'ℹ️';
        }
      }
      weatherIconNode.textContent = icon;
    }
  };

  const fetchWeather = () => {
    if (!weatherElement || typeof fetch !== 'function') {
      return;
    }

    weatherIsLoading = true;
    weatherFailed = false;
    renderWeather();

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 10000);

    fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=40.0107&longitude=-3.0061&current=temperature_2m,weather_code&timezone=Europe%2FMadrid',
      { signal: controller.signal }
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error('Weather request failed');
        }
        return response.json();
      })
      .then((data) => {
        const current = data && data.current;
        if (!current || typeof current.temperature_2m !== 'number' || typeof current.weather_code !== 'number') {
          throw new Error('Weather payload invalid');
        }

        weatherData = {
          temperature: Math.round(current.temperature_2m),
          code: current.weather_code,
        };
        weatherFailed = false;
      })
      .catch(() => {
        weatherData = null;
        weatherFailed = true;
      })
      .finally(() => {
        weatherIsLoading = false;
        renderWeather();
        window.clearTimeout(timeoutId);
      });
  };

  const toggleLanguageElements = (lang) => {
    document.querySelectorAll('[lang]').forEach((element) => {
      if (element === htmlElement) {
        return;
      }
      const elementLang = element.getAttribute('lang');
      if (!supportedLanguages.includes(elementLang)) {
        return;
      }
      element.hidden = elementLang !== lang;
    });
  };

  const updateAriaLabels = (lang) => {
    document.querySelectorAll('[data-lang-aria-label-es]').forEach((element) => {
      const key = lang === 'es' ? 'langAriaLabelEs' : 'langAriaLabelEn';
      const label = element.dataset[key];
      if (label) {
        element.setAttribute('aria-label', label);
      }
    });
  };

  const updateMenuLabels = () => {
    navControls.forEach(({ nav, toggle }) => {
      const isOpen = nav.classList.contains('nav--open');
      const stateKey = isOpen ? 'close' : 'open';
      const label = navToggleLabels[stateKey][currentLanguage];
      if (label) {
        toggle.setAttribute('aria-label', label);
      }
    });
  };

  const updateLangOptionState = () => {
    if (!langOptionButtons.length) {
      return;
    }
    langOptionButtons.forEach((button) => {
      const optionLang = button.dataset.langOption;
      const isActive = optionLang === currentLanguage;
      button.classList.toggle('nav__lang-option--active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });
  };

  const setLanguage = (lang, { persist = true } = {}) => {
    if (!supportedLanguages.includes(lang)) {
      lang = defaultLanguage;
    }

    currentLanguage = lang;
    htmlElement.lang = lang;
    document.body.setAttribute('data-lang', lang);

    toggleLanguageElements(lang);
    updateAriaLabels(lang);
    updateMenuLabels();
    updateLangOptionState();
    updateLightboxLabels();
    syncLightboxContent();

    if (disclaimerControls && typeof disclaimerControls.updateAudioButtonLabel === 'function') {
      disclaimerControls.updateAudioButtonLabel();
    }

    renderWeather();

    if (persist) {
      try {
        if (window.localStorage) {
          localStorage.setItem(languageStorageKey, lang);
        }
      } catch {
        // Ignore storage errors (private mode, etc.)
      }
    }
  };

  let navControlsInitialized = false;

  const syncMenusWithViewport = () => {
    if (!navControlsInitialized) {
      return;
    }
    navControls.forEach(({ setState }) => setState(false));
  };

  const updateBodyState = () => {
    const anyOpen = navControls.some(({ nav }) => nav.classList.contains('nav--open'));
    document.body.classList.toggle('menu-open', anyOpen);
  };

  const disclaimerElement = document.querySelector('[data-disclaimer]');
  const disclaimerStorageKey = 'valdoriaDisclaimerSeen';

  if (disclaimerElement) {
    const video = disclaimerElement.querySelector('video');
    const skipButton = disclaimerElement.querySelector('[data-disclaimer-skip]');
    const audioButton = disclaimerElement.querySelector('[data-disclaimer-audio]');
    let keydownHandler = null;
    let videoEndedHandler = null;
    let audioClickHandler = null;
    let isVideoPlaying = false;

    const updateAudioButtonLabel = () => {
      if (!audioButton) {
        return;
      }
      const stateKey = isVideoPlaying ? 'pause' : 'play';
      supportedLanguages.forEach((lang) => {
        const span = audioButton.querySelector(`[lang="${lang}"]`);
        if (span) {
          span.textContent = audioButtonLabels[stateKey][lang];
        }
      });
      audioButton.setAttribute('aria-pressed', String(isVideoPlaying));
    };

    const resetVideo = (pausePlayback = true) => {
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
      isVideoPlaying = false;
      updateAudioButtonLabel();
    };

    const playVideoWithSound = (resetPlayback = false) => {
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
            isVideoPlaying = true;
            updateAudioButtonLabel();
            return true;
          })
          .catch(() => {
            resetVideo(true);
            return false;
          });
      }

      isVideoPlaying = !video.paused;
      updateAudioButtonLabel();
      return Promise.resolve(isVideoPlaying);
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
      isVideoPlaying = false;

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
      resetVideo(true);
      if (video) {
        videoEndedHandler = () => {
          resetVideo(true);
        };
        video.addEventListener('ended', videoEndedHandler, { once: true });
      }
      if (skipButton) {
        skipButton.addEventListener('click', closeDisclaimer, { once: true });
      }
      if (audioButton && video) {
        audioClickHandler = () => {
          if (isVideoPlaying) {
            video.pause();
            resetVideo(false);
          } else {
            playVideoWithSound(true);
          }
        };
        audioButton.addEventListener('click', audioClickHandler);
      }
      keydownHandler = (event) => {
        if (event.key === 'Escape') {
          closeDisclaimer();
        }
      };
      document.addEventListener('keydown', keydownHandler);
    };

    disclaimerControls = {
      updateAudioButtonLabel,
    };

    if (sessionStorage.getItem(disclaimerStorageKey)) {
      disclaimerElement.remove();
    } else {
      showDisclaimer();
    }
  }

  navControls = Array.from(document.querySelectorAll('.nav'))
    .map((nav) => {
      const toggle = nav.querySelector('.nav__toggle');
      const menu = nav.querySelector('.nav__links');

      if (!toggle || !menu) {
        return null;
      }

      toggle.setAttribute('aria-expanded', toggle.getAttribute('aria-expanded') || 'false');

      const setState = (isOpen) => {
        const shouldOpen = isOpen && isMobileViewport();
        nav.classList.toggle('nav--open', shouldOpen);
        toggle.setAttribute('aria-expanded', String(shouldOpen));
        const stateKey = shouldOpen ? 'close' : 'open';
        const label = navToggleLabels[stateKey][currentLanguage];
        if (label) {
          toggle.setAttribute('aria-label', label);
        }
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

  navControlsInitialized = Boolean(navControls.length);

  syncMenusWithViewport();

  const handleBreakpointChange = () => {
    syncMenusWithViewport();
  };

  if (typeof mobileViewportQuery.addEventListener === 'function') {
    mobileViewportQuery.addEventListener('change', handleBreakpointChange);
  } else if (typeof mobileViewportQuery.addListener === 'function') {
    mobileViewportQuery.addListener(handleBreakpointChange);
  }

  if (lightboxTriggers.length && lightboxModal) {
    lightboxTriggers.forEach((trigger) => {
      trigger.addEventListener('click', (event) => {
        event.preventDefault();
        openLightbox(trigger);
      });
      trigger.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openLightbox(trigger);
        }
      });
    });
  }

  if (lightboxCloseElements.length) {
    lightboxCloseElements.forEach((element) => {
      element.addEventListener('click', (event) => {
        event.preventDefault();
        closeLightbox();
      });
    });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (lightboxIsOpen) {
        event.preventDefault();
        closeLightbox();
        return;
      }

      const activeControl = navControls.find(({ nav }) => nav.classList.contains('nav--open'));
      if (activeControl) {
        activeControl.closeMenu(true);
      }
    }
  });

  if (langOptionButtons.length) {
    langOptionButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const target = button.dataset.langOption;
        if (target) {
          setLanguage(target);
        }
      });
    });
  }

  setLanguage(currentLanguage, { persist: false });
  updateLangOptionState();
  if (disclaimerControls && typeof disclaimerControls.updateAudioButtonLabel === 'function') {
    disclaimerControls.updateAudioButtonLabel();
  }

  if (weatherElement) {
    renderWeather();
    fetchWeather();
    window.setInterval(fetchWeather, 30 * 60 * 1000);
  }
});
