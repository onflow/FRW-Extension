import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { registerBatchRefreshListener, batchRefreshManager } from './batch-refresh';
import { setCachedData } from './data-cache';

// Mock the storage module
vi.mock('@/shared/utils/storage', () => ({
  default: {
    setSession: vi.fn(),
    getSession: vi.fn(),
    removeSession: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock setCachedData
vi.mock('./data-cache', () => ({
  setCachedData: vi.fn().mockResolvedValue(undefined),
}));

// Store registered listeners
const storageListeners: ((changes: any, namespace: string) => void)[] = [];

// Mock chrome.storage.onChanged
global.chrome = {
  storage: {
    onChanged: {
      addListener: vi.fn((listener) => {
        storageListeners.push(listener);
      }),
    },
  },
} as any;

describe('Batch Refresh Mechanism', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    // Clear any existing batch managers
    batchRefreshManager.clear();
    // Clear listeners
    storageListeners.length = 0;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should batch multiple refresh requests within the time window', async () => {
    const batchLoader = vi.fn().mockResolvedValue({
      address1: 'balance1',
      address2: 'balance2',
      address3: 'balance3',
    });

    const keyPattern = /^account-balance-(\w+)-(\w+)-refresh$/;
    const getBatchKey = (matches: string[]) => matches[2]; // Extract address
    const getFullKey = (network: string, address: string) =>
      `account-balance-${network}-${address}`;

    registerBatchRefreshListener(
      keyPattern,
      batchLoader,
      getBatchKey,
      getFullKey,
      100 // 100ms batch window
    );

    // Get the registered listener
    const listener = storageListeners[0];

    // Trigger 3 refresh requests
    await listener(
      { 'account-balance-mainnet-address1-refresh': { oldValue: undefined, newValue: Date.now() } },
      'session'
    );

    await listener(
      { 'account-balance-mainnet-address2-refresh': { oldValue: undefined, newValue: Date.now() } },
      'session'
    );

    await listener(
      { 'account-balance-mainnet-address3-refresh': { oldValue: undefined, newValue: Date.now() } },
      'session'
    );

    // Batch loader should not be called immediately
    expect(batchLoader).not.toHaveBeenCalled();

    // Fast forward past the batch window
    await vi.advanceTimersByTimeAsync(150);

    // Batch loader should have been called once with all addresses
    expect(batchLoader).toHaveBeenCalledTimes(1);
    expect(batchLoader).toHaveBeenCalledWith('mainnet', ['address1', 'address2', 'address3']);

    // Individual cache entries should have been set
    expect(setCachedData).toHaveBeenCalledWith(
      'account-balance-mainnet-address1',
      'balance1',
      undefined
    );
    expect(setCachedData).toHaveBeenCalledWith(
      'account-balance-mainnet-address2',
      'balance2',
      undefined
    );
    expect(setCachedData).toHaveBeenCalledWith(
      'account-balance-mainnet-address3',
      'balance3',
      undefined
    );
  });

  it('should process batches separately for different networks', async () => {
    const batchLoader = vi
      .fn()
      .mockResolvedValueOnce({ address1: 'balance1' })
      .mockResolvedValueOnce({ address2: 'balance2' });

    const keyPattern = /^account-balance-(\w+)-(\w+)-refresh$/;
    const getBatchKey = (matches: string[]) => matches[2];
    const getFullKey = (network: string, address: string) =>
      `account-balance-${network}-${address}`;

    registerBatchRefreshListener(keyPattern, batchLoader, getBatchKey, getFullKey, 100);

    const listener = storageListeners[0];

    // Trigger refresh for different networks
    await listener(
      { 'account-balance-mainnet-address1-refresh': { oldValue: undefined, newValue: Date.now() } },
      'session'
    );
    await listener(
      { 'account-balance-testnet-address2-refresh': { oldValue: undefined, newValue: Date.now() } },
      'session'
    );

    await vi.advanceTimersByTimeAsync(150);

    // Should have been called twice, once for each network
    expect(batchLoader).toHaveBeenCalledTimes(2);
    expect(batchLoader).toHaveBeenCalledWith('mainnet', ['address1']);
    expect(batchLoader).toHaveBeenCalledWith('testnet', ['address2']);
  });

  it('should handle errors gracefully', async () => {
    // Mock consoleError from shared utils
    const consoleError = await import('@/shared/utils/console-log');
    const consoleErrorSpy = vi.spyOn(consoleError, 'consoleError').mockImplementation(() => {});
    const batchLoader = vi.fn().mockRejectedValue(new Error('Network error'));

    const keyPattern = /^account-balance-(\w+)-(\w+)-refresh$/;
    const getBatchKey = (matches: string[]) => matches[2];
    const getFullKey = (network: string, address: string) =>
      `account-balance-${network}-${address}`;

    registerBatchRefreshListener(keyPattern, batchLoader, getBatchKey, getFullKey, 100);

    const listener = storageListeners[0];

    await listener(
      { 'account-balance-mainnet-address1-refresh': { oldValue: undefined, newValue: Date.now() } },
      'session'
    );

    await vi.advanceTimersByTimeAsync(150);

    expect(batchLoader).toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('should handle partial results from batch loader', async () => {
    const batchLoader = vi.fn().mockResolvedValue({
      address1: 'balance1',
      // address2 is missing from results
      address3: 'balance3',
    });

    const keyPattern = /^account-balance-(\w+)-(\w+)-refresh$/;
    const getBatchKey = (matches: string[]) => matches[2];
    const getFullKey = (network: string, address: string) =>
      `account-balance-${network}-${address}`;

    registerBatchRefreshListener(keyPattern, batchLoader, getBatchKey, getFullKey, 100);

    const listener = storageListeners[0];

    // Request 3 addresses
    await listener(
      { 'account-balance-mainnet-address1-refresh': { oldValue: undefined, newValue: Date.now() } },
      'session'
    );
    await listener(
      { 'account-balance-mainnet-address2-refresh': { oldValue: undefined, newValue: Date.now() } },
      'session'
    );
    await listener(
      { 'account-balance-mainnet-address3-refresh': { oldValue: undefined, newValue: Date.now() } },
      'session'
    );

    await vi.advanceTimersByTimeAsync(150);

    // Only the addresses that were returned should be cached
    expect(setCachedData).toHaveBeenCalledTimes(2);
    expect(setCachedData).toHaveBeenCalledWith(
      'account-balance-mainnet-address1',
      'balance1',
      undefined
    );
    expect(setCachedData).toHaveBeenCalledWith(
      'account-balance-mainnet-address3',
      'balance3',
      undefined
    );
    expect(setCachedData).not.toHaveBeenCalledWith(
      'account-balance-mainnet-address2',
      expect.anything(),
      undefined
    );
  });

  it('should deduplicate requests for the same key', async () => {
    const batchLoader = vi.fn().mockResolvedValue({
      address1: 'balance1',
    });

    const keyPattern = /^account-balance-(\w+)-(\w+)-refresh$/;
    const getBatchKey = (matches: string[]) => matches[2];
    const getFullKey = (network: string, address: string) =>
      `account-balance-${network}-${address}`;

    registerBatchRefreshListener(keyPattern, batchLoader, getBatchKey, getFullKey, 100);

    const listener = storageListeners[0];

    // Trigger the same refresh multiple times
    await listener(
      { 'account-balance-mainnet-address1-refresh': { oldValue: undefined, newValue: Date.now() } },
      'session'
    );
    await listener(
      { 'account-balance-mainnet-address1-refresh': { oldValue: undefined, newValue: Date.now() } },
      'session'
    );
    await listener(
      { 'account-balance-mainnet-address1-refresh': { oldValue: undefined, newValue: Date.now() } },
      'session'
    );

    await vi.advanceTimersByTimeAsync(150);

    // Should only include address1 once
    expect(batchLoader).toHaveBeenCalledTimes(1);
    expect(batchLoader).toHaveBeenCalledWith('mainnet', ['address1']);
  });

  it('should process new batches after the previous batch completes', async () => {
    const batchLoader = vi
      .fn()
      .mockResolvedValueOnce({ address1: 'balance1' })
      .mockResolvedValueOnce({ address2: 'balance2' });

    const keyPattern = /^account-balance-(\w+)-(\w+)-refresh$/;
    const getBatchKey = (matches: string[]) => matches[2];
    const getFullKey = (network: string, address: string) =>
      `account-balance-${network}-${address}`;

    registerBatchRefreshListener(keyPattern, batchLoader, getBatchKey, getFullKey, 100);

    const listener = storageListeners[0];

    // First batch
    await listener(
      { 'account-balance-mainnet-address1-refresh': { oldValue: undefined, newValue: Date.now() } },
      'session'
    );

    await vi.advanceTimersByTimeAsync(150);
    expect(batchLoader).toHaveBeenCalledTimes(1);

    // Second batch (after first completes)
    await listener(
      { 'account-balance-mainnet-address2-refresh': { oldValue: undefined, newValue: Date.now() } },
      'session'
    );

    await vi.advanceTimersByTimeAsync(150);
    expect(batchLoader).toHaveBeenCalledTimes(2);
  });
});
