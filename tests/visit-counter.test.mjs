import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { createCounterHandler, recordPageLoad } from '../netlify/lib/visit-counter.mjs';

const origin = 'https://lucy-awakening.netlify.app';
const context = { deploy: { context: 'production', published: true } };
const read = name => readFileSync(new URL('../' + name, import.meta.url), 'utf8');
const request = (path, { headers, method } = {}) => new Request(origin + path, { headers, method });

function mock() {
  const values = new Map();
  let writes = 0;
  return {
    values,
    get writes() { return writes; },
    async get(key, options) {
      assert.equal(options.consistency, 'strong');
      return values.get(key)?.data ?? null;
    },
    async getWithMetadata(key, options) {
      assert.deepEqual(options, { consistency: 'strong', type: 'json' });
      return values.get(key) ?? null;
    },
    async setJSON(key, data, options) {
      const record = values.get(key);
      writes++;
      const modified = record ? options.onlyIfMatch === record.etag : options.onlyIfNew === true;
      if (modified) values.set(key, { data, etag: 'write-' + writes });
      return { modified };
    },
  };
}

test('starts from zero, retries concurrent writes and keeps two totals separate', async () => {
  const store = mock();
  assert.deepEqual((await Promise.all([recordPageLoad(store, 'lucy-awakening'), recordPageLoad(store, 'lucy-awakening')])).sort(), [1, 2]);
  assert.equal(await recordPageLoad(store, 'shade-trilogy'), 1);
  assert.equal(await recordPageLoad(store, 'lucy-awakening'), 3);
  assert.equal(store.values.get('shade-trilogy').data, 1);
});

test('stops after five conditional-write conflicts, without an unconditional overwrite', async () => {
  const store = mock();
  let tries = 0;
  store.setJSON = async (_key, _next, options) => {
    assert.deepEqual(options, { onlyIfNew: true });
    tries++;
    return { modified: false };
  };
  await assert.rejects(recordPageLoad(store, 'lucy-awakening'), /temporarily busy/);
  assert.equal(tries, 5);
});

test('only the published production API handles site counts; rejects cross-origin, GET, and prefetch', async () => {
  const store = mock();
  const handle = createCounterHandler(() => store);
  const headers = { Origin: origin, 'Sec-Fetch-Site': 'same-origin' };
  const post = request('/api/page-visits', { method: 'POST', headers });
  assert.equal((await handle(request('/api/page-visits'), context)).status, 405);
  assert.equal((await handle(request('/api/page-visits', { method: 'POST' }), context)).status, 403);
  assert.equal((await handle(request('/api/page-visits', { method: 'POST', headers: { ...headers, 'Sec-Purpose': 'prefetch' } }), context)).status, 204);
  assert.deepEqual(await (await handle(post, { deploy: { context: 'deploy-preview', published: false } })).json(), { total: 343 });
  assert.deepEqual(await (await handle(post, { deploy: { context: 'production', published: false } })).json(), { total: 343 });
  assert.deepEqual(await (await handle(new Request('https://deploy-preview-18--lucy-awakening.netlify.app/api/page-visits', { method: 'POST', headers }), context)).json(), { total: 343 });
  assert.equal(store.writes, 0);
  const response = await handle(post, context);
  assert.deepEqual(await response.json(), { total: 343 });
  assert.deepEqual(await (await handle(post, context)).json(), { total: 344 });
  assert.equal(store.values.get('lucy-awakening').data, 2);
  assert.equal(response.headers.get('set-cookie'), null);
  assert.equal(response.headers.get('cache-control'), 'no-store');
});

test('Google route is ad-free and frame restricted, and only observed iframe loads change its counter', async () => {
  const store = mock();
  const handle = createCounterHandler(() => store);
  const path = '/trilogy-visit-counter';
  const peek = await handle(request(path), context);
  assert.match(await peek.text(), /Visitor No\. : <strong>400</);
  assert.equal(store.writes, 0);
  const rejected = await handle(request(path, { headers: { 'Sec-Fetch-Dest': 'iframe', Referer: 'https://other.example/' } }), context);
  assert.match(await rejected.text(), /<strong>400</);
  const response = await handle(request(path, { headers: { 'Sec-Fetch-Dest': 'iframe', Referer: 'https://sites.google.com/' } }), context);
  assert.match(response.headers.get('content-security-policy'), /frame-ancestors https:\/\/sites\.google\.com https:\/\/\*\.googleusercontent\.com/);
  assert.equal(response.headers.get('set-cookie'), null);
  const body = await response.text();
  assert.match(body, /Visitor No\. : <strong>400</);
  assert.doesNotMatch(body, /Includes a starting count/);
  assert.equal(store.values.get('shade-trilogy').data, 1);
  assert.match(await (await handle(request(path), context)).text(), /Visitor No\. : <strong>401</);
  assert.equal(store.values.get('shade-trilogy').data, 1);
  assert.doesNotMatch(body, /<script|adsterra|bauval/);
  assert.equal(store.values.has('lucy-awakening'), false);
});

test('a failure leaves the counter unavailable rather than showing a false count', async () => {
  const handle = createCounterHandler(() => { throw new Error('API unavailable'); });
  const res = await handle(request('/api/page-visits', { method: 'POST', headers: { Origin: origin, 'Sec-Fetch-Site': 'same-origin' } }), context);
  assert.equal(res.status, 503);
  assert.deepEqual(await res.json(), { total: null });
});

test('game shell remains untouched while all four navigation pages show the counter in the footer', () => {
  for (const page of ['index.html', 'about.html', 'guide.html', 'privacy.html']) {
    const html = read(page);
    assert.match(html, /Visitor No\. : <strong id="site-visit-count"><\/strong>/);
    assert.doesNotMatch(html, /Includes a starting count/);
    assert.match(html, /<footer[^>]*>[\s\S]+class="site-visit-count" hidden[\s\S]*?<\/footer>/);
    assert.match(html, /<script src="\/visit-counter\.js" defer>/);
  }
  assert.doesNotMatch(read('game.html'), /visit-counter/);
  assert.match(read('site.css'), /\.site-footer[^\n]+flex-wrap: wrap/);
});

test('footer UI updates on success without cookies or browser storage', async () => {
  let resolve;
  const displayed = new Promise(done => { resolve = done; });
  const span = { parentElement: { hidden: true }, set textContent(value) { resolve(value); } };
  const window = {};
  window.top = window;
  vm.runInNewContext(read('visit-counter.js'), {
    document: { getElementById: () => span }, window, location: { origin },
    fetch: async (url, options) => {
      assert.equal(url, '/api/page-visits');
      assert.equal(options.credentials, 'omit');
      assert.equal(options.referrerPolicy, 'no-referrer');
      assert.equal(options.mode, 'cors');
      assert.equal(options.redirect, 'error');
      return Response.json({ total: 1024 });
    },
  });
  assert.equal(await displayed, '1,024');
  assert.equal(span.parentElement.hidden, false);
});
