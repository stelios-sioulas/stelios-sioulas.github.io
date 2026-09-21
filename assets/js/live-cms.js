(() => {
  const section = document.querySelector('#live[data-live-cms]');
  if (!section) return;

  const language = document.documentElement.lang === 'el' ? 'el' : 'en';
  const mobile = section.dataset.liveCms === 'mobile';
  const fullPage = section.dataset.liveCms === 'page';
  const value = (item, key) => {
    const result = item && item[key];
    return typeof result === 'string' ? result.trim() : '';
  };
  const eventDateParts = event => {
    const raw = value(event, 'event_date');
    const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
      return {
        day: value(event, 'day'),
        label: value(event, 'date_' + language)
      };
    }
    const year = Number(match[1]);
    const monthIndex = Number(match[2]) - 1;
    const date = new Date(year, monthIndex, Number(match[3]));
    const greekMonths = [
      'Ιανουαρίου', 'Φεβρουαρίου', 'Μαρτίου', 'Απριλίου',
      'Μαΐου', 'Ιουνίου', 'Ιουλίου', 'Αυγούστου',
      'Σεπτεμβρίου', 'Οκτωβρίου', 'Νοεμβρίου', 'Δεκεμβρίου'
    ];
    return {
      day: match[3],
      label: language === 'el'
        ? greekMonths[monthIndex] + ' ' + year
        : new Intl.DateTimeFormat('en-US', {
            month: 'long',
            year: 'numeric'
          }).format(date)
    };
  };
  const addTextElement = (parent, tag, className, text) => {
    if (!text) return null;
    const element = document.createElement(tag);
    if (className) element.className = className;
    element.textContent = text;
    parent.appendChild(element);
    return element;
  };

  const todayKey = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
  };

  const validDatedEvents = events => events.filter(event =>
    /^\d{4}-\d{2}-\d{2}$/.test(value(event, 'event_date'))
  );

  const upcomingEvents = events => validDatedEvents(events)
    .filter(event => value(event, 'event_date') >= todayKey())
    .sort((a, b) => value(a, 'event_date').localeCompare(value(b, 'event_date')));

  const pastEvents = events => validDatedEvents(events)
    .filter(event => value(event, 'event_date') < todayKey())
    .sort((a, b) => value(b, 'event_date').localeCompare(value(a, 'event_date')));

  const createEmptyState = () => {
    const empty = document.createElement('div');
    empty.className = 'live-empty';
    addTextElement(
      empty,
      'div',
      'meta',
      language === 'el' ? 'Μεινε συντονισμενος' : 'Stay tuned'
    );
    addTextElement(
      empty,
      'h3',
      '',
      language === 'el' ? 'Νεες live ημερομηνιες συντομα' : 'New live dates coming soon'
    );
    addTextElement(
      empty,
      'p',
      '',
      language === 'el'
        ? 'Τα τύμπανα κάνουν ένα μικρό διάλειμμα… Οι επόμενες live ημερομηνίες έρχονται σύντομα!'
        : 'The drums are taking a short break… New live dates are coming soon!'
    );
    return empty;
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
      card.style.setProperty('--event-origin', focusX + '% ' + focusY + '%');
      card.style.setProperty('--event-zoom', String(1.025 + (zoom - 100) / 100));
    }

    if (url) {
      card.href = url;
      card.target = '_blank';
      card.rel = 'noopener';
      const ariaLabel = value(event, 'aria_label_' + language);
      if (ariaLabel) card.setAttribute('aria-label', ariaLabel);
    }

    const dateParts = eventDateParts(event);
    const date = document.createElement('div');
    date.className = 'event-date';
    addTextElement(date, 'strong', '', dateParts.day);
    addTextElement(date, 'span', '', dateParts.label);
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
      card.style.setProperty('--event-origin', focusX + '% ' + focusY + '%');
      card.style.setProperty('--event-zoom', String(1.025 + (zoom - 100) / 100));
    }

    if (url) {
      card.href = url;
      card.target = '_blank';
      card.rel = 'noopener';
      const ariaLabel = value(event, 'aria_label_' + language);
      if (ariaLabel) card.setAttribute('aria-label', ariaLabel);
    }

    const dateParts = eventDateParts(event);
    const date = document.createElement('div');
    date.className = 'event-date';
    date.append(document.createTextNode(dateParts.day));
    addTextElement(date, 'span', '', dateParts.label);
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
  const createArchive = events => {
    if (!events.length) return null;

    const archive = document.createElement('section');
    archive.className = 'live-archive';
    archive.setAttribute('aria-labelledby', 'live-archive-title');

    const header = document.createElement('div');
    header.className = 'live-archive-header';

    const heading = document.createElement('h2');
    heading.id = 'live-archive-title';
    heading.textContent = language === 'el' ? 'Προηγούμενες εμφανίσεις' : 'Past live dates';
    header.appendChild(heading);

    const count = document.createElement('p');
    count.className = 'live-archive-count';
    count.textContent = language === 'el'
      ? events.length === 1
        ? '1 προηγούμενη εμφάνιση'
        : events.length + ' προηγούμενες εμφανίσεις'
      : events.length === 1
        ? '1 past show'
        : events.length + ' past shows';
    header.appendChild(count);
    archive.appendChild(header);

    const list = document.createElement('div');
    list.className = 'event-list live-archive-list';
    list.id = 'live-archive-list';

    const cards = events.map(event => {
      const card = createDesktopEvent(event);
      card.classList.add('event-card-past');
      return card;
    });
    cards.forEach((card, index) => {
      if (index >= 3) card.hidden = true;
    });
    list.append(...cards);
    archive.appendChild(list);

    if (events.length > 3) {
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'live-archive-toggle';
      toggle.setAttribute('aria-controls', list.id);
      let expanded = false;

      const updateToggle = () => {
        cards.slice(3).forEach(card => {
          card.hidden = !expanded;
        });
        toggle.setAttribute('aria-expanded', String(expanded));
        toggle.textContent = expanded
          ? language === 'el' ? 'Εμφάνιση λιγότερων' : 'Show fewer'
          : language === 'el' ? 'Προβολή όλων (' + events.length + ')' : 'View all (' + events.length + ')';
      };

      toggle.addEventListener('click', () => {
        expanded = !expanded;
        updateToggle();
      });
      updateToggle();
      archive.appendChild(toggle);
    }

    return archive;
  };

  fetch('data/live.json', { cache: 'no-cache' })
    .then(response => {
      if (!response.ok) throw new Error('LIVE data could not be loaded');
      return response.json();
    })
    .then(data => {
      const settings = data.section || {};
      const sourceEvents = Array.isArray(data.events) ? data.events : [];
      const allUpcoming = upcomingEvents(sourceEvents);
      const allPast = fullPage ? pastEvents(sourceEvents) : [];
      const events = fullPage ? allUpcoming : allUpcoming.slice(0, 2);
      const label = section.querySelector('.section-label');
      if (label && value(settings, 'label')) {
        label.textContent = value(settings, 'label');
      }

      if (mobile) {
        const title = section.querySelector('h2');
        const mobileTitle = value(settings, 'mobile_title_' + language);
        if (title && mobileTitle) title.textContent = mobileTitle;

        section.querySelectorAll('.event-card, .live-empty').forEach(card => card.remove());
        const photo = section.querySelector('.photo-live');
        const moreLink = section.querySelector('.view-all.page-link');
        const fragment = document.createDocumentFragment();
        if (events.length) events.forEach(event => fragment.appendChild(createMobileEvent(event)));
        else fragment.appendChild(createEmptyState());
        if (moreLink) moreLink.before(fragment);
        else if (photo) photo.before(fragment);
      } else {
        const title = section.querySelector('h2');
        const desktopTitle = value(settings, 'title_' + language);
        if (title && desktopTitle) {
          title.textContent = desktopTitle;
          title.setAttribute('aria-label', desktopTitle);
          title.dataset.text = desktopTitle;
        }

        const body = section.querySelector('.section-body');
        const intro = fullPage
          ? section.querySelector('.hero p')
          : body && body.querySelector(':scope > p');
        const introText = value(settings, 'intro_' + language);
        if (intro) {
          if (introText) intro.textContent = introText;
          else intro.remove();
        }

        const list = section.querySelector('.event-list');
        if (list) {
          list.replaceChildren(...(
            events.length
              ? events.map(createDesktopEvent)
              : [createEmptyState()]
          ));

          section.querySelector('.live-archive')?.remove();
          if (fullPage) {
            const archive = createArchive(allPast);
            if (archive) list.after(archive);
          }
        }

        const highlight = section.querySelector(fullPage ? '.history' : '.placeholder');
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
