// HeyGen Avatar - Time/Date Handler for Valdoria
// Intercepts time/date queries and responds with local time (Europe/Madrid)
// since HeyGen KB doesn't respect timezone settings

(function (window) {
  const documentRef = window.document;

  // Palabras clave que disparan la respuesta de hora/fecha
  const TIME_TRIGGERS = [
    // Español
    "qué hora es", "que hora es", "hora actual", "hora", "horario",
    "qué fecha es", "que fecha es", "fecha de hoy", "fecha", "día de hoy", "hoy es",
    "cuál es la fecha", "cual es la fecha", "cuál es la hora", "cual es la hora",
    // English
    "what time is it", "what's the time", "current time", "time",
    "what date is it", "what's the date", "today's date", "date today",
    "current date", "what day is it"
  ];

  // Obtiene la hora/fecha en zona horaria de Madrid (Europe/Madrid)
  const getMadridTimeString = () => {
    const now = new Date();

    // Formato de fecha en español e inglés
    const dateES = now.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const dateEN = now.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Hora en formato HH:MM
    const timeES = now.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Madrid'
    });

    const timeEN = now.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Madrid'
    });

    return {
      dateES,
      dateEN,
      timeES,
      timeEN,
      iso: now.toISOString()
    };
  };

  // Crea una burbuja visual mostrando la hora local
  function showMadridTimeBubble(containerId = 'heygen-streaming-embed') {
    const { timeES, dateES, timeEN, dateEN } = getMadridTimeString();

    let bubble = documentRef.getElementById('valdoria-time-bubble');
    if (bubble) {
      bubble.remove();
    }

    bubble = documentRef.createElement('div');
    bubble.id = 'valdoria-time-bubble';
    bubble.style.cssText = `
      position: fixed;
      bottom: 260px;
      right: 40px;
      padding: 12px 16px;
      border-radius: 8px;
      background: rgba(0, 0, 0, 0.85);
      color: #ffffff;
      font: 13px/1.4 -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      backdrop-filter: blur(8px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      z-index: 10000;
      max-width: 220px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    `;

    // Detecta idioma de la página
    const pageLang = documentRef.body.getAttribute('data-lang') || 'es';
    const isSpanish = pageLang === 'es';

    if (isSpanish) {
      bubble.textContent = `Ahora: ${timeES} — ${dateES}`;
    } else {
      bubble.textContent = `Now: ${timeEN} — ${dateEN}`;
    }

    documentRef.body.appendChild(bubble);

    // Auto-elimina la burbuja después de 5 segundos
    setTimeout(() => {
      if (bubble && bubble.parentNode) {
        bubble.remove();
      }
    }, 5000);
  }

  // Detecta si el usuario preguntó por la hora/fecha
  function isTimeQuery(userText) {
    const normalized = (userText || '')
      .toLowerCase()
      .trim()
      .replace(/[¿?¡!]/g, ''); // Elimina signos de puntuación

    return TIME_TRIGGERS.some(trigger => normalized.includes(trigger));
  }

  // Genera respuesta en el idioma de la página
  function generateTimeResponse() {
    const { timeES, dateES, timeEN, dateEN } = getMadridTimeString();
    const pageLang = documentRef.body.getAttribute('data-lang') || 'es';

    if (pageLang === 'es') {
      return `Ahora mismo son las ${timeES}. Hoy es ${dateES}.`;
    } else {
      return `It's currently ${timeEN}. Today is ${dateEN}.`;
    }
  }

  // Hook principal: intercepta mensajes del usuario
  window.ValdoriaTimeHandler = {
    // Llama esto cuando el usuario envía un mensaje al avatar
    handleUserMessage: function (userText) {
      if (!userText) return false;

      if (isTimeQuery(userText)) {
        // Muestra la respuesta de hora en una burbuja
        showMadridTimeBubble();

        // Si hay integración con chat, podrías devolver la respuesta aquí
        const response = generateTimeResponse();
        console.log('[VALDORIA TIME]', response);

        return {
          handled: true,
          response: response,
          isTimeQuery: true
        };
      }

      return { handled: false, isTimeQuery: false };
    },

    // Permite obtener la hora/fecha manualmente
    getTime: getMadridTimeString,

    // Permite obtener solo la respuesta de texto
    getTimeResponse: generateTimeResponse
  };

  // Inyecta la burbuja al cargar la página
  if (documentRef.readyState === 'loading') {
    documentRef.addEventListener('DOMContentLoaded', () => {
      // Opcional: muestra la hora al abrir el avatar
      // showMadridTimeBubble();
    });
  }

  // Expone la funcionalidad globalmente
  console.log('%c[Valdoria Time Handler] Ready', 'color: #4CAF50; font-weight: bold;');
  console.log('%cUso: window.ValdoriaTimeHandler.handleUserMessage("¿Qué hora es?")', 'color: #2196F3;');
})(window);
