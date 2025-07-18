import React, { type ReactNode, createContext } from 'react';

import type { IExtractFromPromise } from '@onflow/flow-wallet-shared/types/type';

// eslint-disable-next-line no-restricted-imports
import type { WalletController as WalletControllerClass } from '@/background/controller/wallet';
import { walletLoadedKey } from '@/data-model/cache-data-keys';
import { useCachedData } from '@/ui/hooks/use-data';

export type WalletControllerType = {
  [key in keyof WalletControllerClass]: WalletControllerClass[key] extends (
    ...args: infer ARGS
  ) => infer RET
    ? <T extends IExtractFromPromise<RET> = IExtractFromPromise<RET>>(
        ...args: ARGS
      ) => Promise<IExtractFromPromise<T>>
    : WalletControllerClass[key];
};
export type WalletController = WalletControllerClass;

export const WalletContext = createContext<{
  wallet: WalletController;
  loaded: boolean;
} | null>(null);

export const WalletProvider = ({
  children,
  wallet,
}: {
  children?: ReactNode;
  wallet: WalletController;
}) => {
  const walletInitialized = useCachedData<boolean>(walletLoadedKey());
  return (
    <WalletContext.Provider value={{ wallet, loaded: walletInitialized ?? false }}>
      {children}
    </WalletContext.Provider>
  );
};
