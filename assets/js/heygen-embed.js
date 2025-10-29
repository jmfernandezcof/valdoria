// HeyGen streaming avatar embed for Valdoria
(function (window) {
  const host = 'https://labs.heygen.com';
  const url =
    host +
    '/guest/streaming-embed?share=eyJxdWFsaXR5IjoiaGlnaCIsImF2YXRhck5hbWUiOiI0MDA4ZDg0ZThlOWI0YzQ0OTc1MDMzY2Y5%0D%0ANjYxNzgxMyIsInByZXZpZXdJbWciOiJodHRwczovL2ZpbGVzMi5oZXlnZW4uYWkvYXZhdGFyL3Yz%0D%0ALzQwMDhkODRlOGU5YjRjNDQ5NzUwMzNjZjk2NjE3ODEzL2Z1bGwvMi4yL3ByZXZpZXdfdGFyZ2V0%0D%0ALndlYnAiLCJuZWVkUmVtb3ZlQmFja2dyb3VuZCI6ZmFsc2UsImtub3dsZWRnZUJhc2VJZCI6ImI2%0D%0AOTgyNjM1NDdiMTQ4ODliNTA0NTVmNTdlZGEwNGE3IiwidXNlcm5hbWUiOiIyMTI1OTIxMTkxNWI0%0D%0AMWYwOTZlM2M4OWM5ZDViZGNkZSJ9&inIFrame=1';

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
  #heygen-streaming-container {
    width: 100%;
    height: 100%;
  }
  #heygen-streaming-container iframe {
    width: 100%;
    height: 100%;
    border: 0;
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

  const iframe = documentRef.createElement('iframe');
  iframe.allowFullscreen = false;
  iframe.title = 'Streaming Embed';
  iframe.role = 'dialog';
  iframe.allow = 'microphone';
  iframe.src = url;

  let visible = false;
  let ready = false;
  let userInitiated = desktopMediaQuery.matches;
  const heroVideos = Array.from(documentRef.querySelectorAll('.hero-video'));
  const pausedHeroVideos = new Set();

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
      if (desktopMediaQuery.matches || userInitiated) {
        expandContainer();
      }
    } else if (event.data.action === 'hide') {
      collapseContainer();
    }
  });

  iframe.addEventListener('load', () => {
    ready = true;
    updateBubbleVisibility();
  });

  container.appendChild(iframe);
  wrapDiv.appendChild(stylesheet);
  wrapDiv.appendChild(container);
  documentRef.body.appendChild(wrapDiv);

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

  const triggerElements = Array.from(documentRef.querySelectorAll('[data-heygen-trigger]'));
  triggerElements.forEach((element) => {
    element.addEventListener('click', (event) => {
      event.preventDefault();
      if (!ready) {
        return;
      }
      openAvatar();
    });
    element.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        if (!ready) {
          return;
        }
        openAvatar();
      }
    });
  });

  window.ValdoriaAvatar = Object.assign({}, window.ValdoriaAvatar, {
    open: () => {
      if (ready) {
        openAvatar();
      }
    },
    close: () => {
      collapseContainer();
    },
    isReady: () => ready,
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
