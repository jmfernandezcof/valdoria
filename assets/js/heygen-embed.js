// HeyGen streaming avatar embed for Valdoria
(function (window) {
  // LiveAvatar queda preparado, pero desactivado hasta que haya plan/créditos.
  // Cuando esté disponible el embed del panel, sustituir EMBED_URL y activar ENABLED.
  const LIVE_AVATAR_CONFIG = {
    ENABLED: false,
    AVATAR_ID: '394470da-7d4f-4b77-bffe-14d69964d9e1',
    EMBED_URL: '',
    PLACEHOLDER_MESSAGE: 'Hasta que no me contrate alguien, ¡no trabajo! 😌',
  };

  const host = 'https://app.liveavatar.com';
  const url = LIVE_AVATAR_CONFIG.EMBED_URL;

  const documentRef = window.document;
  const body = documentRef.body || documentRef.documentElement;
  const clientWidth = body ? body.clientWidth : window.innerWidth;
  const desktopMediaQuery = window.matchMedia('(min-width: 960px)');
  const disclaimerElement = documentRef.querySelector('[data-disclaimer]');
  const disclaimerStorageKey = 'valdoriaDisclaimerSeen';

  const wrapDiv = documentRef.createElement('div');
  wrapDiv.id = 'heygen-streaming-embed';

  const container = documentRef.createElement('div');
  container.id = 'heygen-streaming-container';

  const closeButton = documentRef.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'valdoria-avatar-close';
  closeButton.setAttribute('aria-label', 'Cerrar ventana de Val');
  closeButton.title = 'Cerrar';
  closeButton.innerHTML = '&times;';

  const placeholder = documentRef.createElement('div');
  placeholder.className = 'valdoria-avatar-placeholder';
  placeholder.setAttribute('role', 'status');
  placeholder.innerHTML = `
    <div class="valdoria-avatar-placeholder__face" aria-hidden="true">👋</div>
    <p>${LIVE_AVATAR_CONFIG.PLACEHOLDER_MESSAGE}</p>
    <small>Val volverá en cuanto le den presupuesto.</small>
  `;

  const stylesheet = documentRef.createElement('style');
  stylesheet.innerHTML = `
  #heygen-streaming-embed {
    z-index: 9999;
    position: fixed;
    left: 40px;
    bottom: 40px;
    width: 200px;
    height: 200px;
    border-radius: 50%;
    border: 2px solid #fff;
    box-shadow: 0px 8px 24px 0px rgba(0, 0, 0, 0.12);
    transition: all linear 0.1s;
    overflow: hidden;

    opacity: 0;
    visibility: hidden;
  }
  #heygen-streaming-embed.show {
    opacity: 1;
    visibility: visible;
  }
  #heygen-streaming-embed.expand {
    ${clientWidth < 540 ? 'height: 266px; width: 96%; left: 50%; transform: translateX(-50%);' : 'height: 366px; width: calc(366px * 16 / 9);'}
    border: 0;
    border-radius: 8px;
  }
  #heygen-streaming-embed.suspended {
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
  }
  #heygen-streaming-container {
    width: 100%;
    height: 100%;
  }
  #heygen-streaming-container iframe {
    width: 100%;
    height: 100%;
    border: 0;
  }
  .valdoria-avatar-close {
    display: none;
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 2;
    width: 34px;
    height: 34px;
    padding: 0;
    border: 1px solid rgba(255, 255, 255, 0.55);
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.5);
    color: #fff;
    cursor: pointer;
    font: 28px/28px Arial, sans-serif;
    transition: background 0.15s ease, transform 0.15s ease;
  }
  #heygen-streaming-embed.expand .valdoria-avatar-close {
    display: block;
  }
  .valdoria-avatar-close:hover,
  .valdoria-avatar-close:focus-visible {
    background: rgba(0, 0, 0, 0.78);
    transform: scale(1.06);
    outline: none;
  }
  .valdoria-avatar-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 24px;
    box-sizing: border-box;
    background: radial-gradient(circle at 50% 30%, #8c3047 0%, #351521 72%);
    color: #fff;
    text-align: center;
    font-family: inherit;
  }
  .valdoria-avatar-placeholder__face {
    font-size: 42px;
    line-height: 1;
  }
  .valdoria-avatar-placeholder p {
    margin: 0;
    max-width: 280px;
    font-size: 17px;
    line-height: 1.35;
    font-weight: 600;
  }
  .valdoria-avatar-placeholder small {
    max-width: 240px;
    color: rgba(255, 255, 255, 0.75);
    font-size: 12px;
    line-height: 1.4;
  }
  @media (max-width: 768px) {
    #heygen-streaming-embed {
      left: auto;
      right: 16px;
      bottom: 96px;
      width: 126px;
      height: 126px;
    }
    #heygen-streaming-embed.expand {
      bottom: 16px;
    }
  }
  @media (max-width: 540px) {
    #heygen-streaming-embed {
      bottom: 88px;
      width: 112px;
      height: 112px;
    }
    #heygen-streaming-embed.expand {
      height: min(320px, 70vh);
      width: min(360px, 94vw);
      left: 50%;
      right: auto;
      transform: translateX(-50%);
    }
  }
  @media (max-width: 400px) {
    #heygen-streaming-embed {
      bottom: 80px;
      width: 104px;
      height: 104px;
    }
  }
  `;

  let iframe = null;
  let iframeCreated = false;

  const createIframe = () => {
    if (!LIVE_AVATAR_CONFIG.ENABLED || !url) {
      return null;
    }
    if (iframeCreated || iframe) {
      return iframe;
    }
    iframe = documentRef.createElement('iframe');
    iframe.allowFullscreen = false;
    iframe.title = 'Streaming Embed';
    iframe.role = 'dialog';
    iframe.allow = 'microphone';
    iframe.src = url;
    iframe.addEventListener('load', () => {
      ready = true;
      updateBubbleVisibility();
    });
    iframeCreated = true;
    return iframe;
  };

  let visible = false;
  let ready = !LIVE_AVATAR_CONFIG.ENABLED;
  let userInitiated = desktopMediaQuery.matches;
  const heroVideos = Array.from(documentRef.querySelectorAll('.hero-video'));
  const pausedHeroVideos = new Set();
  const overrideOverlayId = 'valdoria-avatar-override';
  let suspensionTimer = null;
  let isSuspended = false;
  let restoreExpandedAfterSuspension = false;

  const pauseHeroVideos = () => {
    heroVideos.forEach((video) => {
      if (!video || typeof video.pause !== 'function') {
        return;
      }
      if (!video.paused) {
        video.pause();
        pausedHeroVideos.add(video);
      }
    });
  };

  const resumeHeroVideos = () => {
    pausedHeroVideos.forEach((video) => {
      if (!video || typeof video.play !== 'function') {
        return;
      }
      const playResult = video.play();
      if (playResult && typeof playResult.catch === 'function') {
        playResult.catch(() => {});
      }
    });
    pausedHeroVideos.clear();
  };

  const showOverrideOverlay = (message) => {
    if (!message) {
      return;
    }
    let overlay = documentRef.getElementById(overrideOverlayId);
    if (!overlay) {
      overlay = documentRef.createElement('div');
      overlay.id = overrideOverlayId;
      overlay.style.cssText = `
        position: fixed;
        left: 50%;
        bottom: 120px;
        transform: translateX(-50%);
        width: min(360px, 92vw);
        padding: 18px 20px;
        border-radius: 14px;
        background: rgba(10, 12, 20, 0.94);
        color: #ffffff;
        font: 15px/1.6 -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        box-shadow: 0 18px 48px rgba(0, 0, 0, 0.45);
        border: 1px solid rgba(255, 255, 255, 0.15);
        z-index: 10003;
        text-align: left;
      `;
    } else {
      overlay.innerHTML = '';
    }
    const title = documentRef.createElement('strong');
    title.style.display = 'block';
    title.style.fontWeight = '600';
    title.style.marginBottom = '6px';
    title.textContent = 'Respuesta en tiempo real';

    const content = documentRef.createElement('p');
    content.style.margin = '0';
    content.textContent = message;

    overlay.appendChild(title);
    overlay.appendChild(content);
    documentRef.body.appendChild(overlay);
  };

  const hideOverrideOverlay = () => {
    const overlay = documentRef.getElementById(overrideOverlayId);
    if (overlay && overlay.parentNode) {
      overlay.remove();
    }
  };

  const speakOverrideMessage = (message, onComplete) => {
    const fallbackComplete = typeof onComplete === 'function' ? onComplete : () => {};
    if (!message || typeof window.speechSynthesis === 'undefined') {
      return;
    }
    try {
      window.speechSynthesis.cancel();
    } catch (error) {
      // Ignore cancellation errors
    }
    const utterance = new window.SpeechSynthesisUtterance(message);
    utterance.lang = 'es-ES';
    utterance.rate = 0.95;
    utterance.pitch = 1;
    try {
      const voices = window.speechSynthesis.getVoices();
      const spanishVoice = voices.find((voice) => voice.lang && voice.lang.toLowerCase().startsWith('es'));
      if (spanishVoice) {
        utterance.voice = spanishVoice;
      }
    } catch (error) {
      // Ignore voice selection errors
    }
    utterance.onend = () => {
      fallbackComplete();
    };
    utterance.onerror = () => {
      fallbackComplete();
    };
    window.speechSynthesis.speak(utterance);
  };

  const resumeAvatarFromSuspension = () => {
    if (!isSuspended) {
      return;
    }
    if (suspensionTimer) {
      window.clearTimeout(suspensionTimer);
      suspensionTimer = null;
    }
    hideOverrideOverlay();
    if (iframe) {
      iframe.style.display = '';
    }
    wrapDiv.classList.remove('suspended');
    isSuspended = false;
    if (restoreExpandedAfterSuspension) {
      expandContainer();
    } else {
      updateBubbleVisibility();
    }
    restoreExpandedAfterSuspension = false;
  };

  const suspendAvatarForMessage = (message, options = {}) => {
    if (!message) {
      return;
    }
    const duration = typeof options.duration === 'number' ? options.duration : 8000;
    restoreExpandedAfterSuspension = wrapDiv.classList.contains('expand') || visible;
    collapseContainer();
    if (iframe) {
      iframe.style.display = 'none';
    }
    isSuspended = true;
    wrapDiv.classList.add('suspended');
    showOverrideOverlay(message);
    speakOverrideMessage(message, resumeAvatarFromSuspension);
    if (suspensionTimer) {
      window.clearTimeout(suspensionTimer);
    }
    suspensionTimer = window.setTimeout(resumeAvatarFromSuspension, duration);
  };

  const showContainer = () => {
    wrapDiv.classList.add('show');
  };

  const hideContainer = () => {
    wrapDiv.classList.remove('show');
  };

  const expandContainer = () => {
    showContainer();
    wrapDiv.classList.add('expand');
    visible = true;
    pauseHeroVideos();
  };

  const collapseContainer = () => {
    wrapDiv.classList.remove('expand');
    visible = false;
    userInitiated = desktopMediaQuery.matches;
    resumeHeroVideos();
    window.setTimeout(() => {
      if (visible) {
        return;
      }
      if (desktopMediaQuery.matches) {
        showContainer();
      } else {
        hideContainer();
      }
    }, 220);
  };

  const openAvatar = () => {
    initializeContainer();
    if (isSuspended) {
      resumeAvatarFromSuspension();
    }
    userInitiated = true;
    expandContainer();
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.focus();
    }
  };

  window.addEventListener('message', (event) => {
    if (event.origin !== host || !event.data || event.data.type !== 'streaming-embed') {
      return;
    }
    if (event.data.action === 'init') {
      ready = true;
      updateBubbleVisibility();
    } else if (event.data.action === 'show') {
      if (isSuspended) {
        return;
      }
      if (desktopMediaQuery.matches || userInitiated) {
        expandContainer();
      }
    } else if (event.data.action === 'hide') {
      if (isSuspended) {
        return;
      }
      collapseContainer();
    }
  });

  const initializeContainer = () => {
    if (!iframeCreated) {
      const createdIframe = createIframe();
      if (createdIframe) {
        container.appendChild(createdIframe);
      } else if (!container.contains(placeholder)) {
        container.appendChild(placeholder);
      }
    }
    if (!documentRef.body.contains(wrapDiv)) {
      wrapDiv.appendChild(stylesheet);
      wrapDiv.appendChild(closeButton);
      wrapDiv.appendChild(container);
      documentRef.body.appendChild(wrapDiv);
    }
  };

  wrapDiv.appendChild(stylesheet);
  wrapDiv.appendChild(closeButton);
  wrapDiv.appendChild(container);

  const isDisclaimerVisible = () => {
    if (!disclaimerElement) {
      return false;
    }
    const isRemoved = !documentRef.body.contains(disclaimerElement);
    const isHidden = disclaimerElement.classList.contains('disclaimer--hidden');
    const isAcknowledged = sessionStorage.getItem(disclaimerStorageKey);
    return !isRemoved && !isHidden && !isAcknowledged;
  };

  const updateBubbleVisibility = () => {
    // Never show avatar while disclaimer is visible
    if (isDisclaimerVisible()) {
      hideContainer();
      return;
    }

    if (visible) {
      showContainer();
      return;
    }
    if (desktopMediaQuery.matches) {
      showContainer();
    } else if (!userInitiated) {
      hideContainer();
    }
  };

  const triggerElements = Array.from(documentRef.querySelectorAll("[data-heygen-trigger]"));
  triggerElements.forEach((element) => {
    element.addEventListener("click", (event) => {
      event.preventDefault();
      openAvatar();
    });
    element.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openAvatar();
      }
    });
  });

  closeButton.addEventListener('click', (event) => {
    event.preventDefault();
    resumeAvatarFromSuspension();
    collapseContainer();
  });

  window.ValdoriaAvatar = Object.assign({}, window.ValdoriaAvatar, {
    open: () => {
      if (ready) {
        openAvatar();
      }
    },
    close: () => {
      resumeAvatarFromSuspension();
      collapseContainer();
    },
    isReady: () => ready,
    suspendForMessage: (message, options) => {
      suspendAvatarForMessage(message, options);
    },
    resumeSuspension: () => {
      resumeAvatarFromSuspension();
    },
    isSuspended: () => isSuspended,
  });

  const handleDesktopChange = () => {
    if (desktopMediaQuery.matches) {
      userInitiated = true;
    } else if (!visible) {
      userInitiated = false;
    }
    updateBubbleVisibility();
  };

  if (typeof desktopMediaQuery.addEventListener === 'function') {
    desktopMediaQuery.addEventListener('change', handleDesktopChange);
  } else if (typeof desktopMediaQuery.addListener === 'function') {
    desktopMediaQuery.addListener(handleDesktopChange);
  }

  // Monitor disclaimer state changes
  if (disclaimerElement) {
    const disclaimerObserver = new MutationObserver(() => {
      updateBubbleVisibility();
    });

    disclaimerObserver.observe(disclaimerElement, {
      attributes: true,
      attributeFilter: ['class', 'aria-hidden'],
      subtree: false,
    });

    // Also check periodically if disclaimer was removed from DOM
    const disclaimerCheckInterval = window.setInterval(() => {
      if (!documentRef.body.contains(disclaimerElement)) {
        window.clearInterval(disclaimerCheckInterval);
        updateBubbleVisibility();
      }
    }, 100);
  }

  updateBubbleVisibility();
}(globalThis));
