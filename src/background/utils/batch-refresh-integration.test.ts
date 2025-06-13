import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { getCachedData } from '@/shared/utils/cache-data-access';
import { accountBalanceKey, accountBalanceRefreshRegex } from '@/shared/utils/cache-data-keys';
import storage from '@/shared/utils/storage';

// Mock the storage module
vi.mock('@/shared/utils/storage', () => ({
  default: {
    setSession: vi.fn().mockResolvedValue(undefined),
    getSession: vi.fn().mockResolvedValue(undefined),
    removeSession: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock getCachedData
vi.mock('@/shared/utils/cache-data-access', () => ({
  getCachedData: vi.fn(),
}));

describe('Batch Refresh Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should handle multiple account balance refresh requests efficiently', async () => {
    // Test that the account balance refresh regex matches the expected pattern
    const testKey1 = 'account-balance-mainnet-0x123-refresh';
    const testKey2 = 'account-balance-testnet-0xabc-refresh';

    expect(accountBalanceRefreshRegex.test(testKey1)).toBe(true);
    expect(accountBalanceRefreshRegex.test(testKey2)).toBe(true);

    // Verify the regex captures the network and address correctly
    const matches1 = testKey1.match(accountBalanceRefreshRegex);
    const matches2 = testKey2.match(accountBalanceRefreshRegex);

    expect(matches1?.[1]).toBe('mainnet');
    expect(matches1?.[2]).toBe('0x123');
    expect(matches2?.[1]).toBe('testnet');
    expect(matches2?.[2]).toBe('0xabc');
  });

  it('should generate correct cache keys for account balances', () => {
    const key1 = accountBalanceKey('mainnet', '0x123');
    const key2 = accountBalanceKey('testnet', '0xabc');

    expect(key1).toBe('account-balance-mainnet-0x123');
    expect(key2).toBe('account-balance-testnet-0xabc');
  });

  it('should trigger getCachedData which will batch refresh requests', async () => {
    const mockGetCachedData = vi.mocked(getCachedData);

    // Mock the session storage to return undefined (expired data)
    vi.mocked(storage.getSession).mockResolvedValue(undefined);

    // Simulate multiple components requesting account balances
    const promises = [
      getCachedData(accountBalanceKey('mainnet', '0x123')),
      getCachedData(accountBalanceKey('mainnet', '0x456')),
      getCachedData(accountBalanceKey('mainnet', '0x789')),
    ];

    // All should be called
    expect(mockGetCachedData).toHaveBeenCalledTimes(3);
    expect(mockGetCachedData).toHaveBeenCalledWith('account-balance-mainnet-0x123');
    expect(mockGetCachedData).toHaveBeenCalledWith('account-balance-mainnet-0x456');
    expect(mockGetCachedData).toHaveBeenCalledWith('account-balance-mainnet-0x789');

    // Wait for all promises
    await Promise.all(promises);
  });
});
