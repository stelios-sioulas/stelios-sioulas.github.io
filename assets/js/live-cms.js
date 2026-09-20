(() => {
  const section = document.querySelector('#live[data-live-cms]');
  if (!section) return;

  const language = document.documentElement.lang === 'el' ? 'el' : 'en';
  const mobile = section.dataset.liveCms === 'mobile';
  const value = (item, key) => {
    const result = item && item[key];
    return typeof result === 'string' ? result.trim() : '';
  };
  const addTextElement = (parent, tag, className, text) => {
    if (!text) return null;
    const element = document.createElement(tag);
    if (className) element.className = className;
    element.textContent = text;
    parent.appendChild(element);
    return element;
  };

  const createDesktopEvent = event => {
    const url = value(event, 'url_' + language) || value(event, 'url');
    const card = document.createElement(url ? 'a' : 'article');
    const poster = value(event, 'poster');
    card.className = 'event-card' + (url ? ' event-card-link' : '') + (poster ? ' event-art' : '');
    if (poster) {
      card.style.setProperty('--event-poster', 'url(' + JSON.stringify(poster) + ')');
      const focusX = Number.isFinite(Number(event.focus_x)) ? Math.min(100, Math.max(0, Number(event.focus_x))) : 50;
      const focusY = Number.isFinite(Number(event.focus_y)) ? Math.min(100, Math.max(0, Number(event.focus_y))) : 50;
      const zoom = Number.isFinite(Number(event.zoom)) ? Math.min(180, Math.max(100, Number(event.zoom))) : 100;
      card.style.setProperty('--event-position', focusX + '% ' + focusY + '%');
      card.style.setProperty('--event-zoom', String(1.025 + (zoom - 100) / 100));
    }

    if (url) {
      card.href = url;
      card.target = '_blank';
      card.rel = 'noopener';
      const ariaLabel = value(event, 'aria_label_' + language);
      if (ariaLabel) card.setAttribute('aria-label', ariaLabel);
    }

    const date = document.createElement('div');
    date.className = 'event-date';
    addTextElement(date, 'strong', '', value(event, 'day'));
    addTextElement(date, 'span', '', value(event, 'date_' + language));
    card.appendChild(date);

    const copy = document.createElement('div');
    copy.className = 'event-copy';
    addTextElement(copy, 'div', 'meta', value(event, 'venue_' + language));
    addTextElement(copy, 'h3', '', value(event, 'title'));
    addTextElement(copy, 'p', '', value(event, 'description_' + language));
    addTextElement(
      copy,
      'p',
      'event-role',
      language === 'el' ? 'Ο Stelios Sioulas στα ντραμς.' : 'Stelios Sioulas on drums.'
    );
    card.appendChild(copy);

    return card;
  };

  const createMobileEvent = event => {
    const url = value(event, 'url_' + language) || value(event, 'url');
    const card = document.createElement(url ? 'a' : 'article');
    const poster = value(event, 'poster');
    card.className = 'event-card' + (url ? ' event-card-link' : '') + (poster ? ' event-art' : '');
    if (poster) {
      card.style.setProperty('--event-poster', 'url(' + JSON.stringify(poster) + ')');
      const focusX = Number.isFinite(Number(event.focus_x)) ? Math.min(100, Math.max(0, Number(event.focus_x))) : 50;
      const focusY = Number.isFinite(Number(event.focus_y)) ? Math.min(100, Math.max(0, Number(event.focus_y))) : 50;
      const zoom = Number.isFinite(Number(event.zoom)) ? Math.min(180, Math.max(100, Number(event.zoom))) : 100;
      card.style.setProperty('--event-position', focusX + '% ' + focusY + '%');
      card.style.setProperty('--event-zoom', String(1.025 + (zoom - 100) / 100));
    }

    if (url) {
      card.href = url;
      card.target = '_blank';
      card.rel = 'noopener';
      const ariaLabel = value(event, 'aria_label_' + language);
      if (ariaLabel) card.setAttribute('aria-label', ariaLabel);
    }

    const date = document.createElement('div');
    date.className = 'event-date';
    date.append(document.createTextNode(value(event, 'day')));
    addTextElement(date, 'span', '', value(event, 'date_' + language));
    card.appendChild(date);

    addTextElement(
      card,
      'h3',
      '',
      value(event, 'mobile_title_' + language) || value(event, 'title')
    );
    addTextElement(card, 'p', '', value(event, 'mobile_description_' + language));

    return card;
  };

  fetch('data/live.json', { cache: 'no-cache' })
    .then(response => {
      if (!response.ok) throw new Error('LIVE data could not be loaded');
      return response.json();
    })
    .then(data => {
      const settings = data.section || {};
      const events = Array.isArray(data.events) ? data.events : [];
      const label = section.querySelector('.section-label');
      if (label && value(settings, 'label')) {
        label.textContent = value(settings, 'label');
      }

      if (mobile) {
        const title = section.querySelector('h2');
        const mobileTitle = value(settings, 'mobile_title_' + language);
        if (title && mobileTitle) title.textContent = mobileTitle;

        section.querySelectorAll('.event-card').forEach(card => card.remove());
        const photo = section.querySelector('.photo-live');
        const fragment = document.createDocumentFragment();
        events.forEach(event => fragment.appendChild(createMobileEvent(event)));
        if (photo) photo.before(fragment);
      } else {
        const title = section.querySelector('h2');
        const desktopTitle = value(settings, 'title_' + language);
        if (title && desktopTitle) {
          title.textContent = desktopTitle;
          title.setAttribute('aria-label', desktopTitle);
          title.dataset.text = desktopTitle;
        }

        const body = section.querySelector('.section-body');
        const intro = body && body.querySelector(':scope > p');
        const introText = value(settings, 'intro_' + language);
        if (intro) {
          if (introText) intro.textContent = introText;
          else intro.remove();
        }

        const list = section.querySelector('.event-list');
        if (list) {
          list.replaceChildren(...events.map(createDesktopEvent));
        }

        const highlight = section.querySelector('.placeholder');
        const highlightText = value(data, 'highlight_' + language);
        if (highlight) {
          if (highlightText) highlight.textContent = highlightText;
          else highlight.remove();
        }
      }
    })
    .catch(error => {
      console.warn(error.message);
    });
})();
