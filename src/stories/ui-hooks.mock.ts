// Mock for the entire ui/hooks directory

// Re-export everything from actual hooks that don't need mocking
export * from '../ui/hooks/use-data';
export * from './preference-hooks.mock';
export * from '../ui/hooks/use-coin-hooks';

// Import and re-export mocked hooks
export { useProfiles } from './useProfileHook.mock';
export { useNetwork } from './useNetworkHook.mock';
export { useFeatureFlag, useFeatureFlags, useLatestVersion } from './use-feature-flags.mock';

// Export other hooks with basic mocks if needed
export const useInitHook = () => ({
  initializeStore: () => Promise.resolve(),
});

export const useCoins = () => ({
  handleStorageData: () => {},
  updateTokenFilter: () => {},
  coins: [],
  tokenFilter: { hideDust: false, hideUnverified: false, filteredIds: [] },
  balance: '0',
  totalFlow: '0',
  availableFlow: '0',
  coinsLoaded: true,
});
