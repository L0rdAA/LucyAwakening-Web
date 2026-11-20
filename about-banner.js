(() => {
  'use strict';
  const site='https://lucy-awakening.netlify.app';
  const route=/^\/about-with-banner(?:\.html)?\/?$/;
  const mq=window.matchMedia('(min-width: 1480px) and (hover: hover) and (pointer: fine)');
  const opaqueTopLevel=window.top === window && window.origin === 'null';
  const allowedRoute=location.origin === site && route.test(location.pathname);
  const settings=document.body.dataset;
  if (settings.bannerEnabled!=='true' || !opaqueTopLevel || !allowedRoute) return;

  const choice=document.getElementById('ad-choice');
  const yes=document.getElementById('ad-allow');
  const no=document.getElementById('ad-reject');
  const rail=document.getElementById('ad-rail');
  if (!choice||!yes||!no||!rail) return;
  const rendered=settings.adRendered==='true';
  const undo=()=>location.reload();
  function viewport() {
    if (rendered && !mq.matches) { undo(); return; }
    choice.hidden=!mq.matches;
  }
  viewport();
  if (typeof mq.addEventListener==='function') mq.addEventListener('change',viewport);
  else if (typeof mq.addListener==='function') mq.addListener(viewport);
  no.addEventListener('click',()=>{ if (rendered) undo(); else choice.hidden=true; });
  if (rendered) return;

  yes.addEventListener('click',(event)=>{
    if (!event.isTrusted || !mq.matches || window.origin!=='null') return;
    const copy=document.documentElement.cloneNode(true);
    copy.querySelector('body').dataset.adRendered='true';
    copy.querySelector('#ad-rail').hidden=false;
    copy.querySelector('#ad-allow').hidden=true;
    copy.querySelector('#ad-reject').textContent='Turn ads off';
    const markup=copy.outerHTML;
    const marker='<!--adsterra-placement-->';
    if (markup.split(marker).length!==2) return;
    const tag="<script>atOptions = {'key':'e73878fc4620d0a640df1b47552532c4','format':'iframe','height':600,'width':160,'params':{}}</script>" +
      '<script src="https://bauval.org/22/e73878fc4620d0a640df1b47552532c4"></script>';
    // This replaces this optional document only; the HTTP sandbox must remain enforced.
    document.open();
    document.write('<!doctype html>' + markup.replace(marker,tag));
    document.close();
  });
})();
