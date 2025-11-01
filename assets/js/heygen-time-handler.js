// HeyGen Avatar - Time/Date Handler for Valdoria
// Intercepts and responds to time/date queries with Valdoria's reference timezone (Tarancón, Europe/Madrid)
// Communicates with HeyGen iframe via postMessage

(function (window) {
  const documentRef = window.document;
  const heygenHost = 'https://labs.heygen.com';
  const REFERENCE_TIMEZONE = 'Europe/Madrid';
  const LOCATION_LABEL_ES = 'Tarancón';
  const LOCATION_LABEL_EN = 'Tarancón';

  // Palabras clave que disparan la respuesta de hora/fecha
  const TIME_TRIGGERS = [
    // Español
    "qué hora es", "que hora es", "hora actual", "hora", "horario",
    "qué fecha es", "que fecha es", "fecha de hoy", "fecha", "día de hoy", "hoy es",
    "cuál es la fecha", "cual es la fecha", "cuál es la hora", "cual es la hora",
    // English
    "what time is it", "what's the time", "current time", "time",
    "what date is it", "what's the date", "today's date", "date today",
    "current date", "what day is it", "the time", "the date"
  ];

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
      console.warn('[Valdoria Time Handler] Unable to resolve timezone abbreviation:', error);
    }
    if (fallbackAbbreviation && typeof fallbackAbbreviation === 'string') {
      return fallbackAbbreviation.toUpperCase();
    }
    return 'CET/CEST';
  };

  const buildReferenceTimeData = (date, abbreviation) => {
    const timezoneAbbreviation = resolveTimezoneAbbreviation(date, abbreviation);

    // Usar Intl con formatToParts para máxima precisión
    const formatter = new Intl.DateTimeFormat('es-ES', {
      timeZone: REFERENCE_TIMEZONE,
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
      timeZone: REFERENCE_TIMEZONE,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    const partsES = formatter.formatToParts(date);
    const partsEN = formatterEN.formatToParts(date);

    // Helper para extraer valores
    const getPart = (parts, type) => {
      const part = parts.find(p => p.type === type);
      return part ? part.value : '';
    };

    // Construir strings desde las partes formateadas
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

    // Capitalizar primer carácter del weekday
    const capitalizeFirst = (str) => str.charAt(0).toUpperCase() + str.slice(1);

    const dateES = `${capitalizeFirst(weekdayES)}, ${dayES} de ${monthES} de ${yearES}`;
    const timeES = `${hourES}:${minuteES}`;

    const dateEN = `${capitalizeFirst(weekdayEN)}, ${dayEN} ${capitalizeFirst(monthEN)} ${yearEN}`;
    const timeEN = `${hourEN}:${minuteEN}`;

    return {
      dateES,
      dateEN,
      timeES,
      timeEN,
      iso: date.toISOString(),
      timestamp: date.getTime(),
      timezone: REFERENCE_TIMEZONE,
      timezoneAbbreviation,
      timezoneNameES: `${LOCATION_LABEL_ES} (${timezoneAbbreviation})`,
      timezoneNameEN: `${LOCATION_LABEL_EN} (${timezoneAbbreviation})`
    };
  };

  const refreshReferenceTimeData = () => {
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
        referenceTimeCache = buildReferenceTimeData(referenceDate, abbreviation);
        lastFetchTimestamp = Date.now();
      })
      .catch((error) => {
        console.warn('[Valdoria Time Handler] Failed to refresh reference time:', error);
      })
      .finally(() => {
        isFetchingReferenceTime = false;
      });
  };

  // Obtiene la hora/fecha correcta en la zona de Tarancón (Europe/Madrid)
  const getReferenceTimeData = () => {
    if (!referenceTimeCache) {
      referenceTimeCache = buildReferenceTimeData(new Date());
      lastFetchTimestamp = Date.now();
      refreshReferenceTimeData();
    } else if (Date.now() - lastFetchTimestamp > 60000) {
      refreshReferenceTimeData();
    }
    return referenceTimeCache;
  };
  // Backwards compatibility helper
  const getLocalizedTimeString = getReferenceTimeData;
  // Prime remote time fetch
  refreshReferenceTimeData();

  // Detecta si el usuario preguntó por la hora/fecha
  function isTimeQuery(userText) {
    if (!userText || typeof userText !== 'string') return false;

    const normalized = userText
      .toLowerCase()
      .trim()
      .replace(/[¿?¡!]/g, '');

    return TIME_TRIGGERS.some(trigger => normalized.includes(trigger));
  }

  // Genera respuesta en el idioma de la página
  function generateTimeResponse() {
    const { timeES, dateES, timeEN, dateEN, timezoneNameES, timezoneNameEN } = getLocalizedTimeString();
    const pageLang = documentRef.body.getAttribute('data-lang') || 'es';

    if (pageLang === 'es') {
      return `Ahora son las ${timeES} en ${timezoneNameES}. Hoy es ${dateES}.`;
    }
    return `It's ${timeEN} in ${timezoneNameEN}. Today is ${dateEN}.`;
  }

  // Crea una burbuja visual mostrando la hora local
  function showReferenceTimeBubble() {
    const { timeES, dateES, timeEN, dateEN, timezoneNameES, timezoneNameEN } = getLocalizedTimeString();

    // Remover burbuja anterior si existe
    let bubble = documentRef.getElementById('valdoria-time-bubble');
    if (bubble) {
      bubble.remove();
    }

    // Crear nueva burbuja
    bubble = documentRef.createElement('div');
    bubble.id = 'valdoria-time-bubble';
    bubble.style.cssText = `
      position: fixed;
      bottom: 280px;
      right: 40px;
      padding: 14px 18px;
      border-radius: 12px;
      background: rgba(0, 0, 0, 0.9);
      color: #ffffff;
      font: 14px/1.5 -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      backdrop-filter: blur(10px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
      z-index: 10001;
      max-width: 260px;
      border: 1px solid rgba(255, 255, 255, 0.15);
      text-align: center;
    `;

    const pageLang = documentRef.body.getAttribute('data-lang') || 'es';
    const timeStr = pageLang === 'es' ? timeES : timeEN;
    const dateStr = pageLang === 'es' ? dateES : dateEN;
    const timezoneLabel = pageLang === 'es' ? timezoneNameES : timezoneNameEN;

    bubble.innerHTML = `
      <div style="font-weight: 600; font-size: 15px; margin-bottom: 4px;">${timeStr}</div>
      <div style="font-size: 12px; opacity: 0.85;">${dateStr}</div>
      <div style="font-size: 11px; opacity: 0.7; margin-top: 6px;">${timezoneLabel}</div>
    `;

    documentRef.body.appendChild(bubble);

    // Auto-elimina la burbuja después de 6 segundos
    setTimeout(() => {
      if (bubble && bubble.parentNode) {
        bubble.remove();
      }
    }, 6000);
  }

  // Hook principal: intercepta mensajes del usuario
  window.ValdoriaTimeHandler = {
    // Llama esto cuando el usuario envía un mensaje al avatar
    handleUserMessage: function (userText) {
      if (!userText) return { handled: false };

      const isTimeQueryResult = isTimeQuery(userText);

      if (isTimeQueryResult) {
        // Muestra la respuesta de hora en una burbuja
        showReferenceTimeBubble();

        const response = generateTimeResponse();
        console.log('[VALDORIA TIME RESPONSE]', response);
        if (window.ValdoriaAvatar && typeof window.ValdoriaAvatar.suspendForMessage === 'function') {
          const alreadySuspended = typeof window.ValdoriaAvatar.isSuspended === 'function' && window.ValdoriaAvatar.isSuspended();
          if (!alreadySuspended) {
            window.ValdoriaAvatar.suspendForMessage(response);
          }
        }

        return {
          handled: true,
          response: response,
          isTimeQuery: true,
          timestamp: new Date().getTime()
        };
      }

      return { handled: false, isTimeQuery: false };
    },

    // Permite obtener la hora/fecha manualmente
    getTime: getLocalizedTimeString,

    // Permite obtener solo la respuesta de texto
    getTimeResponse: generateTimeResponse,

    // Verifica si un texto es una pregunta sobre hora
    isTimeQuery: isTimeQuery,

    // Muestra la burbuja manualmente
    showBubble: showReferenceTimeBubble
  };

  // Intercepta postMessages desde el iframe de HeyGen
  window.addEventListener('message', function (event) {
    // Solo aceptar mensajes de HeyGen
    if (event.origin !== heygenHost) {
      return;
    }

    // Log de mensajes para debugging
    if (event.data && event.data.type === 'user-message') {
      console.log('[HEYGEN MESSAGE]', event.data);

      const userText = event.data.text || event.data.message || '';

      if (isTimeQuery(userText)) {
        console.log('[TIME QUERY DETECTED]', userText);
        showReferenceTimeBubble();

        // Enviar la respuesta correcta de vuelta al iframe
        const response = generateTimeResponse();
        if (window.ValdoriaAvatar && typeof window.ValdoriaAvatar.suspendForMessage === 'function') {
          const alreadySuspended = typeof window.ValdoriaAvatar.isSuspended === 'function' && window.ValdoriaAvatar.isSuspended();
          if (!alreadySuspended) {
            window.ValdoriaAvatar.suspendForMessage(response);
          }
        }
        if (event.source) {
          event.source.postMessage({
            type: 'time-response',
            response: response,
            isTimeQuery: true
          }, heygenHost);
        }
      }
    }
  });

  // Log de inicialización
  console.log('%c[Valdoria Time Handler] Ready', 'color: #4CAF50; font-weight: bold; font-size: 14px;');
  console.log('%cCurrent Tarancón time:', 'color: #2196F3;', getLocalizedTimeString());
  console.log('%cAPI:', 'color: #FF9800;', 'window.ValdoriaTimeHandler');
})(window);
