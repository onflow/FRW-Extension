import { useCallback } from 'react';

import { useWalletLoaded } from '../utils/WalletContext';

import { useCoins } from './useCoinHook';
import { useProfiles } from './useProfileHook';

export const useInitHook = () => {
  const walletLoaded = useWalletLoaded();
  const { fetchProfileData, freshUserWallet, fetchUserWallet } = useProfiles();
  const { refreshCoinData } = useCoins();

  const initializeStore = useCallback(async () => {
    if (!walletLoaded) {
      return;
    }

    await fetchProfileData();
    await freshUserWallet();
    await fetchUserWallet();
    await refreshCoinData();
  }, [fetchProfileData, freshUserWallet, fetchUserWallet, refreshCoinData, walletLoaded]);

  return { initializeStore };
};
