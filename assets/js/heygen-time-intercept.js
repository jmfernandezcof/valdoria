// HeyGen Avatar - Time/Date Intercept Layer
// Creates a chat layer that intercepts time/date questions before they reach HeyGen
// Displays correct Madrid time instead of HeyGen's incorrect response

(function (window) {
  const documentRef = window.document;

  // Palabras clave para detección de consultas de hora/fecha
  const TIME_TRIGGERS = [
    "qué hora", "que hora", "hora actual", "hora es",
    "qué fecha", "que fecha", "fecha de hoy", "fecha es", "día de hoy", "hoy es",
    "what time", "what's the time", "current time", "time is",
    "what date", "what's the date", "today's date", "date is"
  ];

  // Obtiene la hora/fecha en Madrid de forma fiable
  const getMadridTime = () => {
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
      hour12: false
    });

    const now = new Date();
    const partsES = formatter.formatToParts(now);
    const partsEN = formatterEN.formatToParts(now);

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
        response: `Ahora son las ${hourES}:${minuteES}. Hoy es ${capitalizeFirst(weekdayES)}, ${dayES} de ${monthES} de ${yearES}.`
      },
      en: {
        date: `${capitalizeFirst(weekdayEN)}, ${dayEN} ${capitalizeFirst(monthEN)} ${yearEN}`,
        time: `${hourEN}:${minuteEN}`,
        response: `It's ${hourEN}:${minuteEN}. Today is ${capitalizeFirst(weekdayEN)}, ${dayEN} ${capitalizeFirst(monthEN)} ${yearEN}.`
      }
    };
  };

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
    const timeData = getMadridTime();
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
    `;
    documentRef.body.appendChild(response);

    // Auto-remover después de 7 segundos
    setTimeout(() => {
      if (response && response.parentNode) response.remove();
    }, 7000);
  };

  // API pública
  window.ValdoriaTimeIntercept = {
    getMadridTime,
    isTimeQuery,
    showTimeResponse,
    getResponse: (lang = 'es') => {
      const timeData = getMadridTime();
      return lang === 'es' ? timeData.es.response : timeData.en.response;
    }
  };

  // Inyectar estilos al cargar
  injectStyles();

  // Log de inicialización
  console.log('%c[Valdoria Time Intercept] Initialized', 'color: #64ffda; font-weight: bold; font-size: 13px;');
  console.log('Current Madrid time:', getMadridTime());
  console.log('API: window.ValdoriaTimeIntercept');
})(window);
