(() => {
  const infoDataPath = 'data/info.json';
  const weatherContainer = document.querySelector('[data-info-weather]');
  const weatherUpdatedNodes = document.querySelectorAll('[data-info-weather-updated]');
  const eventsContainer = document.querySelector('[data-info-events]');
  const eventsUpdatedNodes = document.querySelectorAll('[data-info-events-updated]');

  if (!weatherContainer || !eventsContainer) {
    return;
  }

  const getCurrentLanguage = () => document.body.getAttribute('data-lang') || 'es';

  const formatDate = (isoString, lang) => {
    if (!isoString) {
      return null;
    }
    try {
      const date = new Date(isoString);
      if (Number.isNaN(date.valueOf())) {
        return null;
      }
      return new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return null;
    }
  };

  const renderWeather = (weatherData) => {
    const lang = getCurrentLanguage();
    const icon = weatherData?.icon || 'ℹ️';
    const temperature = typeof weatherData?.temperature_c === 'number' ? `${weatherData.temperature_c}°C` : '--';
    const description =
      (lang === 'en' ? weatherData?.description_en : weatherData?.description_es) ||
      (lang === 'en' ? 'Weather information unavailable.' : 'Información meteorológica no disponible.');

    weatherContainer.innerHTML = `
      <div class="info-weather">
        <div class="info-weather__icon" aria-hidden="true">${icon}</div>
        <div class="info-weather__details">
          <p class="info-weather__temperature">${temperature}</p>
          <p class="info-weather__description">${description}</p>
        </div>
      </div>
    `;

    const formattedDate = formatDate(weatherData?.updated_at || weatherData?.timestamp, lang);
    const updatedLabel = formattedDate
      ? lang === 'en'
        ? `Updated ${formattedDate}`
        : `Actualizado ${formattedDate}`
      : lang === 'en'
        ? 'Update pending'
        : 'Actualización pendiente';

    weatherUpdatedNodes.forEach((node) => {
      if (node.getAttribute('lang') === lang) {
        node.textContent = updatedLabel;
        node.hidden = false;
      } else {
        node.hidden = true;
      }
    });
  };

  const renderWeatherFallback = () => {
    const lang = getCurrentLanguage();
    weatherContainer.innerHTML =
      lang === 'en'
        ? '<p class="info-card__status">Unable to retrieve weather data at this time.</p>'
        : '<p class="info-card__status">No ha sido posible obtener la información meteorológica.</p>';
    weatherUpdatedNodes.forEach((node) => {
      node.hidden = node.getAttribute('lang') !== lang;
      if (!node.hidden) {
        node.textContent = lang === 'en' ? 'Last update unavailable' : 'Última actualización no disponible';
      }
    });
  };

  const renderEvents = (eventsData = []) => {
    const lang = getCurrentLanguage();

    if (!Array.isArray(eventsData) || !eventsData.length) {
      eventsContainer.innerHTML =
        lang === 'en'
          ? '<p class="info-card__status">No scheduled events found for the next few days.</p>'
          : '<p class="info-card__status">No se han encontrado eventos programados para los próximos días.</p>';
      return;
    }

    const items = eventsData
      .map((event) => {
        const title = lang === 'en' ? event.title_en || event.title_es : event.title_es || event.title_en;
        const summary =
          lang === 'en' ? event.summary_en || event.summary_es || '' : event.summary_es || event.summary_en || '';
        const date = formatDate(event.date || event.timestamp, lang);
        const location = event.location || '';
        const url = event.url;

        return `
          <article class="info-event">
            <header class="info-event__header">
              <p class="info-event__date">${date}</p>
              <h3 class="info-event__title">${title || (lang === 'en' ? 'Untitled event' : 'Evento sin título')}</h3>
            </header>
            <p class="info-event__summary">${summary}</p>
            <p class="info-event__meta">${location}</p>
            ${
              url
                ? `<a class="info-event__link" href="${url}" target="_blank" rel="noopener noreferrer">${
                    lang === 'en' ? 'More details' : 'Más detalles'
                  }</a>`
                : ''
            }
          </article>
        `;
      })
      .join('');

    eventsContainer.innerHTML = `<div class="info-event-list">${items}</div>`;
  };

  const renderEventsFallback = () => {
    const lang = getCurrentLanguage();
    eventsContainer.innerHTML =
      lang === 'en'
        ? '<p class="info-card__status">Unable to retrieve event listings at this time.</p>'
        : '<p class="info-card__status">No ha sido posible obtener la agenda de eventos.</p>';
    eventsUpdatedNodes.forEach((node) => {
      node.hidden = node.getAttribute('lang') !== lang;
      if (!node.hidden) {
        node.textContent = lang === 'en' ? 'Last update unavailable' : 'Última actualización no disponible';
      }
    });
  };

  const applyLanguageToggle = () => {
    const lang = getCurrentLanguage();
    weatherUpdatedNodes.forEach((node) => {
      node.hidden = node.getAttribute('lang') !== lang;
    });
    eventsUpdatedNodes.forEach((node) => {
      node.hidden = node.getAttribute('lang') !== lang;
    });
  };

  const handleLanguageChange = () => {
    applyLanguageToggle();
  };

  // Observe language changes
  const langObserver = new MutationObserver(handleLanguageChange);
  langObserver.observe(document.body, { attributes: true, attributeFilter: ['data-lang'] });

  const fetchInfoData = () => {
    const url = `${infoDataPath}?_=${Date.now()}`;
    return fetch(url, { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to retrieve info data from ${url}`);
        }
        return response.json();
      })
      .catch((error) => {
        console.error('[Info] Unable to load data', error);
        throw error;
      });
  };

  fetchInfoData()
    .then((data) => {
      if (data?.weather) {
        renderWeather(data.weather);
      } else {
        renderWeatherFallback();
      }

      if (data?.events?.items) {
        renderEvents(data.events.items);
      } else if (Array.isArray(data?.events)) {
        renderEvents(data.events);
      } else {
        renderEventsFallback();
      }

      const lang = getCurrentLanguage();
      const eventsUpdated =
        data?.events?.updated_at || data?.events_updated_at || data?.updated_at || data?.timestamp || '';
      const weatherUpdated = data?.weather?.updated_at || data?.weather?.timestamp || data?.updated_at || '';

    const formattedEventsDate = formatDate(eventsUpdated, lang);
    const eventsLabel = formattedEventsDate
      ? lang === 'en'
        ? `Updated ${formattedEventsDate}`
        : `Actualizado ${formattedEventsDate}`
      : lang === 'en'
        ? 'Update pending'
        : 'Actualización pendiente';
      const formattedWeatherDate = formatDate(weatherUpdated, lang);
      const weatherLabel = formattedWeatherDate
        ? lang === 'en'
          ? `Updated ${formattedWeatherDate}`
          : `Actualizado ${formattedWeatherDate}`
        : lang === 'en'
          ? 'Update pending'
          : 'Actualización pendiente';

      eventsUpdatedNodes.forEach((node) => {
        if (node.getAttribute('lang') === lang) {
          node.textContent = eventsLabel;
          node.hidden = false;
        } else {
          node.hidden = true;
        }
      });

      weatherUpdatedNodes.forEach((node) => {
        if (node.getAttribute('lang') === lang) {
          node.textContent = weatherLabel;
          node.hidden = false;
        } else {
          node.hidden = true;
        }
      });
    })
    .catch(() => {
      renderWeatherFallback();
      renderEventsFallback();
    })
    .finally(() => {
      applyLanguageToggle();
    });
})();
