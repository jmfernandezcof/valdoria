document.addEventListener('DOMContentLoaded', () => {
  const mobileViewportQuery = window.matchMedia('(max-width: 960px)');
  const isMobileViewport = () => mobileViewportQuery.matches;

  let navControls = [];

  function updateBodyState() {
    const anyOpen = navControls.some(({ nav }) => nav.classList.contains('nav--open'));
    document.body.classList.toggle('menu-open', anyOpen);
  }

  navControls = Array.from(document.querySelectorAll('.nav'))
    .map((nav) => {
      const toggle = nav.querySelector('.nav__toggle');
      const menu = nav.querySelector('.nav__links');

      if (!toggle || !menu) {
        return null;
      }

      toggle.setAttribute('aria-expanded', toggle.getAttribute('aria-expanded') || 'false');
      toggle.setAttribute('aria-label', toggle.getAttribute('aria-label') || 'Abrir menú');

      const setState = (isOpen) => {
        const shouldOpen = isOpen && isMobileViewport();
        nav.classList.toggle('nav--open', shouldOpen);
        toggle.setAttribute('aria-expanded', String(shouldOpen));
        toggle.setAttribute('aria-label', shouldOpen ? 'Cerrar menú' : 'Abrir menú');
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

  if (!navControls.length) {
    return;
  }

  const syncMenusWithViewport = () => {
    navControls.forEach(({ setState }) => setState(false));
  };

  syncMenusWithViewport();

  const handleBreakpointChange = () => {
    syncMenusWithViewport();
  };

  if (typeof mobileViewportQuery.addEventListener === 'function') {
    mobileViewportQuery.addEventListener('change', handleBreakpointChange);
  } else if (typeof mobileViewportQuery.addListener === 'function') {
    mobileViewportQuery.addListener(handleBreakpointChange);
  }

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') {
      return;
    }

    const activeControl = navControls.find(({ nav }) => nav.classList.contains('nav--open'));
    if (activeControl) {
      activeControl.closeMenu(true);
    }
  });
});
