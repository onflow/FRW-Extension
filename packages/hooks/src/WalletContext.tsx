import React, { type ReactNode, createContext } from 'react';

import type { WalletController as WalletControllerClass } from '@onflow/flow-wallet-shared/background/controller/wallet';
import { walletLoadedKey } from '@onflow/flow-wallet-shared/utils/cache-data-keys';
import type { IExtractFromPromise } from '@onflow/flow-wallet-shared/utils/type';
import { useCachedData } from './use-data';

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
