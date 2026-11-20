(() => {
  'use strict';
  const origin = 'https://lucy-awakening.netlify.app';
  const requestPath = '/?play-banner=1';
  const playPath = '/#play';
  const key = 'lucy-play-banner:once:single-play-1';
  const gate = '__Host-lucy-banner';
  const gateCookie = '; Path=/; Secure; SameSite=Lax';
  if (location.origin !== origin || window.origin !== origin || window.top !== window || location.pathname !== '/') return;

  const media = matchMedia('(min-width: 1480px) and (hover: hover) and (pointer: fine)');
  const addMediaListener = callback => {
    if (typeof media.addEventListener === 'function') media.addEventListener('change', callback);
    else if (typeof media.addListener === 'function') media.addListener(callback);
  };
  const protectedPage = document.body.dataset.playBannerRoute === 'true' &&
    new URLSearchParams(location.search).get('play-banner') === '1';
  const advertExit = () => {
    if (location.search || location.hash !== '#play') location.replace(playPath);
    else location.reload();
  };
  let active = false;
  if (protectedPage) {
    let grant = 0;
    try {
      grant = Number(sessionStorage.getItem(key));
      sessionStorage.removeItem(key);
    } catch (_) {}
    const age = Date.now() - grant;
    if (!media.matches || !grant || age < 0 || age > 15000) {
      location.replace(playPath);
      return;
    }

    const rail = document.getElementById('play-banner-slot');
    const stage = document.getElementById('play');
    if (!rail || !stage) {
      location.replace(playPath);
      return;
    }
    try { history.replaceState(history.state, '', playPath); } catch (_) {}
    stage.classList.add('play-banner-active');
    rail.hidden = false;
    active = true;
    // Keep the provider's original parser-time, standard-display tag verbatim.
    document.write(
      "<script>atOptions = {'key':'e73878fc4620d0a640df1b47552532c4','format':'iframe','height':600,'width':160,'params':{}}</script>" +
      '<script src="https://bauval.org/22/e73878fc4620d0a640df1b47552532c4"></script>'
    );
    window.addEventListener('pageshow', event => { if (event.persisted) advertExit(); });
    addMediaListener(() => {
      if (!media.matches) {
        rail.replaceChildren();
        rail.hidden = true;
        stage.classList.remove('play-banner-active');
      }
    });
  }

  const initialize = () => {
    if (active) {
      const off = document.getElementById('play-banner-off');
      if (off) {
        off.hidden = false;
        off.addEventListener('click', event => { if (event.isTrusted) advertExit(); });
      }
      // Restore site navigation in the protected document without opening new tabs.
      // Do not modify any provider link or advertiser destination.
      for (const link of document.querySelectorAll('header a[target="_blank"], footer a[target="_blank"], #before-you-play a[target="_blank"], main section[aria-labelledby="before-you-play"] a[target="_blank"]')) {
        link.target = '_self';
        if (link.childElementCount === 0) link.textContent = link.textContent.replace(/\s*\(new tab\)\s*$/, '');
      }
      return;
    }

    const panel = document.getElementById('play-banner-opt-in');
    const button = document.getElementById('play-banner-allow');
    const status = document.getElementById('play-banner-status');
    if (!panel || !button || !status) return;
    panel.hidden = !media.matches;
    addMediaListener(() => { panel.hidden = !media.matches; });
    button.addEventListener('click', async event => {
      if (!event.isTrusted || !media.matches || button.disabled) return;
      try {
        button.disabled = true;
        document.cookie = gate + '=1; Max-Age=30' + gateCookie;
        const response = await fetch(requestPath, { headers: { 'X-Lucy-Banner-Probe': '1' }, cache: 'no-store', redirect: 'error' });
        const policy = response.headers.get('Content-Security-Policy') || '';
        const safetyPolicy = "sandbox allow-scripts allow-same-origin; frame-ancestors 'none'";
        if (!response.ok || response.headers.get('X-Lucy-Play-Banner') !== 'protected' ||
            !(policy === safetyPolicy || policy.endsWith(', ' + safetyPolicy)) ||
            /\b(?:allow-popups|allow-popups-to-escape-sandbox)\b/.test(policy) || !media.matches) {
          throw new Error('Unavailable');
        }
        sessionStorage.setItem(key, String(Date.now()));
        location.assign(requestPath + '#play');
      } catch (_) {
        document.cookie = gate + '=; Max-Age=0' + gateCookie;
        status.textContent = 'The optional banner is unavailable. You can continue playing here without ads.';
        button.disabled = false;
      }
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
  else initialize();
})();
