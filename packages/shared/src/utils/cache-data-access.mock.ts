import { fn } from 'storybook/test';

import * as actual from './cache-data-access';

export const getCachedData = fn(actual.getCachedData).mockName('getCachedData');

export const addCachedDataListener = fn(actual.addCachedDataListener).mockName(
  'addCachedDataListener'
);
export const removeCachedDataListener = fn(actual.removeCachedDataListener).mockName(
  'removeCachedDataListener'
);
