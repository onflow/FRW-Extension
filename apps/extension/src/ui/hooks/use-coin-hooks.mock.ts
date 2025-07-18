import { fn } from 'storybook/test';

import * as actual from './use-coin-hooks';

// Mock for coin hooks
export const useChildAccountFt = fn(actual.useChildAccountFt).mockName('useChildAccountFt');
