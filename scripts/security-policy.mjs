import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const config = JSON.parse(await readFile('security.config.json', 'utf8'));
const check = process.argv.includes('--check');
export function policyFor(html) {
  const hashes = new Set();
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (/\bsrc\s*=/.test(match[1]) || /application\/ld\+json/i.test(match[1]) || !match[2]) continue;
    hashes.add(`'sha256-${createHash('sha256').update(match[2]).digest('base64')}'`);
  }
  const hasForm = /<form\b/.test(html);
  const hasMedia = html.includes('data-embed-src=') || /<iframe\b/.test(html);
  return [
    "default-src 'self'",
    `script-src 'self' https://static.cloudflareinsights.com/beacon.min.js ${[...hashes].sort().join(' ')}`,
    "script-src-attr 'none'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    `img-src 'self' data:${config.imageSources?.length ? ' ' + config.imageSources.join(' ') : ''}`,
    "media-src 'self'",
    `frame-src ${hasMedia ? config.frameOrigins.join(' ') : "'none'"}`,
    `connect-src 'self' https://cloudflareinsights.com/cdn-cgi/rum${hasForm ? ` ${config.formEndpoint}` : ''}`,
    `form-action ${hasForm ? config.formEndpoint : "'none'"}`,
    "object-src 'none'",
    "base-uri 'none'",
    "worker-src 'none'",
    "manifest-src 'self'",
    'upgrade-insecure-requests',
  ].join('; ');
}
let pages = 0;
for (const name of (await readdir('.')).filter(name => name.endsWith('.html'))) {
  const original = await readFile(name, 'utf8');
  if (/^google-site-verification: [\w.-]+\s*$/.test(original)) continue;
  assert.ok(!/<[^>]+\son\w+\s*=/i.test(original), `Inline event handler must be removed: ${name}`);
  const html = original
    .replace(/<meta\b[^>]*http-equiv="Content-Security-Policy"[^>]*>\s*/gi, '')
    .replace(/<meta\b[^>]*name="referrer"[^>]*>\s*/gi, '');
  const escaped = policyFor(html).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  const charset = /(<meta\b[^>]*charset=[^>]+>)\s*/i;
  assert.ok(charset.test(html), `Missing charset: ${name}`);
  const updated = html.replace(charset, `$1\n<meta http-equiv="Content-Security-Policy" content="${escaped}">\n<meta name="referrer" content="strict-origin-when-cross-origin">\n`);
  if (check) assert.equal(original, updated, `Stale CSP: run node scripts/security-policy.mjs (${name})`);
  else await writeFile(name, updated);
  pages++;
}
console.log(`${check ? 'Verified' : 'Updated'} early CSP and referrer policies for ${pages} HTML documents.`);
