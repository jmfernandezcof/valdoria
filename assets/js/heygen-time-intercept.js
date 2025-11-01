// HeyGen Avatar - Time/Date Intercept Layer
// Creates a chat layer that intercepts time/date questions before they reach HeyGen
// Displays correct Tarancón time instead of HeyGen's incorrect response

(function (window) {
  const documentRef = window.document;
  const REFERENCE_TIMEZONE = 'Europe/Madrid';
  const LOCATION_LABEL_ES = 'Tarancón';
  const LOCATION_LABEL_EN = 'Tarancón';

  const TIME_API_URL = 'https://worldtimeapi.org/api/timezone/Europe/Madrid';
  let referenceTimeCache = null;
  let lastFetchTimestamp = 0;
  let isFetchingReferenceTime = false;

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
      console.warn('[Valdoria Time Intercept] Unable to resolve timezone abbreviation:', error);
    }
    if (fallbackAbbreviation && typeof fallbackAbbreviation === 'string') {
      return fallbackAbbreviation.toUpperCase();
    }
    return 'CET/CEST';
  };

  // Palabras clave para detección de consultas de hora/fecha
  const TIME_TRIGGERS = [
    "qué hora", "que hora", "hora actual", "hora es",
    "qué fecha", "que fecha", "fecha de hoy", "fecha es", "día de hoy", "hoy es",
    "what time", "what's the time", "current time", "time is",
    "what date", "what's the date", "today's date", "date is"
  ];

  const buildReferenceTime = (date, abbreviation) => {
    const timeZone = REFERENCE_TIMEZONE;
    const timezoneAbbreviation = resolveTimezoneAbbreviation(date, abbreviation);
    const formatter = new Intl.DateTimeFormat('es-ES', {
      timeZone,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
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

    const partsES = formatter.formatToParts(date);
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
        response: `Ahora son las ${hourES}:${minuteES} en ${LOCATION_LABEL_ES} (${timezoneAbbreviation}). Hoy es ${capitalizeFirst(weekdayES)}, ${dayES} de ${monthES} de ${yearES}.`
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
        console.warn('[Valdoria Time Intercept] Failed to refresh reference time:', error);
      })
      .finally(() => {
        isFetchingReferenceTime = false;
      });
  };

  // Obtiene la hora/fecha en la zona de Tarancón (Europe/Madrid)
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
  // Backwards compatibility helpers
  const getLocalizedTime = () => getReferenceTime();
  const getMadridTime = () => getReferenceTime();
  // Prime remote time fetch
  refreshReferenceTime();

  // Detecta pregunta sobre hora
  const isTimeQuery = (text) => {
    if (!text || typeof text !== 'string') return false;
    const normalized = text.toLowerCase().trim().replace(/[¿?¡!.,]/g, '');
    return TIME_TRIGGERS.some(t => normalized.includes(t));
  };

  // Inyecta un CSS overlay para mostrar respuesta sin que HeyGen hable
  const injectStyles = () => {
    if (documentRef.getElementById('valdoria-time-intercept-styles')) return;

    const style = documentRef.createElement('style');
    style.id = 'valdoria-time-intercept-styles';
    style.textContent = `
      #valdoria-time-response {
        position: fixed;
        bottom: 280px;
        right: 40px;
        padding: 16px 20px;
        border-radius: 14px;
        background: linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(20, 20, 30, 0.9));
        color: #ffffff;
        font: 14px/1.6 -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        backdrop-filter: blur(12px);
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
        z-index: 10002;
        max-width: 280px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        animation: slideUp 0.4s ease-out;
      }

      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      #valdoria-time-response strong {
        font-weight: 600;
        color: #64ffda;
        display: block;
        margin-bottom: 6px;
      }

      #valdoria-time-response small {
        display: block;
        opacity: 0.8;
        font-size: 12px;
      }
    `;
    documentRef.head.appendChild(style);
  };

  // Muestra la respuesta de hora
  const showTimeResponse = () => {
    const lang = documentRef.body.getAttribute('data-lang') || 'es';
    const timeData = getLocalizedTime();
    const msgData = lang === 'es' ? timeData.es : timeData.en;

    // Remover respuesta anterior si existe
    const old = documentRef.getElementById('valdoria-time-response');
    if (old) old.remove();

    // Crear elemento de respuesta
    const response = documentRef.createElement('div');
    response.id = 'valdoria-time-response';
    response.innerHTML = `
      <strong>${msgData.time}</strong>
      <small>${msgData.date}</small>
      <small style="opacity: 0.65; font-size: 11px;">${msgData.timezoneName}</small>
    `;
    documentRef.body.appendChild(response);

    // Auto-remover después de 7 segundos
    setTimeout(() => {
      if (response && response.parentNode) response.remove();
    }, 7000);
  };

  // API pública
  window.ValdoriaTimeIntercept = {
    getTime: getReferenceTime,
    getReferenceTime,
    getLocalizedTime,
    getMadridTime,
    isTimeQuery,
    showTimeResponse,
    getResponse: (lang = 'es') => {
      const timeData = getReferenceTime();
      return lang === 'es' ? timeData.es.response : timeData.en.response;
    }
  };

  // Inyectar estilos al cargar
  injectStyles();

  // Log de inicialización
  console.log('%c[Valdoria Time Intercept] Initialized', 'color: #64ffda; font-weight: bold; font-size: 13px;');
  console.log('Current Tarancón time:', getReferenceTime());
  console.log('API: window.ValdoriaTimeIntercept');
})(window);
