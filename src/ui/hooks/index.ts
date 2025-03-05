import { useCallback } from 'react';

import { useWalletLoaded } from '../utils/WalletContext';

import { useCoins } from './useCoinHook';
import { useNetworks } from './useNetworkHook';
import { useProfiles } from './useProfileHook';

export const useInitHook = () => {
  const walletLoaded = useWalletLoaded();
  const { fetchProfileData, freshUserWallet, fetchUserWallet } = useProfiles();
  const { fetchNetwork } = useNetworks();
  const { refreshCoinData } = useCoins();

  const initializeStore = useCallback(async () => {
    if (!walletLoaded) {
      return;
    }

    await fetchNetwork();
    await fetchProfileData();
    await freshUserWallet();
    await fetchUserWallet();
    await refreshCoinData();
  }, [
    fetchNetwork,
    fetchProfileData,
    freshUserWallet,
    fetchUserWallet,
    refreshCoinData,
    walletLoaded,
  ]);

  return { initializeStore };
};
