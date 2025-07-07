import { useContext } from 'react';

import { walletLoadedKey } from '@onflow/flow-wallet-shared/utils/cache-data-keys';
import { type WalletControllerType, WalletContext } from './WalletContext';

import { useCachedData } from './use-data';

export const useWallet = () => {
  const { wallet } = useContext(WalletContext) as unknown as {
    wallet: WalletControllerType;
  };

  return wallet;
};
export const useWalletLoaded = () => {
  const loaded = useCachedData<boolean>(walletLoadedKey());
  return loaded ?? false;
};
