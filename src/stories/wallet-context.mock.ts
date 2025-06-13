import { fn } from 'storybook/test';

// These are the mock function instances, exported with the names the component expects.
export const useWallet = fn().mockName('useWallet');
export const useWalletLoaded = fn().mockName('useWalletLoaded');
