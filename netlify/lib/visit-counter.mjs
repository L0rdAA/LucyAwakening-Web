const siteOrigin = 'https://lucy-awakening.netlify.app';
const sitePath = '/api/page-visits';
const trilogyPath = '/trilogy-visit-counter';
const netlifyBaseline = 343;
const trilogyBaseline = 400;
const headers = {
  'Cache-Control': 'no-store',
  'Netlify-CDN-Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
};

const validCount = value => Number.isSafeInteger(value) && value >= 0;

export async function recordPageLoad(store, key) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const record = await store.getWithMetadata(key, { consistency: 'strong', type: 'json' });
    const previous = record === null ? 0 : record.data;
    if (!validCount(previous) || previous === Number.MAX_SAFE_INTEGER || (record && !record.etag)) {
      throw new Error('Invalid stored page count');
    }
    const total = previous + 1;
    const options = record === null ? { onlyIfNew: true } : { onlyIfMatch: record.etag };
    if ((await store.setJSON(key, total, options)).modified) return total;
    // A simultaneous load won the write; allow a short jitter before rereading.
    if (attempt < 4) await new Promise(resolve => setTimeout(resolve, 8 + Math.floor(Math.random() * 20)));
  }
  throw new Error('Page count temporarily busy');
}

const embedHeaders = {
  ...headers,
  'Content-Type': 'text/html; charset=utf-8',
  'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors https://sites.google.com https://*.googleusercontent.com https://www.gstatic.com; base-uri 'none'; form-action 'none'",
};

function embed(recorded, status = 200) {
  const value = validCount(recorded) ? (trilogyBaseline + recorded).toLocaleString('en-US') : 'Unavailable';
  return new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Trilogy site visits</title><style>html{color-scheme:dark}body{margin:0;background:#0d0b17;color:#f2eef9;font:14px/1.45 system-ui,sans-serif;text-align:center;padding:8px 4px;overflow-wrap:anywhere}</style><body>Visitor No. : <strong>${value}</strong></body></html>`, { status, headers: embedHeaders });
}

function allowedEmbedReferrer(request) {
  const value = request.headers.get('Referer');
  if (!value) return true; // Some browsers suppress the referrer in embedded documents.
  try {
    const referrer = new URL(value);
    return referrer.protocol === 'https:' && (referrer.hostname === 'sites.google.com' ||
      referrer.hostname.endsWith('.googleusercontent.com'));
  } catch {
    return false;
  }
}

function isPrefetch(request) {
  return /prefetch|prerender/i.test((request.headers.get('Sec-Purpose') || '') + ' ' + (request.headers.get('Purpose') || ''));
}

export function createCounterHandler(getStore) {
  return async (request, context) => {
    const url = new URL(request.url);
    const isEmbed = url.pathname === trilogyPath;
    if (url.pathname !== sitePath && !isEmbed) return new Response(null, { status: 404, headers });
    if (url.origin !== siteOrigin || context.deploy?.context !== 'production' || context.deploy?.published !== true) {
      return isEmbed ? embed(0) : Response.json({ total: netlifyBaseline }, { headers });
    }
    const method = isEmbed ? 'GET' : 'POST';
    if (request.method !== method) return new Response(null, { status: 405, headers: { ...headers, Allow: method } });
    if (isPrefetch(request)) return new Response(null, { status: 204, headers });
    try {
      if (isEmbed) {
        if (request.headers.get('Sec-Fetch-Dest') !== 'iframe' || !allowedEmbedReferrer(request)) {
          // Direct visits can check the number without increasing it.
          const total = await getStore().get('shade-trilogy', { consistency: 'strong', type: 'json' });
          return embed(total ?? 0);
        }
        const recorded = await recordPageLoad(getStore(), 'shade-trilogy');
        return embed(recorded - 1);
      }
      if (request.headers.get('Origin') !== siteOrigin ||
          request.headers.get('Sec-Fetch-Site') !== 'same-origin') {
        return new Response(null, { status: 403, headers });
      }
      const recorded = await recordPageLoad(getStore(), 'lucy-awakening');
      // Display the starting value on the first counted load. Persist only the raw count.
      return Response.json({ total: netlifyBaseline + recorded - 1 }, { headers });
    } catch {
      return isEmbed ? embed(null, 503) : Response.json({ total: null }, { status: 503, headers });
    }
  };
}
