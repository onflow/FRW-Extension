import { act, useState, useEffect } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock React
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useEffect: vi.fn().mockImplementation((fn) => {
      const cleanup = fn();
      return cleanup;
    }),
    useState: vi.fn().mockImplementation((initialValue) => [initialValue, vi.fn()]),
  };
});

// Mock storage module - must be defined before the vi.mock call
vi.mock('@/shared/utils/storage', () => {
  return {
    default: {
      get: vi.fn().mockImplementation((key) => {
        if (key === 'developerMode') {
          return Promise.resolve(false);
        }
        if (key === 'emulatorMode') {
          return Promise.resolve(false);
        }
        if (key === userWalletsKey) {
          return Promise.resolve({ network: 'mainnet' });
        }
        return Promise.resolve({});
      }),
      addStorageListener: vi.fn(),
      removeStorageListener: vi.fn(),
    },
    __esModule: true,
  };
});

import storage from '@/shared/utils/storage';
import { userWalletsKey } from '@/shared/utils/user-data-keys';

import { useNetwork } from '../useNetworkHook';

// Get the mocked storage
const mockStorage = vi.mocked(storage);

describe('useNetworkHook', () => {
  let setNetworkMock: ReturnType<typeof vi.fn>;
  let setDeveloperModeMock: ReturnType<typeof vi.fn>;
  let setEmulatorModeOnMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    setNetworkMock = vi.fn();
    setDeveloperModeMock = vi.fn();
    setEmulatorModeOnMock = vi.fn();

    // Mock useState to return our mock setters
    vi.mocked(useState).mockImplementationOnce(() => ['mainnet', setNetworkMock]);
    vi.mocked(useState).mockImplementationOnce(() => [false, setDeveloperModeMock]);
    vi.mocked(useState).mockImplementationOnce(() => [false, setEmulatorModeOnMock]);

    // Reset storage mock with default values
    mockStorage.get.mockImplementation((key) => {
      if (key === 'developerMode') {
        return Promise.resolve(false);
      }
      if (key === 'emulatorMode') {
        return Promise.resolve(false);
      }
      if (key === userWalletsKey) {
        return Promise.resolve({ network: 'mainnet' });
      }
      return Promise.resolve({});
    });
  });

  it('should initialize with default values', () => {
    const { network, developerMode, emulatorModeOn } = useNetwork();

    expect(network).toBe('mainnet');
    expect(developerMode).toBe(false);
    expect(emulatorModeOn).toBe(false);
    expect(mockStorage.addStorageListener).toHaveBeenCalled();
  });

  it('should load initial data from storage', async () => {
    // Mock storage returns for initial load
    mockStorage.get.mockImplementation((key) => {
      if (key === 'developerMode') {
        return Promise.resolve(true);
      }
      if (key === 'emulatorMode') {
        return Promise.resolve(true);
      }
      if (key === userWalletsKey) {
        return Promise.resolve({ network: 'testnet' });
      }
      return Promise.resolve({});
    });

    useNetwork();

    // Wait for promises to resolve
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mockStorage.get).toHaveBeenCalledWith('developerMode');
    expect(mockStorage.get).toHaveBeenCalledWith('emulatorMode');
    expect(mockStorage.get).toHaveBeenCalledWith(userWalletsKey);
    expect(setDeveloperModeMock).toHaveBeenCalledWith(true);
    expect(setEmulatorModeOnMock).toHaveBeenCalledWith(true);
    expect(setNetworkMock).toHaveBeenCalledWith('testnet');
  });

  it('should handle storage changes for userWallets', () => {
    useNetwork();

    // Simulate storage change event for userWallets
    const handleStorageChange = mockStorage.addStorageListener.mock.calls[0][0];

    handleStorageChange(
      {
        [userWalletsKey]: {
          newValue: { network: 'testnet', emulatorMode: true },
          oldValue: { network: 'mainnet', emulatorMode: false },
        },
      },
      'local'
    );

    expect(setNetworkMock).toHaveBeenCalledWith('testnet');
    expect(setEmulatorModeOnMock).toHaveBeenCalledWith(true);
  });

  it('should handle storage changes for developerMode', () => {
    useNetwork();

    // Simulate storage change event for developerMode
    const handleStorageChange = mockStorage.addStorageListener.mock.calls[0][0];

    handleStorageChange(
      {
        developerMode: {
          newValue: true,
          oldValue: false,
        },
      },
      'local'
    );

    expect(setDeveloperModeMock).toHaveBeenCalledWith(true);
  });

  it('should clean up listeners on unmount', () => {
    useNetwork();

    // Get the cleanup function from the useEffect mock
    const cleanupFn = vi.mocked(useEffect).mock.calls[0][0]();

    if (cleanupFn) {
      // Call the cleanup function
      cleanupFn();

      expect(mockStorage.removeStorageListener).toHaveBeenCalled();
    }
  });

  it('should not update state if component is unmounted', async () => {
    // Create a flag to simulate mounted state
    let mounted = true;

    // Override the useEffect implementation for this test only
    vi.mocked(useEffect).mockImplementationOnce((fn) => {
      fn();
      return () => {
        mounted = false;
      };
    });

    // Override useState implementations to check mounted flag
    vi.mocked(useState).mockReset();
    vi.mocked(useState).mockImplementationOnce(() => [
      'mainnet',
      (val) => {
        if (mounted) setNetworkMock(val);
      },
    ]);
    vi.mocked(useState).mockImplementationOnce(() => [
      false,
      (val) => {
        if (mounted) setDeveloperModeMock(val);
      },
    ]);
    vi.mocked(useState).mockImplementationOnce(() => [
      false,
      (val) => {
        if (mounted) setEmulatorModeOnMock(val);
      },
    ]);

    // Mock storage to return delayed promises
    mockStorage.get.mockImplementation((key) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          if (key === 'developerMode') {
            resolve(true);
          } else if (key === 'emulatorMode') {
            resolve(true);
          } else if (key === userWalletsKey) {
            resolve({ network: 'testnet' });
          } else {
            resolve({});
          }
        }, 10); // Small delay to ensure it happens after unmount
      });
    });

    // Call the hook
    useNetwork();

    // Clear mocks before unmounting
    setNetworkMock.mockClear();
    setDeveloperModeMock.mockClear();
    setEmulatorModeOnMock.mockClear();

    // Simulate unmounting
    mounted = false;

    // Wait for delayed promises to resolve
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });

    // State setters should not be called after unmount
    expect(setNetworkMock).not.toHaveBeenCalled();
    expect(setDeveloperModeMock).not.toHaveBeenCalled();
    expect(setEmulatorModeOnMock).not.toHaveBeenCalled();
  });
});
