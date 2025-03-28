// Mock React first, before any other imports
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useEffect: vi.fn((fn) => fn()),
    useCallback: vi.fn((fn) => fn),
    useState: vi.fn((initialValue) => [initialValue, vi.fn()]),
    useRef: vi.fn((initialValue) => ({
      current: initialValue,
    })),
  };
});

import { describe, it, expect, vi, beforeEach } from 'vitest';

import emojiList from '@/background/utils/emoji.json';
import { useProfileStore } from '@/ui/stores/profileStore';

import { useProfiles } from '../useProfileHook';

// Mock the store
vi.mock('@/ui/stores/profileStore', () => ({
  useProfileStore: vi.fn((selector) =>
    selector({
      mainAddress: '',
      evmAddress: '',
      currentWalletIndex: 0,
      parentWallet: {},
      evmWallet: {},
      walletList: [],
      initialStart: true,
      currentWallet: {},
      mainAddressLoading: true,
      childAccounts: {},
      evmLoading: true,
      listLoading: true,
      userInfo: null,
      otherAccounts: [],
      loggedInAccounts: [],
      setMainAddress: vi.fn(),
      setEvmAddress: vi.fn(),
      setCurrentWalletIndex: vi.fn(),
      setParentWallet: vi.fn(),
      setEvmWallet: vi.fn(),
      setWalletList: vi.fn(),
      setInitial: vi.fn(),
      setCurrent: vi.fn(),
      setMainLoading: vi.fn(),
      setChildAccount: vi.fn(),
      setEvmLoading: vi.fn(),
      setListLoading: vi.fn(),
      setUserInfo: vi.fn(),
      setOtherAccounts: vi.fn(),
      setLoggedInAccounts: vi.fn(),
      clearProfileData: vi.fn(),
    })
  ),
}));

// Mock wallet context
vi.mock('@/ui/utils/WalletContext', () => ({
  useWalletLoaded: vi.fn().mockReturnValue(true),
  useWallet: vi.fn().mockReturnValue({
    getMainAddress: vi.fn().mockResolvedValue('0x138c20de202897fb'),
    queryEvmAddress: vi.fn().mockResolvedValue('0x0000000000000000000000022888571dfacf27b4'),
    getEvmWallet: vi.fn().mockResolvedValue({
      name: 'Test Wallet',
      address: '0x0000000000000000000000022888571dfacf27b4',
      type: 'evm',
      blockchain: 'evm',
    }),
    checkUserChildAccount: vi.fn().mockResolvedValue({}),
    setChildWallet: vi.fn(),
    getUserInfo: vi.fn().mockResolvedValue({
      name: 'Test User',
      accounts: [],
      loggedInAccounts: [],
    }),
    getCurrentWallet: vi.fn().mockReturnValue({
      name: 'Test Wallet',
      address: '0x138c20de202897fb',
      type: 'flow',
      blockchain: 'flow',
    }),
    getActiveWallet: vi.fn().mockReturnValue({
      name: 'Test Wallet',
      address: '0x138c20de202897fb',
      type: 'flow',
      blockchain: 'flow',
    }),
    returnParentWallet: vi.fn().mockReturnValue({
      name: 'Test Wallet',
      address: '0x138c20de202897fb',
      type: 'flow',
      blockchain: 'flow',
    }),
    getEmoji: vi.fn().mockReturnValue(emojiList.emojis),
  }),
}));

// Add network store mock
vi.mock('@/ui/stores/networkStore', () => ({
  useNetworkStore: vi.fn((selector) =>
    selector({
      currentNetwork: 'mainnet',
      developerMode: false,
      emulatorModeOn: false,
      setNetwork: vi.fn(),
      setDeveloperMode: vi.fn(),
      setEmulatorModeOn: vi.fn(),
    })
  ),
}));

describe('useProfileHook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch and set profile data', async () => {
    const hook = useProfiles();
    await hook.fetchProfileData();
    expect(vi.mocked(useProfileStore).mock.calls[0][0]).toBeDefined();
  });
});
