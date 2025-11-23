// ============================================================================
// Valdoria Hotel - HeyGen Avatar Analytics
// ============================================================================
// Captura interacciones del avatar y envía a n8n para análisis
//
// MODO A (Event Listener): Funciona inmediatamente, captura eventos del iframe
// MODO B (API HeyGen): Requiere API key, datos más completos
//
// Para rollback rápido: eliminar referencia en HTML o comentar línea 21
// ============================================================================

(function (window) {
  'use strict';

  // ============================================================================
  // CONFIGURACIÓN
  // ============================================================================

  const CONFIG = {
    // N8N Webhook (cambiar cuando esté disponible)
    N8N_WEBHOOK_URL: 'https://n8n.nomadprompters.es/webhook/valdoria-avatar',

    // Modo de operación: 'event-listener' o 'api'
    // event-listener: Captura eventos del iframe (funciona ya)
    // api: Usa HeyGen API (requiere HEYGEN_API_KEY configurada)
    MODE: 'event-listener',

    // API Key de HeyGen (solo para MODO='api')
    // Obtenerla en: https://app.heygen.com/settings/api
    HEYGEN_API_KEY: null,

    // Host del iframe de HeyGen
    HEYGEN_HOST: 'https://labs.heygen.com',

    // Debug mode
    DEBUG: true,
  };

  // ============================================================================
  // ESTADO
  // ============================================================================

  const documentRef = window.document;
  let sessionId = null;
  let messageCount = 0;
  let sessionStartTime = null;
  let isAnalyticsEnabled = true;

  // ============================================================================
  // UTILIDADES
  // ============================================================================

  const log = (...args) => {
    if (CONFIG.DEBUG) {
      console.log('%c[Valdoria Analytics]', 'color: #FF6B35; font-weight: bold;', ...args);
    }
  };

  const generateSessionId = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `valdoria_${timestamp}_${random}`;
  };

  const getCurrentPageSection = () => {
    const path = window.location.pathname;
    if (path.includes('resort')) return 'resort';
    if (path.includes('villas')) return 'villas';
    if (path.includes('wellness')) return 'wellness';
    if (path.includes('experiencias')) return 'experiencias';
    if (path.includes('contacto')) return 'contacto';
    return 'home';
  };

  const getSessionDuration = () => {
    if (!sessionStartTime) return 0;
    return Math.floor((Date.now() - sessionStartTime) / 1000); // seconds
  };

  // ============================================================================
  // ENVÍO DE DATOS A N8N
  // ============================================================================

  const sendToN8n = async (eventData) => {
    if (!isAnalyticsEnabled) {
      log('Analytics disabled, skipping send');
      return;
    }

    if (!CONFIG.N8N_WEBHOOK_URL) {
      log('Webhook URL not configured, skipping send');
      return;
    }

    const payload = {
      ...eventData,
      collected_at: new Date().toISOString(),
      user_agent: navigator.userAgent,
      screen_width: window.screen.width,
      screen_height: window.screen.height,
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight,
    };

    try {
      const response = await fetch(CONFIG.N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.warn('[Valdoria Analytics] Webhook responded with status:', response.status);
      } else {
        log('Data sent successfully:', eventData.event_type);
      }
    } catch (error) {
      console.warn('[Valdoria Analytics] Failed to send data:', error.message);
    }
  };

  // ============================================================================
  // MODO A: EVENT LISTENER (Ya funciona)
  // ============================================================================

  const initEventListenerMode = () => {
    log('Initializing Event Listener Mode');

    window.addEventListener('message', function (event) {
      // Verificar origen
      if (event.origin !== CONFIG.HEYGEN_HOST) {
        return;
      }

      const eventData = event.data;
      if (!eventData) return;

      // ========================================
      // EVENTO: Inicialización del avatar
      // ========================================
      if (eventData.type === 'streaming-embed' && eventData.action === 'init') {
        sessionId = generateSessionId();
        messageCount = 0;
        sessionStartTime = Date.now();

        log('Session started:', sessionId);

        sendToN8n({
          event_type: 'session_start',
          session_id: sessionId,
          page_url: window.location.href,
          page_section: getCurrentPageSection(),
          language: documentRef.body.getAttribute('data-lang') || 'es',
          referrer: document.referrer || 'direct',
        });
      }

      // ========================================
      // EVENTO: Mensaje del usuario
      // ========================================
      if (eventData.type === 'user-message') {
        const userText = eventData.text || eventData.message || '';
        if (!userText) return;

        messageCount++;

        // Detectar si es pregunta sobre hora/fecha
        const isTimeQuery = window.ValdoriaTimeHandler &&
                           window.ValdoriaTimeHandler.isTimeQuery(userText);

        log('User message received:', {
          session: sessionId,
          message_number: messageCount,
          text: userText.substring(0, 50) + (userText.length > 50 ? '...' : ''),
          is_time_query: isTimeQuery,
        });

        sendToN8n({
          event_type: 'user_message',
          session_id: sessionId || 'unknown',
          message_number: messageCount,
          user_message: userText,
          message_length: userText.length,
          is_time_query: isTimeQuery,
          page_url: window.location.href,
          page_section: getCurrentPageSection(),
          language: documentRef.body.getAttribute('data-lang') || 'es',
          session_duration: getSessionDuration(),
        });
      }

      // ========================================
      // EVENTO: Avatar expandido/mostrado
      // ========================================
      if (eventData.type === 'streaming-embed' && eventData.action === 'show') {
        log('Avatar expanded');

        sendToN8n({
          event_type: 'avatar_expanded',
          session_id: sessionId || 'unknown',
          page_url: window.location.href,
          page_section: getCurrentPageSection(),
          session_duration: getSessionDuration(),
        });
      }

      // ========================================
      // EVENTO: Avatar colapsado/cerrado
      // ========================================
      if (eventData.type === 'streaming-embed' && eventData.action === 'hide') {
        if (messageCount > 0 && sessionId) {
          log('Session ended:', {
            session: sessionId,
            messages: messageCount,
            duration: getSessionDuration() + 's',
          });

          sendToN8n({
            event_type: 'session_end',
            session_id: sessionId,
            total_messages: messageCount,
            session_duration: getSessionDuration(),
            page_url: window.location.href,
            page_section: getCurrentPageSection(),
          });
        }
      }
    });

    // ========================================
    // EVENTO: Usuario cierra la página
    // ========================================
    window.addEventListener('beforeunload', function () {
      if (sessionId && messageCount > 0) {
        const data = JSON.stringify({
          event_type: 'page_close',
          session_id: sessionId,
          total_messages: messageCount,
          session_duration: getSessionDuration(),
          page_url: window.location.href,
          page_section: getCurrentPageSection(),
          collected_at: new Date().toISOString(),
        });

        // sendBeacon es más confiable para beforeunload
        if (navigator.sendBeacon && CONFIG.N8N_WEBHOOK_URL) {
          navigator.sendBeacon(CONFIG.N8N_WEBHOOK_URL, data);
        }
      }
    });

    log('Event listener mode ready');
  };

  // ============================================================================
  // MODO B: API DE HEYGEN (Requiere API key)
  // ============================================================================

  const initAPIMode = () => {
    if (!CONFIG.HEYGEN_API_KEY) {
      console.error('[Valdoria Analytics] API mode requires HEYGEN_API_KEY to be configured');
      console.error('Get your API key at: https://app.heygen.com/settings/api');
      console.error('Then update CONFIG.HEYGEN_API_KEY in heygen-analytics.js');
      return;
    }

    log('API Mode not yet implemented - use Event Listener mode for now');
    log('API key detected, ready for future implementation');

    // TODO: Implementar cuando se necesite acceso a API completa
    // Endpoints disponibles:
    // - POST /v1/interactive-avatar/sessions
    // - GET /v1/interactive-avatar/sessions/{id}
    // - GET /v1/interactive-avatar/sessions/{id}/transcript
  };

  // ============================================================================
  // INICIALIZACIÓN
  // ============================================================================

  const init = () => {
    log('Initializing Valdoria Analytics...');
    log('Mode:', CONFIG.MODE);
    log('Webhook:', CONFIG.N8N_WEBHOOK_URL);

    if (CONFIG.MODE === 'api') {
      initAPIMode();
    } else {
      initEventListenerMode();
    }
  };

  // ============================================================================
  // API PÚBLICA
  // ============================================================================

  window.ValdoriaAnalytics = {
    // Habilitar/deshabilitar analytics
    enable: () => {
      isAnalyticsEnabled = true;
      log('Analytics enabled');
    },

    disable: () => {
      isAnalyticsEnabled = false;
      log('Analytics disabled');
    },

    // Obtener estado actual
    getStatus: () => ({
      enabled: isAnalyticsEnabled,
      mode: CONFIG.MODE,
      session_id: sessionId,
      message_count: messageCount,
      session_duration: getSessionDuration(),
      webhook_url: CONFIG.N8N_WEBHOOK_URL,
    }),

    // Cambiar webhook URL en runtime
    setWebhookURL: (url) => {
      CONFIG.N8N_WEBHOOK_URL = url;
      log('Webhook URL updated:', url);
    },

    // Enviar evento custom
    sendCustomEvent: (eventType, data) => {
      sendToN8n({
        event_type: eventType,
        session_id: sessionId || 'no_session',
        ...data,
      });
    },
  };

  // ============================================================================
  // BOOTSTRAP
  // ============================================================================

  // Esperar a que el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Log de inicialización
  console.log('%c🎯 Valdoria Analytics Loaded', 'color: #FF6B35; font-weight: bold; font-size: 14px;');
  console.log('%cAPI: window.ValdoriaAnalytics', 'color: #4ECDC4;');
  console.log('%cWebhook: ' + CONFIG.N8N_WEBHOOK_URL, 'color: #95E1D3;');

})(window);
