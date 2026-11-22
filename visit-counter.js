(() => {
  'use strict';
  const counter = document.getElementById('site-visit-count');
  if (!counter || window.top !== window || location.origin !== 'https://lucy-awakening.netlify.app') return;
  const count = async () => {
    try {
      const result = await fetch('/api/page-visits', {
        method: 'POST', credentials: 'omit', cache: 'no-store',
        // CORS mode preserves the same-site POST's Origin with no-referrer.
        mode: 'cors', redirect: 'error', referrerPolicy: 'no-referrer',
      });
      if (!result.ok) return;
      const { total } = await result.json();
      if (!Number.isSafeInteger(total) || total < 0) return;
      counter.textContent = total.toLocaleString('en-US');
      counter.parentElement.hidden = false;
    } catch {
      // A storage or network failure should never interfere with the site or game.
    }
  };
  if (document.prerendering) document.addEventListener('prerenderingchange', count, { once: true });
  else count();
})();
