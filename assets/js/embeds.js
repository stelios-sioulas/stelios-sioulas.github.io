/* Click-to-load media: local video preview images, no provider request before playback. */
(() => {
  const el = document.documentElement.lang === 'el';
  const labels = { youtube: 'YouTube', instagram: 'Instagram', tiktok: 'TikTok' };
  function parseEmbed(value) {
    try {
      const url = new URL(value);
      if (url.protocol !== 'https:' || url.username || url.password || url.port || url.hash) return null;
      let match;
      if (['www.youtube.com', 'www.youtube-nocookie.com'].includes(url.hostname) && (match = url.pathname.match(/^\/embed\/([\w-]{11})$/))) {
        return { platform: 'youtube', videoId: match[1], src: `https://www.youtube-nocookie.com/embed/${match[1]}?rel=0`, link: `https://www.youtube.com/watch?v=${match[1]}` };
      }
      if (url.hostname === 'www.instagram.com' && (match = url.pathname.match(/^\/(?:reel|p)\/([\w-]+)\/embed\/?$/))) {
        return { platform: 'instagram', videoId: match[1], src: `https://www.instagram.com/reel/${match[1]}/embed/`, link: `https://www.instagram.com/reel/${match[1]}/` };
      }
      if (url.hostname === 'www.tiktok.com' && (match = url.pathname.match(/^\/player\/v1\/(\d{16,22})$/))) {
        return { platform: 'tiktok', videoId: match[1], src: `https://www.tiktok.com/player/v1/${match[1]}?description=1&music_info=1&rel=0`, link: `https://www.tiktok.com/@stelios.sioulas.t/video/${match[1]}` };
      }
    } catch {}
    return null;
  }
  function prompt(container) {
    const info = parseEmbed(container.dataset.embedSrc);
    if (!info) return;
    const provider = labels[info.platform];
    const preview =
      info.platform === 'youtube' ? `/assets/video-thumbnails/${info.videoId}.jpg` :
      info.platform === 'instagram' && info.videoId === 'DcA1k6hNsSq' ? '/assets/video-thumbnails/instagram-featured.jpg' :
      info.platform === 'tiktok' && info.videoId === '7653913479035882774' ? '/assets/video-thumbnails/tiktok-featured.jpg' : '';
    if (preview) {
      const content = document.createElement('div');
      content.className = 'embed-consent__prompt embed-consent__prompt--preview';
      const poster = document.createElement('img');
      poster.className = 'embed-consent__thumbnail';
      poster.alt = '';
      poster.loading = 'lazy';
      poster.decoding = 'async';
      // Local previews never contact a video provider before playback.
      poster.referrerPolicy = 'no-referrer';
      poster.onerror = () => { poster.hidden = true; };
      poster.src = preview;
      const providerLabel = document.createElement('strong');
      providerLabel.className = 'embed-consent__provider';
      providerLabel.textContent = provider;
      const play = document.createElement('button');
      play.type = 'button';
      play.dataset.embedLoad = '';
      play.className = 'embed-consent__play';
      play.setAttribute('aria-label', el ? `Αναπαραγωγή: ${container.dataset.embedTitle || 'βίντεο ' + provider}` : `Play: ${container.dataset.embedTitle || provider + ' video'}`);
      const playIcon = document.createElement('span');
      playIcon.className = 'embed-consent__play-icon';
      playIcon.setAttribute('aria-hidden', 'true');
      playIcon.textContent = '▶';
      play.appendChild(playIcon);
      const notice = document.createElement('span');
      notice.className = 'embed-consent__notice';
      notice.textContent = el ? `Το ${provider} ενδέχεται να χρησιμοποιήσει cookies μετά το Play.` : `${provider} may use cookies after you press Play.`;
      const link = document.createElement('a');
      link.href = info.link;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = el ? `Άνοιγμα στο ${provider} ↗` : `Open on ${provider} ↗`;
      content.append(poster, providerLabel, play, notice, link);
      container.replaceChildren(content);
      container.dataset.embedState = 'idle';
      return;
    }
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
    frame.src = info.src + (info.platform === 'youtube' ? '&autoplay=1' : '');
    frame.title = container.dataset.embedTitle || labels[info.platform];
    frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    frame.allowFullscreen = true;
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    const close = document.createElement('button');
    close.type = 'button'; close.className = 'embed-consent__close'; close.dataset.embedUnload = '';
    close.textContent = el ? 'Κλείσιμο βίντεο' : 'Close video';
    container.dataset.embedState = 'loaded';
    container.replaceChildren(frame, close);
    close.focus();
  });
  if (typeof document.querySelectorAll === 'function') {
    document.querySelectorAll('.embed-consent[data-embed-src]').forEach(prompt);
  }
  window.siteEmbeds = Object.freeze({ create, parseEmbed });
})();
