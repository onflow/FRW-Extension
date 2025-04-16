/*
 * Keys and types to access data in the UI from the background storage cache
 * This is the primary way to get cached data from network calls to the frontend
 */
import { type ExtendedTokenInfo } from '../types/coin-types';
import { type UserInfoResponse } from '../types/network-types';
import {
  type NFTCollections,
  type NFTCollectionData,
  type EvmNFTIds,
  type EvmNFTCollectionList,
} from '../types/nft-types';
import { type TransferItem } from '../types/transaction-types';
import {
  type MainAccount,
  type ChildAccountMap,
  type EvmAddress,
  type FlowAddress,
  type WalletAccount,
} from '../types/wallet-types';

import { getCachedData, triggerRefresh } from './cache-data-access';
import { type NetworkScripts } from './script-types';

// Utiltiy function to create the refresh key for a given key function
const refreshKey = (keyFunction: (...args: string[]) => string) =>
  ((args: string[] = ['(.+)', '(.+)', '(.+)', '(.+)']) =>
    new RegExp(`${keyFunction(...args)}-refresh`))();

/*
 * --------------------------------------------------------------------
 * User level keys
 * --------------------------------------------------------------------
 */
export const userInfoCachekey = (userId: string) => `user-info-${userId}`;
export const userInfoRefreshRegex = refreshKey(userInfoCachekey);
export type UserInfoStore = UserInfoResponse;

// Note we could do this per user but it's not worth the complexity
export const cadenceScriptsKey = () => `cadence-scripts`;
export const cadenceScriptsRefreshRegex = refreshKey(cadenceScriptsKey);
export type CadenceScriptsStore = NetworkScripts;

export const getCachedScripts = async () => {
  return getCachedData<CadenceScriptsStore>(cadenceScriptsKey());
};

/*
 * --------------------------------------------------------------------
 * Network level keys (keyed by network & public key)
 * --------------------------------------------------------------------
 */
// Profile Accounts - the Main (Flow) accounts of a given public key on a given network
export const mainAccountsKey = (network: string, publicKey: string) =>
  `main-accounts-${network}-${publicKey}`;

export const mainAccountsRefreshRegex = refreshKey(mainAccountsKey);

export type MainAccountStore = MainAccount[];

export const getCachedMainAccounts = async (network: string, publicKey: string) => {
  return getCachedData<MainAccountStore>(mainAccountsKey(network, publicKey));
};

/*
 * --------------------------------------------------------------------
 * Account level keys (keyed by network & MAIN FLOW account address)
 * --------------------------------------------------------------------
 */

// Child Accounts - the child accounts of a given main account on a given network
export const childAccountsKey = (network: string, mainAccountAddress: string) =>
  `child-accounts-${network}-${mainAccountAddress}`;
export const childAccountsRefreshRegex = refreshKey(childAccountsKey);

export type ChildAccountStore = WalletAccount[];

export const getCachedChildAccounts = async (network: string, mainAccountAddress: string) => {
  return getCachedData<ChildAccountStore>(childAccountsKey(network, mainAccountAddress));
};

// EVM Account - the EVM account of a given main account on a given network
export const evmAccountKey = (network: string, mainAccountAddress: string) =>
  `evm-account-${network}-${mainAccountAddress}`;

export const evmAccountRefreshRegex = refreshKey(evmAccountKey);

export type EvmAccountStore = WalletAccount;

export const getCachedEvmAccount = async (network: string, mainAccountAddress: string) => {
  return getCachedData<EvmAccountStore>(evmAccountKey(network, mainAccountAddress));
};

export const accountBalanceKey = (network: string, address: string) =>
  `account-balance-${network}-${address}`;

export const accountBalanceRefreshRegex = refreshKey(accountBalanceKey);

// Transfer list
export const transferListKey = (
  network: string,
  address: string,
  offset: string = '0',
  limit: string = '15'
) => `transfer-list-${network}-${address}-${offset}-${limit}`;

export const transferListRefreshRegex = refreshKey(transferListKey);
export type TransferListStore = {
  count: number;
  pendingCount: number;
  list: TransferItem[];
};

// NFTs

export const nftCollectionKey = (
  network: string,
  address: string,
  collectionId: string,
  offset: string
) => `nft-collection-${network}-${address}-${collectionId}-${offset}`;

export const nftCollectionRefreshRegex = refreshKey(nftCollectionKey);
export type NftCollectionStore = NFTCollectionData;

export const getCachedNftCollection = async (
  network: string,
  address: string,
  collectionId: string,
  offset: number
) => {
  return getCachedData<NFTCollectionData>(
    nftCollectionKey(network, address, collectionId, `${offset}`)
  );
};

export const nftCatalogCollectionsKey = (network: string, address: string) =>
  `nft-catalog-collections-${network}-${address}`;

export const nftCatalogCollectionsRefreshRegex = refreshKey(nftCatalogCollectionsKey);
export type NftCatalogCollectionsStore = NFTCollections[];

export const getCachedNftCatalogCollections = async (network: string, address: string) => {
  return getCachedData<NftCatalogCollectionsStore>(nftCatalogCollectionsKey(network, address));
};

export const refreshNftCatalogCollections = async (network: string, address: string) => {
  // Should rarely be used
  triggerRefresh(nftCatalogCollectionsKey(network, address));
};

export const childAccountAllowTypesKey = (network: string, parent: string, child: string) =>
  `child-account-allow-types-${network}-${parent}-${child}`;

export const childAccountAllowTypesRefreshRegex = refreshKey(childAccountAllowTypesKey);
export type ChildAccountAllowTypesStore = string[];

export const getCachedChildAccountAllowTypes = async (
  network: string,
  parent: string,
  child: string
) => {
  return getCachedData<ChildAccountAllowTypesStore>(
    childAccountAllowTypesKey(network, parent, child)
  );
};

export const childAccountNFTsKey = (network: string, address: string) =>
  `child-account-nfts-${network}-${address}`;

export const childAccountNFTsRefreshRegex = refreshKey(childAccountNFTsKey);
export type ChildAccountNFTsStore = { [address: string]: string[] };

export const getCachedChildAccountNFTs = async (network: string, address: string) => {
  return getCachedData<ChildAccountNFTsStore>(childAccountNFTsKey(network, address));
};

// EVM NFTs
export const evmNftIdsKey = (network: string, address: string) =>
  `evm-nft-ids-${network}-${address}`;

export const evmNftIdsRefreshRegex = refreshKey(evmNftIdsKey);
export type EvmNftIdsStore = EvmNFTIds[];

export const evmNftCollectionListKey = (
  network: string,
  address: string,
  collectionIdentifier: string,
  offset: string
) => `evm-nft-collection-list-${network}-${address}-${collectionIdentifier}-${offset}`;

export const evmNftCollectionListRefreshRegex = refreshKey(evmNftCollectionListKey);
export type EvmNftCollectionListStore = EvmNFTCollectionList[];

export const getCachedEvmNftCollectionList = async (
  network: string,
  address: string,
  collectionIdentifier: string,
  offset: number
) => {
  return getCachedData<EvmNftCollectionListStore>(
    evmNftCollectionListKey(network, address, collectionIdentifier, `${offset}`)
  );
};
//Coin list
export const coinListKey = (network: string, address: string, currency = 'usd') =>
  `coin-list-${network}-${address}-${currency}`;

export const coinListRefreshRegex = refreshKey(coinListKey);

export const getCachedCoinList = async (network: string, address: string, currency = 'usd') => {
  return getCachedData<ExtendedTokenInfo[]>(coinListKey(network, address, currency));
};
