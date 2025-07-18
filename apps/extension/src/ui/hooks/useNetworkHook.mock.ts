import { fn } from 'storybook/test';

import * as actual from './useNetworkHook';
// Mock for useNetwork hook
export const useNetwork = fn(actual.useNetwork).mockName('useNetwork');
