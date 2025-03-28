import { useCallback, useRef } from 'react';

import { useWalletLoaded } from '../utils/WalletContext';

import { useCoins } from './useCoinHook';
import { useProfiles } from './useProfileHook';

export const useInitHook = () => {
  const walletLoaded = useWalletLoaded();
  const { fetchProfileData } = useProfiles();
  const { refreshCoinData } = useCoins();
  const isInitializing = useRef(false);

  const initializeStore = useCallback(async () => {
    if (!walletLoaded || isInitializing.current) {
      console.log('Skipping initialization - wallet not loaded or already initializing');
      return;
    }

    try {
      isInitializing.current = true;

      await fetchProfileData();
      await refreshCoinData();
    } finally {
      isInitializing.current = false;
    }
  }, [fetchProfileData, refreshCoinData, walletLoaded]);

  return { initializeStore };
};
