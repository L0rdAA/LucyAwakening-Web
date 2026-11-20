const policy = "sandbox allow-scripts allow-same-origin; frame-ancestors 'none'";
const defaultMarker = 'data-play-banner-route="false"';
const gate = '(^|; *)__Host-lucy-banner=1(;|$)';
const allowedMarker = 'data-play-banner-route="true"';

export default async (request, context) => {
  const url = new URL(request.url);
  if (url.pathname !== '/' || url.searchParams.get('play-banner') !== '1' ||
      !['GET', 'HEAD'].includes(request.method)) return;

  if (!new RegExp(gate).test(request.headers.get('cookie') || '')) return;
  const response = await context.next();
  if (response.status !== 200 || !/^text\/html(?:;|$)/i.test(response.headers.get('content-type') || '')) return response;

  let body = null;
  const headers = new Headers(response.headers);
  const current = headers.get('Content-Security-Policy');
  // Do not weaken or replace any existing policy. The normal page never gets the marker.
  headers.set('Content-Security-Policy', current ? current + ', ' + policy : policy);
  headers.set('X-Lucy-Play-Banner', 'protected');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Cache-Control', 'no-store');
  headers.set('Netlify-CDN-Cache-Control', 'no-store');

  if (request.method === 'GET') {
    const html = await response.clone().text();
    // Make the in-document eligibility marker and the CSP part of the same response.
    if (html.indexOf(defaultMarker) < 0 || html.indexOf(defaultMarker) !== html.lastIndexOf(defaultMarker)) return response;
    body = html.replace(defaultMarker, allowedMarker);
    headers.append('Set-Cookie', '__Host-lucy-banner=; Max-Age=0; Path=/; Secure; SameSite=Lax');
    for (const header of ['Content-Length', 'Content-Encoding', 'ETag', 'Last-Modified']) headers.delete(header);
  }
  return new Response(body, { status: response.status, statusText: response.statusText, headers });
};

export const config = {
  path: '/', method: ['GET', 'HEAD'], header: { cookie: gate }, onError: 'bypass',
};
