(() => {
  const homeSection = document.querySelector('#projects[data-projects-cms]');
  const pageRoot = document.body.matches('[data-projects-cms="page"]') ? document.body : null;
  if (!homeSection && !pageRoot) return;

  const language = document.documentElement.lang === 'el' ? 'el' : 'en';
  const safeUrl=value=>{const raw=typeof value==='string'?value.trim():'';if(!raw)return '';try{const parsed=new URL(raw,window.location.href);return parsed.protocol==='https:'?raw:'';}catch{return '';}};

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
  const projectDescription = (project, context) => {
    const special = value(project, context + '_description_' + language);
    return special || value(project, 'description_' + language);
  };

  const createHomeCard = project => {
    const url = safeUrl(value(project, 'url'));
    const card = document.createElement(url ? 'a' : 'article');
    card.className = 'card' + (url ? ' card-link' : '');
    if (url) {
      card.href = url;
      card.target = '_blank';
      card.rel = 'noopener noreferrer';
    }
    addTextElement(card, 'div', 'meta', value(project, 'meta_' + language));
    addTextElement(card, 'h3', '', value(project, 'name'));
    addTextElement(card, 'p', '', projectDescription(project, 'home'));
    return card;
  };

  const appendDescription = (parent, project) => {
    const description = projectDescription(project, 'page');
    if (!description) return;
    const paragraph = document.createElement('p');
    const italicText = value(project, 'italic_text');
    const index = italicText ? description.indexOf(italicText) : -1;
    if (index < 0) {
      paragraph.textContent = description;
    } else {
      paragraph.append(document.createTextNode(description.slice(0, index)));
      const emphasis = document.createElement('em');
      emphasis.textContent = italicText;
      paragraph.append(emphasis);
      paragraph.append(document.createTextNode(description.slice(index + italicText.length)));
    }
    parent.appendChild(paragraph);
  };

  const createPageProject = project => {
    const url = safeUrl(value(project, 'url'));
    const card = document.createElement(url ? 'a' : 'div');
    card.className = 'project' + (url ? '' : ' no-link');
    if (url) {
      card.href = url;
      card.target = '_blank';
      card.rel = 'noopener noreferrer';
    }

    const copy = document.createElement('div');
    addTextElement(copy, 'div', 'meta', value(project, 'meta_' + language));
    addTextElement(copy, 'h3', '', value(project, 'name'));
    appendDescription(copy, project);
    card.appendChild(copy);

    const arrow = document.createElement('div');
    arrow.className = 'arrow';
    arrow.textContent = url ? '↗' : '•';
    card.appendChild(arrow);
    return card;
  };

  fetch('data/projects.json', { cache: 'no-cache' })
    .then(response => {
      if (!response.ok) throw new Error('Projects data could not be loaded');
      return response.json();
    })
    .then(data => {
      const projects = Array.isArray(data.projects) ? data.projects : [];

      if (homeSection) {
        const settings = data.home || {};
        const mobile = homeSection.dataset.projectsCms === 'mobile';
        const label = homeSection.querySelector('.section-label');
        const title = homeSection.querySelector('h2');
        const intro = homeSection.querySelector('.section-body > p');
        const grid = homeSection.querySelector('.grid, .featured-grid');
        const button = homeSection.querySelector('.project-actions a, .view-all');

        if (label && value(settings, 'label')) label.textContent = value(settings, 'label');

        const titleText = value(settings, (mobile ? 'mobile_title_' : 'title_') + language);
        if (title && titleText) {
          title.textContent = titleText;
          if (!mobile) {
            title.setAttribute('aria-label', titleText);
            title.dataset.text = titleText;
          }
        }

        if (intro) {
          const introText = value(settings, 'intro_' + language);
          if (introText) intro.textContent = introText;
          else intro.remove();
        }

        const visibleProjects = projects.filter(project => project.group === 'current');
        if (grid) grid.replaceChildren(...visibleProjects.map(createHomeCard));

        const buttonText = value(settings, 'button_' + language);
        if (button && buttonText) {
          const textSpan = button.querySelector('span:first-child');
          if (textSpan) textSpan.textContent = buttonText;
          else button.textContent = buttonText;
        }
      }

      if (pageRoot) {
        const settings = data.page || {};
        const hero = pageRoot.querySelector('.hero');
        const eyebrow = hero && hero.querySelector('.eyebrow');
        const title = hero && hero.querySelector('h1');
        const intro = hero && hero.querySelector('p');

        if (eyebrow) {
          const text = value(settings, 'eyebrow_' + language);
          if (text) eyebrow.textContent = text;
          else eyebrow.remove();
        }
        if (title && value(settings, 'title')) title.textContent = value(settings, 'title');
        if (intro) {
          const text = value(settings, 'intro_' + language);
          if (text) intro.textContent = text;
          else intro.remove();
        }

        ['current', 'past'].forEach(group => {
          const section = pageRoot.querySelector('[data-project-group="' + group + '"]');
          if (!section) return;
          const heading = section.querySelector('h2');
          const list = section.querySelector('.list');
          const headingText = value(settings, group + '_heading_' + language);
          if (heading && headingText) heading.textContent = headingText;
          if (list) {
            const items = projects.filter(project => project.group === group);
            list.replaceChildren(...items.map(createPageProject));
          }
        });
      }
    })
    .catch(error => {
      console.warn(error.message);
    });
})();
