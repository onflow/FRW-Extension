import { fn } from 'storybook/test';

import * as actual from './WalletContext';

// These are the mock function instances, exported with the names the component expects.
export const useWallet = fn().mockName('useWallet');

export const useWalletLoaded = fn(actual.useWalletLoaded).mockName('useWalletLoaded');
