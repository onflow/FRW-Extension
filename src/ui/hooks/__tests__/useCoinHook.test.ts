import { act } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useCoinStore } from '@/ui/stores/coinStore';
import { useNetworkStore } from '@/ui/stores/networkStore';
import { useProfileStore } from '@/ui/stores/profileStore';
import { useWallet, useWalletLoaded } from '@/ui/utils/WalletContext';

import { useCoins } from '../useCoinHook';

// Mock React
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useEffect: vi.fn().mockImplementation((fn) => fn()),
    useCallback: vi.fn().mockImplementation((fn) => fn),
    useState: vi.fn().mockImplementation((initialValue) => [initialValue, vi.fn()]),
  };
});

// Mock all stores first
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

vi.mock('@/ui/stores/profileStore', () => ({
  useProfileStore: vi.fn((selector) =>
    selector({
      mainAddress: 'test-address',
      currentWallet: {},
      setMainAddress: vi.fn(),
    })
  ),
}));

vi.mock('@/ui/stores/coinStore', () => ({
  useCoinStore: vi.fn((selector) =>
    selector({
      coins: [],
      balance: '$ 0.00',
      availableFlow: '0',
      totalFlow: '0',
      setCoinData: vi.fn(),
      setBalance: vi.fn(),
      setTotalFlow: vi.fn(),
      setAvailableFlow: vi.fn(),
      clearCoins: vi.fn(),
    })
  ),
  getState: vi.fn().mockReturnValue({
    setCoinData: vi.fn(),
  }),
}));

// Mock storage
vi.mock('@/background/webapi', () => ({
  storage: {
    get: vi.fn().mockResolvedValue([
      { unit: 'FLOW', total: '5.0', balance: '5.0' },
      { unit: 'WFLOW', total: '2.0', balance: '2.0' },
    ]),
  },
}));

// Mock wallet context
vi.mock('@/ui/utils/WalletContext', () => ({
  useWalletLoaded: vi.fn().mockReturnValue(true),
  useWallet: vi.fn().mockReturnValue({
    refreshCoinList: vi.fn().mockResolvedValue(undefined),
    isUnlocked: vi.fn().mockResolvedValue(true),
    getMainWallet: vi.fn().mockResolvedValue('test-address'),
  }),
}));

describe('useCoinHook', () => {
  let mockSetBalance: ReturnType<typeof vi.fn>;
  let mockSetCoinData: ReturnType<typeof vi.fn>;
  let mockSetTotalFlow: ReturnType<typeof vi.fn>;
  let mockSetAvailableFlow: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSetBalance = vi.fn();
    mockSetCoinData = vi.fn();
    mockSetTotalFlow = vi.fn();
    mockSetAvailableFlow = vi.fn();

    vi.mocked(useCoinStore).mockImplementation((selector) =>
      selector({
        coins: [],
        balance: '$ 0.00',
        availableFlow: '0',
        totalFlow: '0',
        setCoinData: mockSetCoinData,
        setBalance: mockSetBalance,
        setTotalFlow: mockSetTotalFlow,
        setAvailableFlow: mockSetAvailableFlow,
        clearCoins: vi.fn(),
      })
    );
  });

  describe('handleStorageData', () => {
    it('should handle empty data', async () => {
      const { handleStorageData } = useCoins();
      await handleStorageData(null);
      expect(mockSetCoinData).not.toHaveBeenCalled();
    });

    it('should process unique tokens and calculate totals', async () => {
      const mockData = [
        { unit: 'USDC.e', total: null, balance: null },
        { unit: 'FLOW', total: '5.0', balance: '5.0' },
        { unit: 'WFLOW', total: '2.0', balance: '2.0' },
      ];

      const { handleStorageData } = useCoins();
      await handleStorageData(mockData);

      expect(mockSetTotalFlow).toHaveBeenCalledWith('5');
      expect(mockSetBalance).toHaveBeenCalledWith('$ 7.00');
      expect(mockSetCoinData).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ unit: 'FLOW' }),
          expect.objectContaining({ unit: 'WFLOW' }),
        ])
      );
    });

    it('should handle null totals', async () => {
      const mockData = [
        { unit: 'FLOW', total: null, balance: '10' },
        { unit: 'ETH', total: '2.0', balance: '2.0' },
      ];

      const { handleStorageData } = useCoins();
      await handleStorageData(mockData);

      expect(mockSetBalance).toHaveBeenCalledWith('$ 2.00');
    });
  });

  describe('refreshCoinData', () => {
    beforeEach(() => {
      // Reset all mocks
      vi.clearAllMocks();

      // Mock useWallet
      vi.mock('@/ui/utils/WalletContext', () => ({
        useWalletLoaded: vi.fn().mockResolvedValue(true),

        useWallet: () => ({
          refreshCoinList: vi.fn().mockResolvedValue(undefined),
          getMainWallet: vi.fn(),
          isUnlocked: vi.fn().mockResolvedValue(true),
          openapi: {
            getAccountMinFlow: vi.fn(),
          },
        }),
      }));

      // Mock storage
      vi.mock('@/background/webapi', () => ({
        storage: {
          get: vi.fn().mockResolvedValue([
            { unit: 'FLOW', total: '5.0', balance: '5.0' },
            { unit: 'WFLOW', total: '2.0', balance: '2.0' },
          ]),
        },
      }));
    });

    it('should handle empty data', async () => {
      const { refreshCoinData } = useCoins();
      await refreshCoinData();
      expect(mockSetCoinData).not.toHaveBeenCalled();
    });

    it('should handle null totals', async () => {
      const mockData = [
        { unit: 'USDC.e', total: null, balance: null },
        { unit: 'FLOW', total: '5.0', balance: '5.0' },
        { unit: 'WFLOW', total: '2.0', balance: '2.0' },
      ];

      const { refreshCoinData } = useCoins();

      await act(async () => {
        await refreshCoinData();
        // Wait for all promises to resolve
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      console.log('Storage mock calls:', vi.mocked(vi.fn()).mock.calls);
      console.log('TotalFlow mock calls:', mockSetTotalFlow.mock.calls);
    });
  });
});
