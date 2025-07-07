import { fn } from 'storybook/test';

import * as actual from './use-data';

// Mock for useUserData hook
export const useUserData = fn(actual.useUserData)
  .mockName('useUserData')
  .mockImplementation(() => undefined);

// Mock for useCachedData hook
export const useCachedData = fn(actual.useCachedData)
  .mockName('useCachedData')
  .mockImplementation(() => undefined);
