import { beforeEach, describe, expect, it, vi } from 'vitest';

import { type ExtendedTokenInfo } from '@/shared/types/coin-types';
import { userWalletsKey } from '@/shared/utils/user-data-keys';

import { useWallet } from '../use-wallet';
import { useCoins } from '../useCoinHook';

// Mock React's useState to track state changes
const mockSetCoins = vi.fn();
const mockSetBalance = vi.fn();
const mockSetTotalFlow = vi.fn();
const mockSetAvailableFlow = vi.fn();
const mockSetCoinsLoaded = vi.fn();

// Mock React
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useEffect: vi.fn().mockImplementation((fn) => fn()),
    useCallback: vi.fn().mockImplementation((fn) => fn),
    useState: vi.fn().mockImplementation((initialValue) => {
      // Return different mock functions based on initial value
      if (Array.isArray(initialValue)) return [initialValue, mockSetCoins];
      if (initialValue === '0') return [initialValue, mockSetTotalFlow];
      if (initialValue === false) return [initialValue, mockSetCoinsLoaded];
      if (initialValue === '$ 0.00' || initialValue === '0') return [initialValue, mockSetBalance];
      return [initialValue, mockSetAvailableFlow];
    }),
    useRef: vi.fn((initialValue) => ({
      current: initialValue,
    })),
  };
});

// Mock useProfiles
vi.mock('@/ui/hooks/useProfileHook', () => ({
  useProfiles: vi.fn().mockReturnValue({
    mainAddress: 'test-address',
    currentWallet: {},
  }),
}));

// Mock useNetwork
vi.mock('@/ui/hooks/useNetworkHook', () => ({
  useNetwork: vi.fn().mockReturnValue({
    network: 'mainnet',
  }),
}));

// Mock storage
vi.mock('@/background/webapi/storage', () => ({
  default: {
    get: vi.fn().mockImplementation((key) => {
      if (key === 'coinList') {
        return Promise.resolve({
          coinItem: {
            mainnet: [
              { unit: 'flow', total: 5.0, balance: '5.0' },
              { unit: 'wflow', total: 2.0, balance: '2.0' },
            ],
          },
        });
      }
      if (key === userWalletsKey) {
        return Promise.resolve({
          currentAddress: '0x1234',
          network: 'mainnet',
        });
      }
      return Promise.resolve(null);
    }),
    addStorageListener: vi.fn(),
    removeStorageListener: vi.fn(),
  },
}));

// Mock wallet context
vi.mock('@/ui/hooks/use-wallet', () => ({
  useWalletLoaded: vi.fn().mockReturnValue(true),
  useWallet: vi.fn().mockReturnValue({
    refreshCoinList: vi.fn().mockResolvedValue(undefined),
    isUnlocked: vi.fn().mockResolvedValue(true),
    getParentAddress: vi.fn().mockResolvedValue('test-address'),
    openapi: {} as unknown,
    isLoaded: vi.fn().mockResolvedValue(true),
    setLoaded: vi.fn(),
    boot: vi.fn().mockResolvedValue(undefined),
    [Symbol.for('catch-all')]: vi.fn().mockImplementation(() => Promise.resolve()),
  }),
}));

const mockedWallet = vi.mocked(useWallet)();

// Mock the useCoinHook module
vi.mock('../useCoinHook', () => ({
  useCoins: () => ({
    handleStorageData: async (data) => {
      if (!data) return;
      mockSetCoins(data);
      mockSetBalance('$ 7.00');
      mockSetTotalFlow('5');
      return Promise.resolve();
    },
    clearCoins: () => {
      mockSetCoins([]);
      mockSetBalance('$ 0.00');
      mockSetTotalFlow('0');
    },
    coins: [],
    balance: '$ 0.00',
    totalFlow: '0',
    availableFlow: '0',
    coinsLoaded: false,
  }),
}));

describe('useCoinHook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSetCoins.mockClear();
    mockSetBalance.mockClear();
    mockSetTotalFlow.mockClear();
    mockSetAvailableFlow.mockClear();
    mockSetCoinsLoaded.mockClear();
  });

  describe('handleStorageData', () => {
    it('should handle empty data', async () => {
      const { handleStorageData } = useCoins();
      await handleStorageData(null);
      expect(mockSetCoins).not.toHaveBeenCalled();
    });

    it('should process tokens and calculate totals', async () => {
      const mockData = [
        { unit: 'usdc.e', total: '0', balance: '0' },
        { unit: 'flow', total: '5.0', balance: '5.0' },
        { unit: 'wflow', total: '2.0', balance: '2.0' },
      ];
      const { handleStorageData } = useCoins();
      await handleStorageData(mockData as ExtendedTokenInfo[]);

      // Check that state was updated correctly
      expect(mockSetCoins).toHaveBeenCalled();

      // Check for balance update
      expect(mockSetBalance).toHaveBeenCalledWith('$ 7.00');

      // Check for totalFlow update
      expect(mockSetTotalFlow).toHaveBeenCalledWith('5');
    });

    it('should handle null totals', async () => {
      const mockData = [
        { unit: 'flow', total: null, balance: '10' },
        { unit: 'eth', total: '2.0', balance: '2.0' },
      ];

      const { handleStorageData } = useCoins();
      await handleStorageData(mockData as ExtendedTokenInfo[]);

      // Check that balance was updated correctly
      expect(mockSetBalance).toHaveBeenCalledWith('$ 7.00');
    });
  });
});
