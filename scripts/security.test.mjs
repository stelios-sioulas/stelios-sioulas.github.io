import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile, readdir, access } from 'node:fs/promises';
import vm from 'node:vm';
import path from 'node:path';
const config = JSON.parse(await readFile('security.config.json', 'utf8'));

test('production analytics has separate tokens and skips previews and duplicates', async () => {
  const source = await readFile('assets/js/web-analytics.js', 'utf8');
  for (const [hostname, protocol, duplicate, count] of [
    [config.hosts[0], 'https:', false, 1], [config.hosts[1], 'https:', false, 1],
    [config.hosts[0], 'http:', false, 0], [config.hosts[0], 'https:', true, 0],
    ['localhost', 'https:', false, 0], ['preview.workers.dev', 'https:', false, 0],
    [config.hosts[0] + '.invalid', 'https:', false, 0],
  ]) {
    const calls = [];
    vm.runInNewContext(source, { location: { hostname, protocol }, document: {
      querySelector: () => duplicate ? {} : null,
      createElement: () => ({ setAttribute(k,v) { this[k]=v; } }),
      body: { append: el => calls.push(el) },
    }});
    assert.equal(calls.length, count);
    if (count) {
      assert.equal(JSON.parse(calls[0]['data-cf-beacon']).token, config.token);
      assert.equal(calls[0].src, 'https://static.cloudflareinsights.com/beacon.min.js');
    }
  }
});

test('every deployed page has early CSP, usable local assets and no inline handlers', async () => {
  for (const file of (await readdir('.')).filter(f => f.endsWith('.html'))) {
    const html = await readFile(file, 'utf8');
    if (/^google-site-verification:/.test(html)) continue;
    const policies = [...html.matchAll(/<meta http-equiv="Content-Security-Policy" content="([^"]+)"/g)];
    assert.equal(policies.length, 1, file);
    assert.ok(html.indexOf(policies[0][0]) < html.search(/<(?:script|style|link)\b/i), file);
    assert.ok(!/script-src[^;]*(?:unsafe-inline|unsafe-eval|\*)/.test(policies[0][1]));
    assert.ok(!/<[^>]+\son\w+\s*=/i.test(html));
    for (const match of html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/gi)) {
      const url = new URL(match[1], 'https://site.invalid/');
      assert.equal(url.origin, 'https://site.invalid', 'Only the local analytics loader may insert a reviewed external script');
      await access(path.join('.', decodeURIComponent(url.pathname)));
    }
    for (const match of html.matchAll(/<form\b[^>]*\baction="([^"]+)"/gi)) assert.equal(match[1], config.formEndpoint);
    if (config.clickToLoad) assert.ok(!/<iframe\b[^>]*\bsrc=/i.test(html), `Automatic frame: ${file}`);
  }
});

if (config.clickToLoad) test('embed URLs accept reviewed players and reject lookalikes and active schemes', async () => {
  const context = { window: {}, URL, document: { documentElement: { lang: 'en' }, addEventListener() {} } };
  vm.runInNewContext(await readFile('assets/js/embeds.js', 'utf8'), context);
  const parse = context.window.siteEmbeds.parseEmbed;
  for (const src of ['https://www.youtube.com/embed/tdMbeJyw7nE', 'https://www.instagram.com/reel/DcA1k6hNsSq/embed/', 'https://www.tiktok.com/player/v1/7653913479035882774']) assert.ok(parse(src));
  assert.equal(parse('https://www.youtube.com/embed/tdMbeJyw7nE').src, 'https://www.youtube-nocookie.com/embed/tdMbeJyw7nE?rel=0');
  for (const src of ['javascript:alert(1)', 'http://www.youtube.com/embed/tdMbeJyw7nE', 'https://www.youtube.com.attacker.invalid/embed/tdMbeJyw7nE', 'https://evil.invalid/embed/tdMbeJyw7nE', 'https://user@www.youtube.com/embed/tdMbeJyw7nE', 'https://www.youtube.com:8443/embed/tdMbeJyw7nE', 'https://www.youtube.com/embed/bad']) assert.equal(parse(src), null);
  const cms = await readFile('assets/js/media-cms.js', 'utf8');
  assert.ok(!cms.includes("createElement('iframe')"));
});

if (!config.clickToLoad) test('contact rejects ambiguous responses, omits credentials and aborts timeouts', async () => {
  const code = await readFile('assets/js/contact-request.js', 'utf8');
  for (const [response, success] of [
    [Response.json({ ok: true }), true], [Response.json({ ok: false }), false],
    [Response.json({ ok: true, errors: ['error'] }), false], [new Response('<html>challenge</html>'), false],
    [Response.json({ ok: true }, {status: 503}), false],
  ]) {
    let requests = 0, cleared = false;
    const data = new FormData();
    const context = { window: {}, AbortController, setTimeout: (_fn, ms) => { assert.equal(ms,20000); return 1; }, clearTimeout: () => { cleared=true; }, fetch: async (url, options) => {
      requests++; assert.equal(url,config.formEndpoint); assert.equal(options.method,'POST');
      assert.equal(options.body,data); assert.equal(options.credentials,'omit');
      assert.equal(options.redirect,'error'); assert.equal(options.referrerPolicy,'no-referrer');
      return response;
    }};
    vm.runInNewContext(code,context);
    if (success) await context.window.siteContact.submit(config.formEndpoint,data);
    else await assert.rejects(context.window.siteContact.submit(config.formEndpoint,data));
    assert.equal(requests,1); assert.ok(cleared);
    await assert.rejects(context.window.siteContact.submit('https://attacker.invalid',data)); assert.equal(requests,1);
  }
  let abort, cleared=false;
  const context={window:{},AbortController,setTimeout:fn=>{abort=fn;return 1;},clearTimeout:()=>{cleared=true;},fetch:async (_url,options)=>new Promise((_resolve,reject)=>options.signal.addEventListener('abort',()=>reject(new Error('Aborted'))))};
  vm.runInNewContext(code,context);
  const pending=context.window.siteContact.submit(config.formEndpoint,new FormData());abort();
  await assert.rejects(pending,/Aborted/);assert.ok(cleared);
});
