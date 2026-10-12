/* No provider request is made until the visitor loads that individual player. */
(() => {
  const el = document.documentElement.lang === 'el';
  const labels = { youtube: 'YouTube', instagram: 'Instagram', tiktok: 'TikTok' };
  function parseEmbed(value) {
    try {
      const url = new URL(value);
      if (url.protocol !== 'https:' || url.username || url.password || url.port || url.hash) return null;
      let match;
      if (['www.youtube.com', 'www.youtube-nocookie.com'].includes(url.hostname) && (match = url.pathname.match(/^\/embed\/([\w-]{11})$/))) {
        return { platform: 'youtube', src: `https://www.youtube-nocookie.com/embed/${match[1]}?rel=0`, link: `https://www.youtube.com/watch?v=${match[1]}` };
      }
      if (url.hostname === 'www.instagram.com' && (match = url.pathname.match(/^\/(?:reel|p)\/([\w-]+)\/embed\/?$/))) {
        return { platform: 'instagram', src: `https://www.instagram.com/reel/${match[1]}/embed/`, link: `https://www.instagram.com/reel/${match[1]}/` };
      }
      if (url.hostname === 'www.tiktok.com' && (match = url.pathname.match(/^\/player\/v1\/(\d{16,22})$/))) {
        return { platform: 'tiktok', src: `https://www.tiktok.com/player/v1/${match[1]}?description=1&music_info=1&rel=0`, link: `https://www.tiktok.com/@stelios.sioulas.t/video/${match[1]}` };
      }
    } catch {}
    return null;
  }
  function prompt(container) {
    const info = parseEmbed(container.dataset.embedSrc);
    if (!info) return;
    const provider = labels[info.platform];
    const content = document.createElement('div');
    content.className = 'embed-consent__prompt';
    const title = document.createElement('strong');
    title.textContent = provider;
    const note = document.createElement('p');
    note.textContent = el ? `Το ${provider} μπορεί να χρησιμοποιεί cookies.` : `${provider} may use cookies.`;
    const button = document.createElement('button');
    button.type = 'button'; button.dataset.embedLoad = '';
    button.textContent = el ? `Φόρτωση ${provider}` : `Load ${provider}`;
    const link = document.createElement('a');
    link.href = info.link; link.target = '_blank'; link.rel = 'noopener noreferrer';
    link.textContent = el ? `Άνοιγμα στο ${provider} ↗` : `Open on ${provider} ↗`;
    content.append(title, note, button, link);
    container.replaceChildren(content);
    container.dataset.embedState = 'idle';
  }
  function create(options) {
    if (!parseEmbed(options.src)) return null;
    const container = document.createElement('div');
    container.className = 'embed-consent';
    container.dataset.embedSrc = options.src;
    container.dataset.embedTitle = options.title || '';
    prompt(container);
    return container;
  }
  document.addEventListener('click', (event) => {
    const button = event.target.closest?.('[data-embed-load], [data-embed-unload]');
    const container = button?.closest('.embed-consent');
    if (!container) return;
    if (button.hasAttribute('data-embed-unload')) {
      prompt(container);
      container.querySelector('button')?.focus();
      return;
    }
    if (container.dataset.embedState === 'loaded') return;
    const info = parseEmbed(container.dataset.embedSrc);
    if (!info) return;
    const frame = document.createElement('iframe');
    frame.src = info.src;
    frame.title = container.dataset.embedTitle || labels[info.platform];
    frame.allow = 'encrypted-media; picture-in-picture; fullscreen';
    frame.allowFullscreen = true;
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    const close = document.createElement('button');
    close.type = 'button'; close.className = 'embed-consent__close'; close.dataset.embedUnload = '';
    close.textContent = el ? 'Κλείσιμο βίντεο' : 'Close video';
    container.dataset.embedState = 'loaded';
    container.replaceChildren(frame, close);
    close.focus();
  });
  window.siteEmbeds = Object.freeze({ create, parseEmbed });
})();
