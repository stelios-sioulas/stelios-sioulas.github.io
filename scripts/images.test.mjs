import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { test } from 'node:test';
const source = await readFile('assets/js/images-cms.js', 'utf8');
async function run(data, fails = false, available = true) {
  const writes = [], requests = [];
  class Image {
    set src(url) { requests.push(url); if (fails) this.onerror(); else this.onload(); }
  }
  vm.runInNewContext(source, { Image, console: { warn() {} },
    document: { querySelectorAll: () => [{ textContent: '--cms-image-hero --cms-image-about' }],
      documentElement: { style: { setProperty: (...args) => writes.push(args) } } },
    fetch: async () => ({ ok: available, json: async () => data }),
  });
  await new Promise(resolve => setImmediate(resolve));
  return { writes, requests };
}
test('local raster images load before replacing CSS; unused section images are skipped', async () => {
  const result = await run({ hero: { image: '/assets/new-photo.webp' }, about: { image: 'assets/portrait.jpg' }, media: { image: '/assets/unused.png' } });
  assert.deepEqual(result.requests, ['/assets/new-photo.webp', '/assets/portrait.jpg']);
  assert.deepEqual(result.writes, [['--cms-image-hero', 'url("/assets/new-photo.webp")'], ['--cms-image-about', 'url("/assets/portrait.jpg")']]);
});
test('invalid or broken images and malformed/missing CMS data leave CSS fallbacks intact', async () => {
  for (const image of ['', '//evil.invalid/assets/a.jpg', 'https://evil.invalid/a.jpg', 'javascript:alert(1)', 'data:image/png;base64,a', '/assets/../a.jpg', '/assets/%2e%2e/a.jpg', '/assets/a.svg', '/assets/a.jpg?x=1', '/assets/a.jpg\"))']) {
    assert.equal((await run({ hero: { image } })).writes.length, 0, image);
    assert.equal((await run({ hero: { image } })).requests.length, 0, image);
  }
  for (const data of [null, [], {}, { hero: { image: 123 } }]) assert.equal((await run(data)).writes.length, 0);
  assert.equal((await run({ hero: { image: '/assets/broken.png' } }, true)).writes.length, 0);
  assert.equal((await run({}, false, false)).writes.length, 0);
});
