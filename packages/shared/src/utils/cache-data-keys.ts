/*
 * Keys and types to access data in the UI from the background storage cache
 * This is the primary way to get cached data from network calls to the frontend
 */
import {
  type CadenceTokenInfo,
  type CustomFungibleTokenInfo,
  type EvmTokenInfo,
  type ExtendedTokenInfo,
  type TokenFilter,
} from '../types/coin-types';
import { type FeatureFlags } from '../types/feature-types';
import {
  type AccountBalanceInfo,
  type NewsItem,
  type NftCollection,
  type NFTModelV2,
  type UserInfoResponse,
} from '../types/network-types';
import {
  type EvmNFTCollectionList,
  type EvmNFTIds,
  type NFTCollectionData,
  type NFTCollections,
} from '../types/nft-types';
import { type TransferItem } from '../types/transaction-types';
import { type Currency, type MainAccount, type PublicKeyAccount } from '../types/wallet-types';

import { getCachedData, triggerRefresh } from './cache-data-access';
import { type NetworkScripts } from './script-types';

// Utiltiy function to create the refresh key for a given key function
const refreshKey = (keyFunction: (...args: string[]) => string) =>
  ((args: string[] = ['(.+)', '(.+)', '(.+)', '(.+)']) =>
    new RegExp(`${keyFunction(...args)}-refresh`))();

/**
 * --------------------------------------------------------------------
 * Global keys
 * --------------------------------------------------------------------
 */
export const newsKey = () => `news`;
export const newsRefreshRegex = refreshKey(newsKey);
export type NewsStore = NewsItem[];

export const remoteConfigKey = () => `remote-config`;
export const remoteConfigRefreshRegex = refreshKey(remoteConfigKey);
export type RemoteConfig = {
  version: string;
  config: {
    features: FeatureFlags;
    payer: Record<
      'mainnet' | 'testnet' | 'previewnet' | 'sandboxnet' | 'crescendo',
      {
        address: string;
        keyId: number;
      }
    >;
    bridgeFeePayer?: Record<
      'mainnet' | 'testnet' | 'previewnet' | 'sandboxnet' | 'crescendo',
      {
        address: string;
        keyId: number;
      }
    >;
  };
};

export const walletLoadedKey = () => `wallet-loaded`;
export const walletLoadedRefreshRegex = refreshKey(walletLoadedKey);
export type WalletLoadedStore = boolean;
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

export const supportedCurrenciesKey = () => `supported-currencies`;
export const supportedCurrenciesRefreshRegex = refreshKey(supportedCurrenciesKey);
export type SupportedCurrenciesStore = Currency[];

export const getCachedSupportedCurrencies = async () => {
  return getCachedData<SupportedCurrenciesStore>(supportedCurrenciesKey());
};

export const registerStatusKey = (pubKey: string) => `register-status-${pubKey}`;

export const registerStatusRefreshRegex = refreshKey(registerStatusKey);
export type RegisterStatusStore = boolean;

export const userMetadataKey = (pubKey: string) => `user-metadata-${pubKey}`;
export const userMetadataRefreshRegex = refreshKey(userMetadataKey);
export type UserMetadataStore = Record<string, { background: string; icon: string; name: string }>;
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

// Pending Accounts
export const placeholderAccountsKey = (network: string, pubkey: string): string => {
  return `placeholder-accounts-${network}-${pubkey}`;
};
export const placeholderAccountsRefreshRegex = refreshKey(placeholderAccountsKey);
export type PlaceholderAccountsStore = PublicKeyAccount[];

// Pending Account Creation Transactions
export const pendingAccountCreationTransactionsKey = (network: string, pubkey: string) =>
  `pending-account-creation-transactions-${network}-${pubkey}`;
export const pendingAccountCreationTransactionsRefreshRegex = refreshKey(
  pendingAccountCreationTransactionsKey
);
export type PendingAccountCreationTransactionsStore = string[];

/*
 * --------------------------------------------------------------------
 * Account level keys (keyed by network & MAIN FLOW account address)
 * --------------------------------------------------------------------
 */

export const accountBalanceKey = (network: string, address: string) =>
  `account-balance-${network}-${address}`;
export const accountBalanceRefreshRegex = refreshKey(accountBalanceKey);

export const mainAccountStorageBalanceKey = (network: string, address: string) =>
  `account-storage-balance-${network}-${address}`;
export type MainAccountStorageBalanceStore = AccountBalanceInfo;

export const mainAccountStorageBalanceRefreshRegex = refreshKey(mainAccountStorageBalanceKey);

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

export const nftListKey = (network: string, chainType: string) =>
  `nft-list-${network}-${chainType}`;
export const nftListRefreshRegex = refreshKey(nftListKey);
export type NftListStore = NFTModelV2[];

export const nftCollectionListKey = (network: string) => `nft-collections-${network}`;
export const nftCollectionListRefreshRegex = refreshKey(nftCollectionListKey);
export type NftCollectionListStore = NftCollection[];

export const getCachedNftCollectionList = async (network: string) => {
  return getCachedData<NftCollectionListStore>(nftCollectionListKey(network));
};
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

export const childAccountNftsKey = (network: string, parentAddress: string) =>
  `child-account-nfts-${network}-${parentAddress}`;

export const childAccountNFTsRefreshRegex = refreshKey(childAccountNftsKey);
export type ChildAccountNFTs = {
  [nftCollectionId: string]: string[];
};
export type ChildAccountNFTsStore = {
  [address: string]: ChildAccountNFTs;
};

export const getCachedChildAccountNfts = async (network: string, parentAddress: string) => {
  return getCachedData<ChildAccountNFTsStore>(childAccountNftsKey(network, parentAddress));
};

// EVM NFTs
export const evmNftIdsKey = (network: string, address: string) =>
  `evm-nft-collection-ids-${network}-${address}`;

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
/**
 * Fungible Token information
 */

export const tokenListKey = (network: string, chainType: string) =>
  `token-list-${network}-${chainType}`;
export const tokenListRefreshRegex = refreshKey(tokenListKey);
export type TokenListStore = CustomFungibleTokenInfo[];

// Coinlist can be used for both EVM and Cadence tokens - this is the primary way to get token information
export const coinListKey = (network: string, address: string, currency: string = 'usd') =>
  `coin-list-${network}-${address}-${currency}`;

export const coinListRefreshRegex = refreshKey(coinListKey);
export type CoinListStore = ExtendedTokenInfo[];

export const getCachedCoinList = async (network: string, address: string, currency = 'usd') => {
  return getCachedData<ExtendedTokenInfo[]>(coinListKey(network, address, currency));
};

export const tokenFilterKey = (network: string, address: string) =>
  `token-filter-${network}-${address}`;

export type TokenFilterStore = TokenFilter[];

export const getCachedTokenFilter = async (network: string, address: string) => {
  return getCachedData<TokenFilterStore>(tokenFilterKey(network, address));
};

// This is used internally to cache EVM token information
// Potentially could be used in the future to replace ExtendedTokenInfo
export const evmTokenInfoKey = (network: string, address: string, currency: string = 'usd') =>
  `evm-token-info-${network}-${address}-${currency}`;

export const evmTokenInfoRefreshRegex = refreshKey(evmTokenInfoKey);
export type EvmTokenInfoStore = EvmTokenInfo[];

// This is used internally to cache Cadence token information
// Potentially could be used in the future to replace ExtendedTokenInfo
export const cadenceTokenInfoKey = (network: string, address: string, currency: string = 'usd') =>
  `cadence-token-info-${network}-${address}-${currency}`;

export const cadenceTokenInfoRefreshRegex = refreshKey(cadenceTokenInfoKey);
export type CadenceTokenInfoStore = CadenceTokenInfo[];

export const childAccountFtKey = (network: string, parentAddress: string, childAccount: string) =>
  `child-account-ft-${network}-${parentAddress}-${childAccount}`;

export const childAccountFtRefreshRegex = refreshKey(childAccountFtKey);
export type ChildAccountFtStore = { id: string; balance: string }[];

export const getCachedChildAccountFt = async (
  network: string,
  parentAddress: string,
  childAccount: string
) => {
  return getCachedData<ChildAccountFtStore>(
    childAccountFtKey(network, parentAddress, childAccount)
  );
};

export const childAccountDescKey = (address: string) => `childaccount-desc-${address}`;
