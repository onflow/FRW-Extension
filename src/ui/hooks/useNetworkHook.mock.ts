import { fn } from 'storybook/test';

// Mock for useNetwork hook
export const useNetwork = fn().mockName('useNetwork').mockReturnValue({
  network: 'mainnet',
  developerMode: false,
  emulatorModeOn: false,
});
