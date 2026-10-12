/* CMS image replacements share the existing CSS layers and crops in every language. */
(function () {
  const keys = ['hero', 'about', 'projects', 'teaching', 'discography', 'live', 'media', 'contact'];
  function localImage(value) {
    if (typeof value !== 'string') return '';
    // Keep uploads on this site, inside assets, and exclude active/vector formats.
    // Do not let URL normalization hide traversal or encoded separators.
    if (!/^\/?assets\/(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_.-]+\.(?:jpe?g|png|webp|avif)$/i.test(value) || value.includes('..')) return '';
    return '/' + value.replace(/^\//, '');
  }
  fetch('data/images.json', { cache: 'no-store', credentials: 'same-origin' })
    .then(response => { if (!response.ok) throw new Error('Image data unavailable'); return response.json(); })
    .then(data => {
      if (!data || typeof data !== 'object' || Array.isArray(data)) return;
      const styles = Array.from(document.querySelectorAll('style')).map(node => node.textContent).join('\n');
      for (const key of keys) {
        if (!styles.includes('--cms-image-' + key)) continue;
        const source = localImage(data[key]?.image);
        if (!source) continue;
        const image = new Image();
        image.onload = () => document.documentElement.style.setProperty('--cms-image-' + key, 'url("' + source + '")');
        // A removed or corrupt upload leaves the working CSS fallback untouched.
        image.onerror = () => {};
        image.src = source;
      }
    }).catch(error => console.warn(error.message));
})();
