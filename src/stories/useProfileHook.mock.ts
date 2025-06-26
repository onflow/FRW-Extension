import { fn } from 'storybook/test';

// Mock for useProfiles hook that uses the global mock
export const useProfiles = fn()
  .mockName('useProfiles')
  .mockImplementation(() => ({
    currentWallet: {
      address: '0x1234567890',
    },
    activeAccountType: 'flow',
  }));
