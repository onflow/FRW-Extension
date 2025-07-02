import React, { type ReactNode, createContext, useContext } from 'react';
import type { Object } from 'ts-toolbelt';

import { walletLoadedKey } from '@/shared/utils/cache-data-keys';
import type { WalletController as WalletControllerClass } from 'background/controller/wallet';
import type { OpenApiService } from 'background/service/openapi';

import type { IExtractFromPromise } from '../../shared/utils/type';
import { useCachedData } from '../hooks/use-data';

export type WalletControllerType = {
  [key in keyof WalletControllerClass]: WalletControllerClass[key] extends (
    ...args: infer ARGS
  ) => infer RET
    ? <T extends IExtractFromPromise<RET> = IExtractFromPromise<RET>>(
        ...args: ARGS
      ) => Promise<IExtractFromPromise<T>>
    : WalletControllerClass[key];
};

export type WalletController = Object.Merge<
  WalletControllerClass,
  {
    openapi: {
      [key in keyof OpenApiService]: OpenApiService[key] extends (...args: infer ARGS) => infer RET
        ? <T extends IExtractFromPromise<RET> = IExtractFromPromise<RET>>(
            ...args: ARGS
          ) => Promise<IExtractFromPromise<T>>
        : OpenApiService[key];
    };
  }
>;

const WalletContext = createContext<{
  wallet: WalletController;
  loaded: boolean;
} | null>(null);

const useWalletLoaded = () => {
  const loaded = useCachedData<boolean>(walletLoadedKey());
  return loaded ?? false;
};

const WalletProvider = ({
  children,
  wallet,
}: {
  children?: ReactNode;
  wallet: WalletController;
}) => {
  const walletInitialized = useWalletLoaded();
  return (
    <WalletContext.Provider value={{ wallet, loaded: walletInitialized ?? false }}>
      {children}
    </WalletContext.Provider>
  );
};

const useWallet = () => {
  const { wallet } = useContext(WalletContext) as unknown as {
    wallet: WalletControllerType;
  };

  return wallet;
};

export { WalletProvider, useWallet, useWalletLoaded };
