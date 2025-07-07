/*
 * Keys and types to access persistant data in the UI from the background storage cache
 * Persistant data is data that is stored between sessions
 */
import { type EvmCustomTokenInfo } from '../types/coin-types';
import { type FlowNetwork } from '../types/network-types';
import { type Currency, type FlowAddress, type WalletAddress } from '../types/wallet-types';

import { getUserData } from './user-data-access';
// Persistent storage keys
export const userWalletsKey = 'userWalletsV2';

// Stored in local storage
// key: `userWallets`
export type UserWalletStore = {
  monitor: string;
  emulatorMode: boolean;
  // The currently selected network
  network: FlowNetwork;
  // The public key of the currently active profile
  currentPubkey: string;
};

export const getUserWalletsData = async (): Promise<UserWalletStore | undefined> => {
  return await getUserData<UserWalletStore>(userWalletsKey);
};
// Profile Current Account - the user selected account on a given network
export const activeAccountsKey = (network: string, publicKey: string) =>
  `active-accounts-${network}-${publicKey}`;

export type ActiveAccountsStore = {
  // The main account address (Parent Flow Account)
  // - null if no main account is selected
  parentAddress: FlowAddress | null;
  // The current address that is actively selected
  // - this will be the parent address if the main account is selected, or
  // - a child account address for a child account
  // - or an evm account address for an evm account
  // - or null if no account is selected
  currentAddress: WalletAddress | null;
};

export const getActiveAccountsData = async (network: string, publicKey: string) => {
  const activeAccounts = await getUserData<ActiveAccountsStore>(
    activeAccountsKey(network, publicKey)
  );
  return activeAccounts;
};

export const getActiveAccountsByUserWallet = async (): Promise<ActiveAccountsStore | undefined> => {
  const userWallet = await getUserWalletsData();
  const activeAccounts = userWallet
    ? await getUserData<ActiveAccountsStore>(
        activeAccountsKey(userWallet.network, userWallet.currentPubkey)
      )
    : undefined;
  return activeAccounts;
};

export const preferencesKey = 'preference';

export type PreferencesStore = {
  displayCurrency: Currency;
  hiddenAccounts: string[];
};

export const getPreferencesData = async (): Promise<PreferencesStore | undefined> => {
  return await getUserData<PreferencesStore>(preferencesKey);
};

export const evmCustomTokenKey = (network: string) => `${network}evmCustomToken`;
export const getEvmCustomTokenData = async (network: string): Promise<EvmCustomTokenInfo[]> => {
  const data = await getUserData<EvmCustomTokenInfo[]>(evmCustomTokenKey(network));
  return data || [];
};

export const readAndDismissedNewsKey = () => `newsService`;
export type ReadAndDismissedNewsStore = {
  readIds: string[];
  dismissedIds: string[];
};

export const getReadAndDismissedNewsData = async (): Promise<
  ReadAndDismissedNewsStore | undefined
> => {
  return await getUserData<ReadAndDismissedNewsStore>(readAndDismissedNewsKey());
};
