import { fn } from 'storybook/test';

// Mock for useProfiles hook that uses the global mock
export const useProfiles = () => {
  // Use the global mock if available, otherwise return a default mock
  if (typeof window !== 'undefined' && (window as any).__STORYBOOK_MOCKS__?.useProfiles) {
    return (window as any).__STORYBOOK_MOCKS__.useProfiles();
  }

  // Fallback mock
  return {
    fetchProfileData: () => {},
    clearProfileData: () => {},
    currentWallet: null,
    mainAddress: '',
    evmAddress: '',
    childAccounts: [],
    evmWallet: null,
    userInfo: null,
    otherAccounts: [],
    walletList: [],
    currentBalance: '0',
    parentAccountStorageBalance: null,
    parentWallet: null,
    parentWalletIndex: -1,
    evmLoading: false,
    mainAddressLoading: false,
    profileIds: [],
    activeAccountType: 'none',
    noAddress: false,
    registerStatus: false,
    canMoveToChild: false,
    currentWalletList: [],
    payer: false,
    network: 'mainnet',
    pendingAccountTransactions: [],
  };
};
