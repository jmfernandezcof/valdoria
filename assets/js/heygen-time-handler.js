// HeyGen Avatar - Time/Date Handler for Valdoria
// Intercepts and responds to time/date queries with correct Madrid timezone
// Communicates with HeyGen iframe via postMessage

(function (window) {
  const documentRef = window.document;
  const heygenHost = 'https://labs.heygen.com';

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

  // Obtiene la hora/fecha correcta en Madrid usando Date API directa
  const getMadridTimeString = () => {
    // Crear una referencia a ahora
    const now = new Date();

    // Usar Intl con formatToParts para máxima precisión
    const formatter = new Intl.DateTimeFormat('es-ES', {
      timeZone: 'Europe/Madrid',
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
      timeZone: 'Europe/Madrid',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    const partsES = formatter.formatToParts(now);
    const partsEN = formatterEN.formatToParts(now);

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
      iso: now.toISOString(),
      timestamp: now.getTime(),
      timezone: 'Europe/Madrid'
    };
  };

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
    const { timeES, dateES, timeEN, dateEN } = getMadridTimeString();
    const pageLang = documentRef.body.getAttribute('data-lang') || 'es';

    if (pageLang === 'es') {
      return `Ahora son las ${timeES}. Hoy es ${dateES}.`;
    } else {
      return `It's ${timeEN}. Today is ${dateEN}.`;
    }
  }

  // Crea una burbuja visual mostrando la hora local
  function showMadridTimeBubble() {
    const { timeES, dateES, timeEN, dateEN } = getMadridTimeString();

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

    bubble.innerHTML = `
      <div style="font-weight: 600; font-size: 15px; margin-bottom: 4px;">${timeStr}</div>
      <div style="font-size: 12px; opacity: 0.85;">${dateStr}</div>
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
        showMadridTimeBubble();

        const response = generateTimeResponse();
        console.log('[VALDORIA TIME RESPONSE]', response);

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
    getTime: getMadridTimeString,

    // Permite obtener solo la respuesta de texto
    getTimeResponse: generateTimeResponse,

    // Verifica si un texto es una pregunta sobre hora
    isTimeQuery: isTimeQuery,

    // Muestra la burbuja manualmente
    showBubble: showMadridTimeBubble
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
        showMadridTimeBubble();

        // Enviar la respuesta correcta de vuelta al iframe
        const response = generateTimeResponse();
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
  console.log('%cCurrent Madrid time:', 'color: #2196F3;', getMadridTimeString());
  console.log('%cAPI:', 'color: #FF9800;', 'window.ValdoriaTimeHandler');
})(window);
