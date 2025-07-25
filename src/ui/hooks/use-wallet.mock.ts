import { fn } from 'storybook/test';

import { useWalletLoaded as actualUseWalletLoaded } from './use-wallet';

// These are the mock function instances, exported with the names the component expects.
export const useWallet = fn().mockName('useWallet');

export const useWalletLoaded = fn(actualUseWalletLoaded).mockName('useWalletLoaded');
