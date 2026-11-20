import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';

const read = pathname => readFileSync(new URL('../' + pathname, import.meta.url), 'utf8');
const main = read('play-banner.js');
const left = read('play-banner-left.js');
const html = read('index.html');
const origin = 'https://lucy-awakening.netlify.app';
const age = 300;
const fakeKey = 'd'.repeat(32);
const fakeSrc = 'https://example.test/mock/invoke.js';

function run({ ref = origin, grant = Date.now() - age, protectedPage = true, wide = true, unit = 'real-config' } = {}) {
  const written = [], loads = [], hooks = {}, mediaHooks = [];
  const mockNode = () => ({ hidden: true, classList: new Set(), replaceChildren() { this.emptied = true; } });
  const rails = {
    'play-banner-slot': mockNode(),
    'play-banner-left': mockNode(),
    play: mockNode(),
  };
  rails.play.classList.remove = rails.play.classList.delete.bind(rails.play.classList);
  const media = {
    matches: wide,
    addEventListener(event, fn) { if (event === 'change') mediaHooks.push(fn); },
  };
  const context = vm.createContext({
    URLSearchParams,
    location: {
      origin: ref,
      pathname: '/',
      search: protectedPage ? '?play-banner=1' : '',
      replace: url => loads.push(url),
    },
    history: { replaceState: () => {} },
    matchMedia: () => media,
    sessionStorage: { getItem: () => grant, removeItem: () => { grant = 0; } },
    document: {
      readyState: 'loading',
      body: { dataset: { playBannerRoute: String(protectedPage) } },
      getElementById: name => rails[name],
      addEventListener: () => {},
      write: text => written.push(text),
      currentScript: null,
    },
  });
  context.window = context;
  context.top = context;
  context.origin = ref;
  context.addEventListener = (event, fn) => { hooks[event] = fn; };
  vm.runInContext(main, context);
  context.document.currentScript = { parentElement: rails['play-banner-left'] };
  vm.runInContext(unit === 'real-config' ? left : left.replace(/const unit = [^;]+;/, 'const unit = ' + JSON.stringify(unit) + ';'), context);
  const resize = () => {
    media.matches = false;
    for (const fn of mediaHooks) fn();
  };
  return { written, loads, rails, context, resize };
}

test('separate hidden side rails exist and no ad tag is inline', () => {
  assert.match(html, /id="play-banner-slot"[^>]* hidden/);
  assert.match(html, /id="play-banner-left"[^>]* hidden/);
  assert.doesNotMatch(html, /atOptions|bauval\.org/);
});

test('without a configured distinct unit, only the existing right banner loads after consent', () => {
  for (const unit of [null, { key: 'e73878fc4620d0a640df1b47552532c4', src: fakeSrc }, { key: fakeKey, src: 'javascript:test' }]) {
    const { written, rails, context } = run({ unit });
    assert.equal(written.length, 1);
    assert.equal(rails['play-banner-slot'].hidden, false);
    assert.equal(rails['play-banner-left'].hidden, true);
    assert.equal(context.__lucyWriteLeftBanner, undefined);
  }
});

test('fresh consent on production activates both distinct tags and narrowing removes them', () => {
  const { written, rails, context, resize } = run({ unit: { key: fakeKey, src: fakeSrc } });
  assert.equal(written.length, 2);
  assert.match(written[0], /bauval\.org/);
  assert.ok(written[1].includes(fakeSrc) && written[1].includes(fakeKey));
  assert.equal(rails['play-banner-slot'].hidden, false);
  assert.equal(rails['play-banner-left'].hidden, false);
  assert.equal(context.__lucyWriteLeftBanner, undefined);
  resize();
  for (const rail of ['play-banner-slot', 'play-banner-left']) {
    assert.equal(rails[rail].hidden, true);
    assert.equal(rails[rail].emptied, true);
  }
});

test('direct requests, missing/expired grants, preview and small screens never load either tag', () => {
  const unit = { key: fakeKey, src: fakeSrc };
  for (const options of [
    { protectedPage: false }, { grant: 0 }, { grant: Date.now() - 20000 },
    { ref: 'https://deploy-preview-16--lucy-awakening.netlify.app' },
    { ref: 'http://localhost:3000' }, { wide: false },
  ]) assert.equal(run({ ...options, unit }).written.length, 0);
});

test('publisher configuration yields distinct 160×600 tags without network requests', () => {
  const { written } = run();
  assert.equal(written.length, 2);
  for (const tag of written) assert.match(tag, /'height':600,'width':160/);
  const sources = written.map(tag => tag.match(/src="([^"]+)"/)[1]);
  assert.equal(new Set(sources).size, 2);
  assert.match(sources[1], /fb8b849e4e7abe9980a3506db7bb9bd3$/);
});

test('visible opt-in and opt-out controls sit directly above the game without a disclosure menu', () => {
  const play = html.slice(html.indexOf('id="play"'), html.indexOf('id="play-banner-slot"'));
  assert.match(play, /id="play-banner-opt-in" hidden/);
  assert.match(play, /id="play-banner-opt-out" hidden/);
  assert.match(play, /id="play-banner-allow" aria-describedby="play-banner-terms"/);
  assert.match(play, /could read or change local game saves and settings/);
  assert.match(play, /id="play-banner-off"[^>]*>[\s\S]*?<iframe[^>]*src="\/game\.html"/);
  assert.doesNotMatch(play, /<details\b/);
});
