import { fn } from 'storybook/test';

// Mock wallet controller with all necessary methods
const mockWalletController = {
  checkAddress: () => Promise.resolve(true),
  isBooted: () => Promise.resolve(true),
  getParentAddress: () => Promise.resolve('0xabcdef1234567890abcdef1234567890abcdef12'),
  getUserInfo: () => Promise.resolve({ id: 'mock-user-id', nickname: 'Mock User' }),
  getActiveAccountType: () => Promise.resolve('main'),
  checkMnemonics: () => Promise.resolve(true),
  lockAdd: () => Promise.resolve(),
  getAddressBook: () => Promise.resolve([]),
  getRecent: () => Promise.resolve([]),
  isUnlocked: () => Promise.resolve(true),
  getCurrentAccount: () =>
    Promise.resolve({ address: '0xabcdef1234567890abcdef1234567890abcdef12' }),
  getNetwork: () => Promise.resolve('mainnet'),
  getFeatureFlag: () => Promise.resolve(false),
  getEmulatorMode: () => Promise.resolve(false),
  getMonitor: () => Promise.resolve('mock-monitor'),
  switchNetwork: () => Promise.resolve(),
  switchMonitor: () => Promise.resolve(),
  setEmulatorMode: () => Promise.resolve(),
  openapi: {
    getLocation: () => Promise.resolve('mock-location'),
    getInstallationId: () => Promise.resolve('mock-installation-id'),
    keyList: () => Promise.resolve([]),
    deviceList: () => Promise.resolve([]),
  },
  // Add other methods as needed
};

// Mock the useWallet hook to return the mock controller directly
export const useWallet = fn().mockName('useWallet').mockReturnValue(mockWalletController);

// Mock the useWalletLoaded hook
export const useWalletLoaded = fn().mockName('useWalletLoaded').mockReturnValue(true);
