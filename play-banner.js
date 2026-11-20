(() => {
  'use strict';
  const PLAY_BANNER_ENABLED = true;
  if (!PLAY_BANNER_ENABLED) return;
  const origin = 'https://lucy-awakening.netlify.app';
  const route = '/play-with-banner.html';
  if (location.origin !== origin || window.origin !== origin || window.top !== window) return;
  const media = matchMedia('(min-width: 1480px) and (hover: hover) and (pointer: fine)');
  const bannerPage = document.body.dataset.playBannerRoute === 'true' &&
    /^\/play-with-banner(?:\.html)?\/?$/.test(location.pathname);
  const key = 'lucy-play-banner:once:2026-11';
  if (bannerPage) {
    let grant;
    try {
      grant = Number(sessionStorage.getItem(key));
      sessionStorage.removeItem(key);
    } catch (_) { return; }
    if (!media.matches || !grant || Date.now() - grant < 0 || Date.now() - grant > 15000) return;
    const rail = document.getElementById('play-banner-slot');
    const stage = document.getElementById('play');
    if (!rail || !stage) return;
    stage.classList.add('play-banner-active');
    rail.hidden = false;
    document.write(
      "<script>atOptions = {'key':'e73878fc4620d0a640df1b47552532c4','format':'iframe','height':600,'width':160,'params':{}}</script>" +
      '<script src="https://bauval.org/22/e73878fc4620d0a640df1b47552532c4"></script>'
    );
    window.addEventListener('pageshow', event => { if (event.persisted) location.reload(); });
    function narrow() {
      // Keep the active game document and its unsaved state in memory when resizing.
      if (!media.matches) { rail.replaceChildren(); rail.hidden = true; stage.classList.remove('play-banner-active'); }
    }
    if (typeof media.addEventListener === 'function') media.addEventListener('change', narrow);
    else if (typeof media.addListener === 'function') media.addListener(narrow);
    return;
  }
  const panel = document.getElementById('play-banner-opt-in');
  const button = document.getElementById('play-banner-allow');
  const status = document.getElementById('play-banner-status');
  if (!panel || !button || !status) return;
  panel.hidden = !media.matches;
  if (typeof media.addEventListener === 'function') media.addEventListener('change', () => { panel.hidden = !media.matches; });
  button.addEventListener('click', async event => {
    if (!event.isTrusted || !media.matches || button.disabled) return;
    try {
      button.disabled = true;
      const response = await fetch(route, { method: 'HEAD', cache: 'no-store', redirect: 'error' });
      const policy = (response.headers.get('Content-Security-Policy') || '')
        .split(';').map(value => value.trim());
      // Refuse to transfer consent unless the route advertises the required header protections.
      if (!response.ok || response.headers.get('Cross-Origin-Opener-Policy') !== 'same-origin' || !policy.includes('sandbox allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox') ||
        !policy.includes("frame-ancestors 'none'") || !media.matches) throw new Error('Unavailable');
      sessionStorage.setItem(key, String(Date.now()));
      location.assign(route + '#play');
    } catch (_) {
      status.textContent = 'The optional banner is unavailable. You can continue playing here without ads.';
      button.disabled = false;
    }
  });
})();
