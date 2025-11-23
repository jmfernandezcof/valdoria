// HeyGen Avatar - Time/Date AGGRESSIVE Override
// Forces correct Tarancón time and BLOCKS avatar's incorrect response
// This is the nuclear option when the avatar refuses to give correct time

(function (window) {
  const documentRef = window.document;
  const REFERENCE_TIMEZONE = 'Europe/Madrid';
  const LOCATION_LABEL_ES = 'Tarancón';
  const LOCATION_LABEL_EN = 'Tarancón';
  const TIME_API_URL = 'https://worldtimeapi.org/api/timezone/Europe/Madrid';

  let referenceTimeCache = null;
  let lastFetchTimestamp = 0;
  let isFetchingReferenceTime = false;

  // Palabras clave que disparan override
  const TIME_TRIGGERS = [
    // Español
    "qué hora es", "que hora es", "hora actual", "hora es",
    "qué fecha es", "que fecha es", "fecha de hoy", "fecha es",
    "día de hoy", "hoy es", "qué día es", "que dia es",
    // English
    "what time is it", "what's the time", "current time", "time is",
    "what date is it", "what's the date", "today's date", "date is",
    "what day is it"
  ];

  const resolveTimezoneAbbreviation = (referenceDate, fallbackAbbreviation) => {
    try {
      const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: REFERENCE_TIMEZONE,
        timeZoneName: 'short'
      }).formatToParts(referenceDate);
      const tzPart = parts.find((part) => part.type === 'timeZoneName');
      const value = tzPart ? tzPart.value : '';
      if (/CEST/i.test(value) || value.includes('+02') || value.includes('+2')) {
        return 'CEST';
      }
      if (/CET/i.test(value) || value.includes('+01') || value.includes('+1')) {
        return 'CET';
      }
    } catch (error) {
      console.warn('[Valdoria Time Override] Unable to resolve timezone:', error);
    }
    if (fallbackAbbreviation && typeof fallbackAbbreviation === 'string') {
      return fallbackAbbreviation.toUpperCase();
    }
    return 'CET/CEST';
  };

  const buildReferenceTime = (date, abbreviation) => {
    const timeZone = REFERENCE_TIMEZONE;
    const timezoneAbbreviation = resolveTimezoneAbbreviation(date, abbreviation);

    const formatterES = new Intl.DateTimeFormat('es-ES', {
      timeZone,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    const formatterEN = new Intl.DateTimeFormat('en-GB', {
      timeZone,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    const partsES = formatterES.formatToParts(date);
    const partsEN = formatterEN.formatToParts(date);

    const getPart = (parts, type) => {
      const p = parts.find(x => x.type === type);
      return p ? p.value : '';
    };

    const capitalizeFirst = (str) => str.charAt(0).toUpperCase() + str.slice(1);

    const weekdayES = getPart(partsES, 'weekday');
    const dayES = getPart(partsES, 'day');
    const monthES = getPart(partsES, 'month');
    const yearES = getPart(partsES, 'year');
    const hourES = getPart(partsES, 'hour');
    const minuteES = getPart(partsES, 'minute');

    const weekdayEN = getPart(partsEN, 'weekday');
    const dayEN = getPart(partsEN, 'day');
    const monthEN = getPart(partsEN, 'month');
    const yearEN = getPart(partsEN, 'year');
    const hourEN = getPart(partsEN, 'hour');
    const minuteEN = getPart(partsEN, 'minute');

    return {
      es: {
        date: `${capitalizeFirst(weekdayES)}, ${dayES} de ${monthES} de ${yearES}`,
        time: `${hourES}:${minuteES}`,
        timezone: timeZone,
        timezoneName: `${LOCATION_LABEL_ES} (${timezoneAbbreviation})`,
        response: `Ahora son las ${hourES}:${minuteES} horas en ${LOCATION_LABEL_ES} (${timezoneAbbreviation}). Hoy es ${capitalizeFirst(weekdayES)}, ${dayES} de ${monthES} de ${yearES}.`
      },
      en: {
        date: `${capitalizeFirst(weekdayEN)}, ${dayEN} ${capitalizeFirst(monthEN)} ${yearEN}`,
        time: `${hourEN}:${minuteEN}`,
        timezone: timeZone,
        timezoneName: `${LOCATION_LABEL_EN} (${timezoneAbbreviation})`,
        response: `It's ${hourEN}:${minuteEN} in ${LOCATION_LABEL_EN} (${timezoneAbbreviation}). Today is ${capitalizeFirst(weekdayEN)}, ${dayEN} ${capitalizeFirst(monthEN)} ${yearEN}.`
      }
    };
  };

  const refreshReferenceTime = () => {
    if (typeof fetch !== 'function') {
      return;
    }
    if (isFetchingReferenceTime) {
      return;
    }
    isFetchingReferenceTime = true;
    fetch(TIME_API_URL, { cache: 'no-store', mode: 'cors' })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Unexpected status ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        const isoString = data && typeof data.datetime === 'string' ? data.datetime : null;
        const abbreviation = data && typeof data.abbreviation === 'string' ? data.abbreviation : undefined;
        const referenceDate = isoString ? new Date(isoString) : new Date();
        referenceTimeCache = buildReferenceTime(referenceDate, abbreviation);
        lastFetchTimestamp = Date.now();
      })
      .catch((error) => {
        console.warn('[Valdoria Time Override] Failed to refresh time:', error);
      })
      .finally(() => {
        isFetchingReferenceTime = false;
      });
  };

  const getReferenceTime = () => {
    if (!referenceTimeCache) {
      referenceTimeCache = buildReferenceTime(new Date());
      lastFetchTimestamp = Date.now();
      refreshReferenceTime();
    } else if (Date.now() - lastFetchTimestamp > 60000) {
      refreshReferenceTime();
    }
    return referenceTimeCache;
  };

  // Prime time fetch
  refreshReferenceTime();

  const isTimeQuery = (text) => {
    if (!text || typeof text !== 'string') return false;
    const normalized = text.toLowerCase().trim().replace(/[¿?¡!.,]/g, '');
    return TIME_TRIGGERS.some(t => normalized.includes(t));
  };

  // Inject styles for overlay
  const injectStyles = () => {
    if (documentRef.getElementById('valdoria-time-override-styles')) return;

    const style = documentRef.createElement('style');
    style.id = 'valdoria-time-override-styles';
    style.textContent = `
      #valdoria-time-override-response {
        position: fixed;
        bottom: 280px;
        right: 40px;
        padding: 20px 24px;
        border-radius: 16px;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        color: #ffffff;
        font: 15px/1.6 -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        backdrop-filter: blur(16px);
        box-shadow: 0 16px 48px rgba(0, 0, 0, 0.6);
        z-index: 10003;
        max-width: 320px;
        border: 2px solid rgba(100, 255, 218, 0.3);
        animation: slideUpFade 0.5s cubic-bezier(0.16, 1, 0.3, 1);
      }

      @keyframes slideUpFade {
        from {
          opacity: 0;
          transform: translateY(30px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      #valdoria-time-override-response .time {
        font-weight: 700;
        font-size: 28px;
        color: #64ffda;
        display: block;
        margin-bottom: 8px;
        letter-spacing: 0.5px;
      }

      #valdoria-time-override-response .date {
        display: block;
        opacity: 0.95;
        font-size: 15px;
        margin-bottom: 8px;
      }

      #valdoria-time-override-response .location {
        display: block;
        opacity: 0.7;
        font-size: 12px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      @media (max-width: 768px) {
        #valdoria-time-override-response {
          right: 16px;
          bottom: 240px;
          max-width: calc(100vw - 32px);
        }
      }
    `;
    documentRef.head.appendChild(style);
  };

  const showTimeOverride = () => {
    const lang = documentRef.body.getAttribute('data-lang') || 'es';
    const timeData = getReferenceTime();
    const msgData = lang === 'es' ? timeData.es : timeData.en;

    // Remove old response
    const old = documentRef.getElementById('valdoria-time-override-response');
    if (old) old.remove();

    // Create new response overlay
    const response = documentRef.createElement('div');
    response.id = 'valdoria-time-override-response';
    response.innerHTML = `
      <span class="time">${msgData.time}</span>
      <span class="date">${msgData.date}</span>
      <span class="location">${msgData.timezoneName}</span>
    `;
    documentRef.body.appendChild(response);

    console.log('[Valdoria Time Override] FORCED:', msgData.response);

    // Auto-remove after 8 seconds
    setTimeout(() => {
      if (response && response.parentNode) response.remove();
    }, 8000);
  };

  // AGGRESSIVE OVERRIDE: Hide avatar iframe when time query detected
  const hideAvatarTemporarily = () => {
    const iframe = documentRef.querySelector('#heygen-streaming-container iframe');
    if (iframe) {
      iframe.style.opacity = '0.3';
      iframe.style.pointerEvents = 'none';
      setTimeout(() => {
        iframe.style.opacity = '1';
        iframe.style.pointerEvents = 'auto';
      }, 3000);
    }
  };

  // Public API
  window.ValdoriaTimeOverride = {
    getTime: getReferenceTime,
    isTimeQuery,
    showTimeOverride,
    forceTime: () => {
      showTimeOverride();
      hideAvatarTemporarily();
    }
  };

  // Inject styles
  injectStyles();

  // INTERCEPT ALL USER INPUT TO AVATAR
  // Listen for input events on the page
  documentRef.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
      const target = event.target;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        const userText = target.value || '';
        if (isTimeQuery(userText)) {
          console.log('[Valdoria Time Override] TIME QUERY INTERCEPTED:', userText);

          // Show correct time immediately
          setTimeout(() => {
            showTimeOverride();
            hideAvatarTemporarily();
          }, 500);
        }
      }
    }
  });

  // Also intercept postMessage from HeyGen iframe
  window.addEventListener('message', function(event) {
    if (event.origin !== 'https://labs.heygen.com') {
      return;
    }

    if (event.data && event.data.type === 'user-message') {
      const userText = event.data.text || event.data.message || '';

      if (isTimeQuery(userText)) {
        console.log('[Valdoria Time Override] HEYGEN MESSAGE INTERCEPTED:', userText);

        // Show correct time and hide avatar response
        setTimeout(() => {
          showTimeOverride();
          hideAvatarTemporarily();
        }, 500);
      }
    }
  });

  // Log initialization
  console.log('%c[Valdoria Time Override] ACTIVE', 'color: #64ffda; font-weight: bold; font-size: 14px; background: #1a1a2e; padding: 4px 8px;');
  console.log('%cCurrent Tarancón time:', 'color: #64ffda;', getReferenceTime());
  console.log('%cAPI:', 'color: #ff9800;', 'window.ValdoriaTimeOverride');
})(window);
