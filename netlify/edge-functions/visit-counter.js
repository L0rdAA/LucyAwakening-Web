import { getStore } from '@netlify/blobs';
import { createCounterHandler } from '../lib/visit-counter.mjs';

export default createCounterHandler(() => getStore('public-page-visits'));
export const config = {
  path: ['/api/page-visits', '/trilogy-visit-counter'],
  rateLimit: { windowLimit: 100, windowSize: 60, aggregateBy: ['ip', 'domain'] },
};
