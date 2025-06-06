import React, { createContext, useContext } from 'react';
import { fn } from 'storybook/test';

// Mock wallet object with common methods that components might use
const mockWallet = {
  setActiveAccount: fn().mockName('setActiveAccount').mockResolvedValue(undefined),
  createManualAddress: fn().mockName('createManualAddress').mockResolvedValue(undefined),
  lockWallet: fn().mockName('lockWallet').mockResolvedValue(undefined),
  lockAdd: fn().mockName('lockAdd').mockResolvedValue(undefined),
  sendTransaction: fn().mockName('sendTransaction').mockResolvedValue('mock-tx-id'),
  getMainAccounts: fn().mockName('getMainAccounts').mockResolvedValue([]),
  getCurrentAddress: fn().mockName('getCurrentAddress').mockResolvedValue(null),
  getNetwork: fn().mockName('getNetwork').mockReturnValue('mainnet'),
  isLocked: fn().mockName('isLocked').mockReturnValue(false),
  // Add other wallet methods as needed
};

// Create a mock context with the expected structure
const MockWalletContext = createContext<{
  wallet: any;
  loaded: boolean;
} | null>({
  wallet: mockWallet,
  loaded: true,
});

// Mock the WalletProvider component
export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  return React.createElement(
    MockWalletContext.Provider,
    { value: { wallet: mockWallet, loaded: true } },
    children
  );
};

// Mock the useWallet hook to return the mock wallet object directly
export const useWallet = () => mockWallet;

// Mock the useWalletLoaded hook
export const useWalletLoaded = () => true;
// Export the wallet object itself in case it's needed
export const wallet = mockWallet;
