import * as fcl from '@onflow/fcl';
import type { Account as FclAccount } from '@onflow/typedefs';
import BigNumber from 'bignumber.js';
import dayjs from 'dayjs';
import { initializeApp, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithCustomToken,
  setPersistence,
  indexedDBLocalPersistence,
  signInAnonymously,
  onAuthStateChanged,
  type Unsubscribe,
  type User,
} from 'firebase/auth/web-extension';
import { getInstallations, getId } from 'firebase/installations';

import fetchConfig from '@/background/service/remoteConfig';
import { findKeyAndInfo } from '@/background/utils';
import { getValidData, setCachedData } from '@/background/utils/data-cache';
import { getFirbaseConfig, getFirbaseFunctionUrl } from '@/background/utils/firebaseConfig';
import { verifySignature } from '@/background/utils/modules/publicPrivateKey';
import { storage } from '@/background/webapi';
import type {
  BalanceMap,
  EvmTokenInfo,
  CadenceTokenInfo,
  FungibleTokenListResponse,
  FungibleTokenInfo,
  CustomFungibleTokenInfo,
} from '@/shared/types/coin-types';
import { CURRENT_ID_KEY } from '@/shared/types/keyring-types';
import {
  type AccountKeyRequest,
  type CheckResponse,
  type SignInResponse,
  type UserInfoResponse,
  type StorageInfo,
  type NewsItem,
  type NewsConditionType,
  Period,
  PriceProvider,
  type AccountBalanceInfo,
  type Contact,
  type NFTModelV2,
  type DeviceInfoRequest,
  type KeyResponseItem,
  type NftCollection,
  getPriceProvider,
  type PeriodFrequency,
} from '@/shared/types/network-types';
import { type NFTCollections } from '@/shared/types/nft-types';
import type { TokenInfo } from '@/shared/types/token-info';
import {
  type LoggedInAccountWithIndex,
  type LoggedInAccount,
  type FlowAddress,
  type PublicKeyAccount,
  type ActiveAccountType,
  type Currency,
  DEFAULT_CURRENCY,
} from '@/shared/types/wallet-types';
import { isValidFlowAddress } from '@/shared/utils/address';
import { getStringFromHashAlgo, getStringFromSignAlgo } from '@/shared/utils/algo';
import { cadenceScriptsKey } from '@/shared/utils/cache-data-keys';
import { consoleError, consoleLog } from '@/shared/utils/console-log';
import { returnCurrentProfileId } from '@/shared/utils/current-id';
import { getPeriodFrequency } from '@/shared/utils/getPeriodFrequency';
import { type NetworkScripts } from '@/shared/utils/script-types';
import { INITIAL_OPENAPI_URL, WEB_NEXT_URL } from 'consts';

import packageJson from '../../../package.json';

import {
  userWalletService,
  coinListService,
  addressBookService,
  userInfoService,
  transactionService,
  nftService,
  googleSafeHostService,
  mixpanelTrack,
} from './index';
const { version } = packageJson;

type CurrencyResponse = {
  data: {
    currencies: Currency[];
  };
};

type StorageResponse = {
  storageUsedInMB: string;
  storageAvailableInMB: string;
  storageCapacityInMB: string;
  lockedFLOWforStorage: string;
  availableBalanceToUse: string;
};

type CadenceTokensApiResponseV4 = {
  data: { result: CadenceTokenInfo[]; storage: StorageResponse };
};

type EvmTokensApiResponseV4 = {
  data: EvmTokenInfo[];
};
// New type definitions for API response for /v1/account/transaction

type TransactionResponseItem = {
  additional_message: string;
  status: string;
  error: boolean;
  token: string;
  title: string;
  time: string;
  receiver: string;
  sender: string;
  amount: string;
  type: number;
  transfer_type: number;
  image: string;
  txid: string;
};
export type FlowTransactionResponse = {
  total: number;
  transactions: TransactionResponseItem[];
};

type EvmTransactionResponse = {
  trxs: TransactionResponseItem[];
  next_page_params?: {
    items_count: number;
    value: '0';
  };
};

export interface OpenApiConfigValue {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'get' | 'post' | 'put' | 'delete';
  params?: string[];
}

export interface OpenApiStore {
  host: string;
  config: Record<string, OpenApiConfigValue>;
}

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

const firebaseConfig = getFirbaseConfig();
const app = initializeApp(firebaseConfig, process.env.NODE_ENV);
const auth = getAuth(app);
// const remoteConfig = getRemoteConfig(app);

const remoteFetch = fetchConfig;

const waitForAuthInit = async () => {
  let unsubscribe: Unsubscribe;
  await new Promise<void>((resolve) => {
    unsubscribe = auth.onAuthStateChanged((_user) => resolve());
  });
  (await unsubscribe!)();
};

onAuthStateChanged(auth, (user: User | null) => {
  if (user) {
    // User is signed in, see docs for a list of available properties
    // https://firebase.google.com/docs/reference/js/firebase.User
    // const uid = user.uid;
    if (user.isAnonymous) {
      consoleLog('User is anonymous');
    } else {
      if (mixpanelTrack) {
        mixpanelTrack.identify(user.uid, user.displayName ?? user.uid);
      }
      consoleLog('User is signed in');
    }
  } else {
    // User is signed out
    consoleLog('User is signed out');
  }
  // note fcl setup is async
  userWalletService.setupFcl();
});

const dataConfig: Record<string, OpenApiConfigValue> = {
  check_username: {
    path: '/v1/user/check',
    method: 'get',
    params: ['username'],
  },
  search_user: {
    path: '/v1/user/search',
    method: 'get',
    params: ['keyword'],
  },
  register: {
    path: '/v1/register',
    method: 'post',
    params: ['username', 'account_key'],
  },
  create_flow_address: {
    path: '/v1/user/address',
    method: 'post',
    params: [],
  },
  create_flow_address_v2: {
    path: '/v2/user/address',
    method: 'post',
    params: [],
  },
  loginv3: {
    path: '/v3/login',
    method: 'post',
    params: ['signature', 'account_key', 'device_info'],
  },
  importKey: {
    path: '/v3/import',
    method: 'post',
    params: ['username', 'account_key', 'device_info', 'backup_info', 'address'],
  },
  coin_map: {
    path: '/v1/coin/map',
    method: 'get',
    params: [],
  },
  user_info: {
    path: '/v1/user/info',
    method: 'get',
    params: [],
  },
  fetch_address_book: {
    path: '/v1/addressbook/contact',
    method: 'get',
    params: [],
  },
  add_address_book: {
    path: '/v1/addressbook/contact',
    method: 'put',
    params: ['contact_name', 'username', 'address', 'domain', 'domain_type'],
  },
  edit_address_book: {
    path: '/v1/addressbook/contact',
    method: 'post',
    params: ['id', 'contact_name', 'address', 'domain', 'domain_type'],
  },
  delete_address_book: {
    path: '/v1/addressbook/contact',
    method: 'delete',
    params: ['id'],
  },
  add_external_address_book: {
    path: '/v1/addressbook/external',
    method: 'put',
    params: ['contact_name', 'address', 'domain', 'domain_type'],
  },
  account_transaction: {
    path: '/v1/account/transaction',
    method: 'get',
    params: ['address', 'limit', 'offset'],
  },
  validate_recaptcha: {
    path: '/v1/user/recaptcha',
    method: 'get',
    params: ['token'],
  },
  crypto_map: {
    path: '/v1/crypto/map',
    method: 'get',
    params: ['provider', 'pair'],
  },
  crypto_flow: {
    path: '/v1/crypto/summary',
    method: 'get',
    params: ['provider', 'pair'],
  },
  crypto_history: {
    path: '/v1/crypto/history',
    method: 'get',
    params: ['provider', 'pair', 'after', 'history'],
  },
  account_query: {
    path: '/v1/account/query',
    method: 'post',
    params: ['query', 'operation_name'],
  },
  profile_preference: {
    path: '/v1/profile/preference',
    method: 'post',
    params: ['private'],
  },
  profile_update: {
    path: '/v1/profile',
    method: 'post',
    params: ['nickname', 'avatar'],
  },
  get_transfers: {
    path: '/api/v1/account/transfers',
    method: 'get',
    params: ['address', 'after', 'limit'],
  },
  manual_address: {
    path: '/v1/user/manualaddress',
    method: 'get',
    params: [],
  },
  device_list: {
    path: '/v1/user/device',
    method: 'get',
    params: [],
  },
  key_list: {
    path: '/v1/user/keys',
    method: 'get',
    params: [],
  },
  add_device: {
    path: '/v1/user/device',
    method: 'put',
    params: ['device_info', 'wallet_id', 'wallettest_id '],
  },
  add_device_v3: {
    path: '/v3/user/device',
    method: 'put',
    params: ['device_info', 'wallet_id', 'wallettest_id '],
  },
  get_location: {
    path: '/v1/user/location',
    method: 'get',
    params: [],
  },
  sync_device: {
    path: '/v3/sync',
    method: 'post',
    params: ['account_key', 'device_info '],
  },
  check_import: {
    path: '/v3/checkimport',
    method: 'get',
    params: ['key'],
  },
  get_version: {
    path: '/version',
    method: 'get',
    params: [],
  },
  get_ft_list: {
    path: '/api/v3/fts',
    method: 'get',
    params: ['network', 'chain_type'],
  },
  get_ft_list_full: {
    path: '/api/v3/fts/full',
    method: 'get',
    params: ['network', 'chain_type'],
  },
  get_nft_list: {
    path: '/api/v3/nfts',
    method: 'get',
    params: ['network', 'chain_type'],
  },
  create_manual_address_v2: {
    path: '/v2/user/manualaddress',
    method: 'post',
    params: ['account_key'],
  },
};

const recordFetch = async (response, responseData, ...args: Parameters<typeof fetch>) => {
  try {
    // Extract URL parameters from the first argument if it's a URL with query params
    const url = args[0].toString();
    const urlObj = new URL(url);
    const urlParams = Object.fromEntries(urlObj.searchParams.entries());

    // Send message to UI with request/response details

    const messageData = {
      method: args[1]?.method,
      url: args[0],
      params: urlParams, // URL parameters extracted from the URL
      requestInit: args[1],
      responseData, // Raw response from fetch
      timestamp: Date.now(),
      status: response.status,
      statusText: response.statusText,
      // Note: functionParams and functionResponse will be added by the calling function
    };
    consoleLog('fetchCallRecorder - response & messageData', response, messageData);

    chrome.runtime.sendMessage({
      type: 'API_CALL_RECORDED',
      data: messageData,
    });
  } catch (err) {
    consoleError('Error sending message to UI:', err);
  }
  return response;
};

export class OpenApiService {
  store: OpenApiStore = {
    host: INITIAL_OPENAPI_URL,
    config: dataConfig,
  };

  getNetwork = () => {
    return userWalletService.getNetwork();
  };

  init = async () => {
    await userWalletService.setupFcl();
  };

  checkAuthStatus = async () => {
    await waitForAuthInit();
    const app = getApp(process.env.NODE_ENV!);
    const user = await getAuth(app).currentUser;
    if (user && user.isAnonymous) {
      userWalletService.loginWithKeyring();
    }
  };

  sendRequest = async (
    method = 'GET',
    url = '',
    params: Record<string, string> = {},
    data: Record<string, unknown> = {},
    host = this.store.host
  ) => {
    // Default options are marked with *
    let requestUrl = '';

    if (
      Object.keys(params).length &&
      (method.toUpperCase() === 'GET' || method.toUpperCase() === 'DELETE')
    ) {
      requestUrl = host + url + '?' + new URLSearchParams(params).toString();
    } else {
      requestUrl = host + url;
    }
    // If network is provided in params, use it, otherwise get the network from the userWalletService
    const network =
      params.network ||
      (data.network && typeof data.network === 'string'
        ? data.network
        : await userWalletService.getNetwork());

    const app = getApp(process.env.NODE_ENV!);
    const user = await getAuth(app).currentUser;
    const init = {
      method,
      headers: {
        Network: network,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    };

    if (method.toUpperCase() !== 'GET') {
      init['body'] = JSON.stringify(data);
    }

    // Wait for firebase auth to complete
    await waitForAuthInit();

    if (user !== null) {
      const idToken = await user.getIdToken();
      init.headers['Authorization'] = 'Bearer ' + idToken;
    } else {
      // If no user, then sign in as anonymous first
      await signInAnonymously(auth);
      const anonymousUser = await getAuth(app).currentUser;
      const idToken = await anonymousUser?.getIdToken();
      init.headers['Authorization'] = 'Bearer ' + idToken;
    }

    const response = await fetch(requestUrl, init);
    const responseData = await response.json(); // parses JSON response into native JavaScript objects

    // Verify signature if present in headers
    try {
      const xsignature = response?.headers?.get('X-Signature');
      if (xsignature) {
        const isValid = await verifySignature(xsignature, responseData);
        if (!isValid) {
          throw new Error('Invalid signature in response');
        }
      }
    } catch (err) {
      consoleError('Error verifying signature:', err);

      // throw invalid signature error to prevent processing bad responses
      if (err instanceof Error && err.message === 'Invalid signature in response') {
        throw err;
      }
    }

    return responseData;
    // Record the response
  };

  /**
   * Return the USDC price pair for a given provider
   * @param provider - The provider to get the USDC price pair for
   * @returns The USDC price pair for the provider
   */
  private getUSDCPricePair = (provider: PriceProvider): string | null => {
    switch (provider) {
      case PriceProvider.binance:
        return 'usdcusdt';
      case PriceProvider.kakren:
        return 'usdcusd';
      case PriceProvider.huobi:
        return 'usdcusdt';
      default:
        return null;
    }
  };

  /**
   * Return the price pair for a given token and provider
   * @param token - The token to get the price pair for
   * @param provider - The provider to get the price pair for
   * @returns The price pair for the token and provider
   */
  getUSDCPrice = async (provider = PriceProvider.binance): Promise<CheckResponse> => {
    const config = this.store.config.crypto_map;
    const data = await this.sendRequest(config.method, config.path, {
      provider,
      pair: this.getUSDCPricePair(provider) || '',
    });
    return data.data.result;
  };

  /**
   * Return the price pair for a given provider
   * @param provider - The provider to get the price pair for
   * @returns The price pair for the provider
   */
  private getFlowPricePair = (provider: PriceProvider): string => {
    switch (provider) {
      case PriceProvider.binance:
        return 'flowusdt';
      case PriceProvider.kakren:
        return 'flowusd';
      case PriceProvider.huobi:
        return 'flowusdt';
      case PriceProvider.coinbase:
        return 'flowusd';
      case PriceProvider.kucoin:
        return 'flowusdt';
      default:
        return '';
    }
  };

  /**
   * Return the price by symbol
   * @param symbol - The symbol to get the price for
   * @param data - The data to get the price from
   * @returns The price for the symbol
   */
  getPricesBySymbol = async (symbol: string, data) => {
    const key = symbol.toUpperCase();
    return data[key];
  };

  /**
   * Return the price by address
   * @param symbol - The symbol to get the price for
   * @param data - The data to get the price from
   * @returns The price for the symbol
   */
  getPricesByAddress = async (symbol: string, data) => {
    const key = symbol.toLowerCase();
    return data[key];
  };

  /**
   * @deprecated This method is not used in the codebase.
   * Use getUserTokens instead. It will have token info and price.
   */
  getPricesByKey = async (symbol: string, data) => {
    const key = symbol.toLowerCase();
    return data[key];
  };

  /**
   * @deprecated This method is not used in the codebase.
   * Use getUserTokens instead. It will have token info and price.
   */
  getPricesByEvmaddress = async (address: string, data) => {
    const key = address.toLowerCase();
    return data[key];
  };

  getTokenPair = (token: string, provider: PriceProvider): string | null => {
    switch (token) {
      case 'usdc':
        return this.getUSDCPricePair(provider);
      case 'flow':
        return this.getFlowPricePair(provider);
      default:
        return null;
    }
  };

  /**
   * Get the price of a token
   * @param token - The token to get the price for
   * @param provider - The provider to get the price from
   * @returns The price of the token
   */
  getTokenPrice = async (
    token: string,
    provider = PriceProvider.binance
  ): Promise<{
    price: {
      change: {
        percentage: number;
      };
      last: number;
    };
  }> => {
    const config = this.store.config.crypto_flow;
    const pair = this.getTokenPair(token, provider);
    if (!pair) {
      throw new Error('no price provider found');
    }
    const data = await this.sendRequest(config.method, config.path, {
      provider,
      pair: pair,
    });
    return data.data.result;
  };

  /**
   * Get the price history of a token
   * @param token - The token to get the price history for
   * @param period - The period to get the price history for
   * @param provider - The provider to get the price history from
   * @returns The price history of the token
   */
  getTokenPriceHistoryArray = async (
    token: string,
    period = Period.oneDay,
    provider = PriceProvider.binance
  ): Promise<
    Record<PeriodFrequency, [number, number, number, number, number, number, number, number][]>
  > => {
    let after = dayjs();
    const periods = getPeriodFrequency(period);

    const providers = getPriceProvider(token);
    if (providers.length === 0) {
      throw new Error('no price provider found');
    }

    switch (period) {
      case Period.oneDay:
        after = after.subtract(1, 'days');
        break;
      case Period.oneWeek:
        after = after.subtract(7, 'days');
        break;
      case Period.oneMonth:
        after = after.subtract(1, 'months');
        break;
      case Period.threeMonth:
        after = after.subtract(3, 'months');
        break;
      case Period.oneYear:
        after = after.subtract(1, 'years');
        break;
    }

    const config = this.store.config.crypto_history;
    const data = await this.sendRequest(config.method, config.path, {
      provider,
      pair: this.getTokenPair(token, provider) || '',
      after: period === Period.all ? '' : after.unix().toString(),
      periods: periods.toString(),
    });
    return data.data.result;
  };

  /**
   * Login with a custom token
   * @param userId - The user id to login with
   * @param token - The custom token to login with
   */
  private _loginWithToken = async (userId: string, token: string) => {
    this.clearAllStorage();
    await setPersistence(auth, indexedDBLocalPersistence);
    await signInWithCustomToken(auth, token);
    await storage.set(CURRENT_ID_KEY, userId);

    // Kick off loaders that use the current user id
    userInfoService.loadUserInfoByUserId(userId);
  };

  private clearAllStorage = () => {
    nftService.clear();
    userInfoService.removeUserInfo();
    coinListService.clear();
    addressBookService.clear();
    userWalletService.clear();
    transactionService.clear();
  };

  /**
   * --------------------------------------------------------------------
   * Loaders
   * --------------------------------------------------------------------
   */
  /**
   * Load the cadence scripts for the current user
   * @param userId - The user id to load the cadence scripts for
   * @returns The cadence scripts for the current user
   */
  private _cadenceScriptsPromise: Promise<NetworkScripts> | null = null;

  private _loadCadenceScripts = async (): Promise<NetworkScripts> => {
    // Try to get from cache first
    const cadenceScripts = await getValidData<NetworkScripts>(cadenceScriptsKey());
    if (cadenceScripts) {
      return cadenceScripts;
    }

    // If there's already a request in progress, return that promise instead of making a new request
    if (this._cadenceScriptsPromise) {
      return this._cadenceScriptsPromise;
    }

    // Create a new promise
    const promise = this.cadenceScriptsV2().then((result) => {
      // Store in cache on success
      setCachedData(cadenceScriptsKey(), result, 1000 * 60 * 60); // 1 hour
      return result;
    });

    this._cadenceScriptsPromise = promise;

    promise.finally(() => {
      if (this._cadenceScriptsPromise === promise) {
        this._cadenceScriptsPromise = null;
      }
    });

    return promise;
  };

  getCadenceScripts = async (): Promise<NetworkScripts> => {
    return await this._loadCadenceScripts();
  };
  checkUsername = async (username: string) => {
    const config = this.store.config.check_username;
    const data = await this.sendRequest(config.method, config.path, {
      username,
    });
    return data;
  };

  register = async (account_key: AccountKeyRequest, username: string) => {
    // Track the time until account_created is called
    mixpanelTrack.time('account_created');

    const config = this.store.config.register;
    const data = await this.sendRequest(
      config.method,
      config.path,
      {},
      {
        account_key,
        username,
      }
    );
    await this._loginWithToken(data.data.id, data.data.custom_token);

    // Track the registration
    mixpanelTrack.track('account_created', {
      public_key: account_key.public_key,
      sign_algo: getStringFromSignAlgo(account_key.sign_algo),
      hash_algo: getStringFromHashAlgo(account_key.hash_algo),
    });
    return data;
  };

  loginV3 = async (
    account_key: AccountKeyRequest,
    device_info: DeviceInfoRequest,
    signature: string,
    replaceUser = true
  ): Promise<SignInResponse> => {
    const config = this.store.config.loginv3;
    const result = await this.sendRequest(
      config.method,
      config.path,
      {},
      { account_key, device_info, signature }
    );
    if (!result.data) {
      const currentId = await returnCurrentProfileId();
      throw new Error(`NoUserFound currentId: ${currentId} public_key: ${account_key.public_key} `);
    }
    if (replaceUser) {
      await this._loginWithToken(result.data.id, result.data.custom_token);
    }
    return result;
  };

  proxytoken = async () => {
    // Default options are marked with *

    const app = getApp(process.env.NODE_ENV!);

    // Wait for firebase auth to complete
    await waitForAuthInit();

    await signInAnonymously(auth);
    const anonymousUser = await getAuth(app).currentUser;
    const idToken = await anonymousUser?.getIdToken();
    return idToken;
  };

  importKey = async (
    account_key: AccountKeyRequest,
    device_info: DeviceInfoRequest,
    username: string,
    backup_info: any,
    address: string,
    replaceUser = true
  ): Promise<SignInResponse> => {
    const config = this.store.config.importKey;
    const result = await this.sendRequest(
      config.method,
      config.path,
      {},
      { username, address, account_key, device_info, backup_info }
    );
    if (!result.data) {
      throw new Error('NoUserFound');
    }
    if (replaceUser) {
      await this._loginWithToken(result.data.id, result.data.custom_token);
    }
    return result;
  };

  coinMap = async () => {
    const config = this.store.config.coin_map;
    const data = await this.sendRequest(config.method, config.path);
    return data;
  };

  userInfo = async (): Promise<UserInfoResponse> => {
    const config = this.store.config.user_info;
    const { data } = await this.sendRequest(config.method, config.path);
    return data;
  };

  createFlowAddress = async () => {
    const config = this.store.config.create_flow_address;
    const data = await this.sendRequest(config.method, config.path);
    return data;
  };

  createFlowAddressV2 = async () => {
    const config = this.store.config.create_flow_address_v2;
    const data = await this.sendRequest(config.method, config.path);
    return data;
  };

  getMoonpayURL = async (url) => {
    const baseURL = getFirbaseFunctionUrl();
    const response = await this.sendRequest('POST', '/moonPaySignature', {}, { url: url }, baseURL);
    return response;
  };

  signPayer = async (transaction, message: string) => {
    const messages = {
      envelope_message: message,
    };
    const baseURL = getFirbaseFunctionUrl();
    // 'http://localhost:5001/lilico-dev/us-central1'
    const data = await this.sendRequest(
      'POST',
      '/signAsPayer',
      {},
      { transaction, message: messages },
      baseURL
    );
    // (config.method, config.path, {}, { transaction, message: messages });
    return data;
  };

  signBridgeFeePayer = async (transaction, message: string) => {
    const messages = {
      envelope_message: message,
    };
    const data = await this.sendRequest(
      'POST',
      '/api/signAsBridgeFeePayer',
      {},
      { transaction, message: messages },
      WEB_NEXT_URL
    );
    // (config.method, config.path, {}, { transaction, message: messages });
    return data;
  };
  signProposer = async (transaction, message: string) => {
    const messages = {
      envelope_message: message,
    };
    const baseURL = getFirbaseFunctionUrl();
    // 'http://localhost:5001/lilico-dev/us-central1'
    const data = await this.sendRequest(
      'POST',
      '/signAsProposer',
      {},
      { transaction, message: messages },
      baseURL
    );
    // (config.method, config.path, {}, { transaction, message: messages });
    return data;
  };

  getProposer = async () => {
    const baseURL = getFirbaseFunctionUrl();
    // 'http://localhost:5001/lilico-dev/us-central1'
    const data = await this.sendRequest('GET', '/getProposer', {}, {}, baseURL);
    // (config.method, config.path, {}, { transaction, message: messages });
    return data;
  };

  getNFTList = async (network: string, chainType: 'flow' | 'evm'): Promise<NFTModelV2[]> => {
    const config = this.store.config.get_nft_list;
    const { tokens }: { tokens: NFTModelV2[] } = await this.sendRequest(
      config.method,
      config.path,
      {
        network,
        chain_type: chainType,
      },
      {},
      WEB_NEXT_URL
    );

    return tokens;
  };

  getAddressBook = async (): Promise<{ data: { contacts: Contact[] } }> => {
    const config = this.store.config.fetch_address_book;
    const data = await this.sendRequest(config.method, config.path);
    return data;
  };

  addAddressBook = async (
    contact_name: string,
    address: string,
    username = '',
    domain = '',
    domain_type = 0
  ) => {
    const config = this.store.config.add_address_book;
    const data = await this.sendRequest(
      config.method,
      config.path,
      {},
      {
        contact_name,
        address,
        username,
        domain,
        domain_type,
      }
    );
    return data;
  };

  editAddressBook = async (
    id: number,
    contact_name: string,
    address: string,
    domain = '',
    domain_type = 0
  ) => {
    const config = this.store.config.edit_address_book;
    const data = await this.sendRequest(
      config.method,
      config.path,
      {},
      {
        id,
        contact_name,
        address,
        domain,
        domain_type,
      }
    );
    return data;
  };

  deleteAddressBook = async (id: number) => {
    const config = this.store.config.delete_address_book;
    const data = await this.sendRequest(config.method, config.path, { id: id.toString() });
    return data;
  };

  addExternalAddressBook = async (
    contact_name: string,
    address: string,
    domain = '',
    domain_type = 0
  ) => {
    const config = this.store.config.add_external_address_book;
    const data = await this.sendRequest(
      config.method,
      config.path,
      {},
      {
        contact_name,
        address,
        domain,
        domain_type,
      }
    );
    return data;
  };

  getFlowAccount = async (address: string) => {
    try {
      const account = await fcl.account(address);
      return account;
    } catch (error) {
      return null;
    }
  };

  checkChildAccount = async (address: string) => {
    const script = await getScripts(
      userWalletService.getNetwork(),
      'hybridCustody',
      'checkChildAccount'
    );
    const result = await fcl.query({
      cadence: script,
      args: (arg, t) => [arg(address, t.Address)],
    });
    return result;
  };

  queryAccessible = async (address: string, childAccount: string) => {
    const script = await getScripts(
      userWalletService.getNetwork(),
      'hybridCustody',
      'checkChildAccount'
    );

    const result = await fcl.query({
      cadence: script,
      args: (arg, t) => [arg(address, t.Address), arg(childAccount, t.Address)],
    });
    return result;
  };

  queryAccessibleFt = async (network: string, address: string, childAccount: string) => {
    const script = await getScripts(network, 'hybridCustody', 'getAccessibleCoinInfo');

    const result = await fcl.query({
      cadence: script,
      args: (arg, t) => [arg(address, t.Address), arg(childAccount, t.Address)],
    });
    return result;
  };

  checkChildAccountMeta = async (address: string) => {
    const script = await getScripts(
      userWalletService.getNetwork(),
      'hybridCustody',
      'getChildAccountMeta'
    );
    try {
      const res = await fcl.query({
        cadence: script,
        args: (arg, t) => [arg(address, t.Address)],
      });
      return res;
    } catch (err) {
      return null;
    }
  };

  getFlownsAddress = async (domain: string, root = 'fn') => {
    const script = await getScripts(userWalletService.getNetwork(), 'basic', 'getFlownsAddress');

    const address = await fcl.query({
      cadence: script,
      args: (arg, t) => [arg(domain, t.String), arg(root, t.String)],
    });
    return address;
  };

  getAccountMinFlow = async (address: string) => {
    const script = await getScripts(userWalletService.getNetwork(), 'basic', 'getAccountMinFlow');
    if (isValidFlowAddress(address)) {
      const minFlow = await fcl.query({
        cadence: script,
        args: (arg, t) => [arg(address, t.Address)],
      });
      return minFlow;
    }
  };

  getFindAddress = async (domain: string) => {
    const script = await getScripts(userWalletService.getNetwork(), 'basic', 'getFindAddress');

    const address = await fcl.query({
      cadence: script,
      args: (arg, t) => [arg(domain, t.String)],
    });
    return address;
  };

  getFindDomainByAddress = async (domain: string) => {
    const script = await getScripts(
      userWalletService.getNetwork(),
      'basic',
      'getFindDomainByAddress'
    );

    const address = await fcl.query({
      cadence: script,
      args: (arg, t) => [arg(domain, t.Address)],
    });
    return address;
  };

  getTransfers = async (
    address: string,
    offset: number,
    limit: number
  ): Promise<FlowTransactionResponse> => {
    const config = this.store.config.get_transfers;
    const { data } = await this.sendRequest(
      config.method,
      config.path,
      {
        address,
        after: offset.toString(),
        limit: limit.toString(),
      },
      {},
      WEB_NEXT_URL
    );

    return data;
  };

  getEVMTransfers = async (
    address: string,
    offset: number,
    limit: number
  ): Promise<EvmTransactionResponse> => {
    const data = await this.sendRequest(
      'GET',
      `/api/evm/${address}/transactions`,
      {},
      {},
      WEB_NEXT_URL
    );
    return data;
  };

  getManualAddress = async () => {
    const config = this.store.config.manual_address;
    const data = await this.sendRequest(config.method, config.path, {});

    return data;
  };

  createNewAccount = async (
    network: string,
    hash_algo: number,
    sign_algo: number,
    public_key: string,
    weight: number
  ) => {
    const transformedKey = {
      hashAlgorithm: hash_algo,
      publicKey: public_key,
      signatureAlgorithm: sign_algo,
      weight: weight,
    };
    const config = this.store.config.create_manual_address_v2;
    const data = await this.sendRequest(config.method, config.path, { network }, transformedKey);

    return data;
  };

  deviceList = async () => {
    const config = this.store.config.device_list;
    const data = await this.sendRequest(config.method, config.path, {});

    return data;
  };

  keyList = async (): Promise<{
    data: {
      result: KeyResponseItem[];
    };
  }> => {
    const config = this.store.config.key_list;
    const data = await this.sendRequest(config.method, config.path, {});

    return data;
  };

  getLocation = async () => {
    const config = this.store.config.get_location;
    const data = await this.sendRequest(config.method, config.path, {});

    return data;
  };

  addDevice = async (params) => {
    const config = this.store.config.add_device_v3;
    const data = await this.sendRequest(config.method, config.path, {}, params);

    return data;
  };

  synceDevice = async (params) => {
    const config = this.store.config.sync_device;
    const data = await this.sendRequest(config.method, config.path, {}, params);

    return data;
  };

  getInstallationId = async () => {
    const installations = await getInstallations(app);
    const id = await getId(installations);
    return id;
  };

  searchUser = async (
    keyword: string
  ): Promise<{
    data: { users: { address: string; username: string; avatar: string; nickname: string }[] };
  }> => {
    const config = this.store.config.search_user;
    const data = await this.sendRequest(config.method, config.path, {
      keyword,
    });

    return data?.data?.users ? data : { data: { users: [] } };
  };

  checkImport = async (key: string) => {
    const config = this.store.config.check_import;
    const data = await this.sendRequest(config.method, config.path, {
      key,
    });

    return data;
  };

  getStorageInfo = async (address: string): Promise<StorageInfo> => {
    const script = await getScripts(userWalletService.getNetwork(), 'basic', 'getStorageInfo');

    const result = await fcl.query({
      cadence: script,
      args: (arg, t) => [arg(address, t.Address)],
    });

    return {
      available: result['available'],
      used: result['used'],
      capacity: result['capacity'],
    };
  };

  getFlowAccountInfo = async (network: string, address: string): Promise<AccountBalanceInfo> => {
    const script = await getScripts(network, 'basic', 'getAccountInfo');

    const result = await fcl.query({
      cadence: script,
      args: (arg, t) => [arg(address, t.Address)],
    });

    return {
      address: result['address'],
      balance: result['balance'],
      availableBalance: result['availableBalance'],
      storageUsed: result['storageUsed'],
      storageCapacity: result['storageCapacity'],
    };
  };
  getTokenBalanceWithModel = async (address: string, token: CustomFungibleTokenInfo) => {
    const script = await getScripts(
      userWalletService.getNetwork(),
      'basic',
      'getTokenBalanceWithModel'
    );
    if (!token.contractName || !token.path || !token.address) {
      throw new Error('Invalid token');
    }
    const network = await userWalletService.getNetwork();
    const cadence = script
      .replaceAll('<Token>', token.contractName)
      .replaceAll('<TokenBalancePath>', token.path.balance)
      .replaceAll('<TokenAddress>', token.address);
    const balance = await fcl.query({
      cadence: cadence,
      args: (arg, t) => [arg(address, t.Address)],
    });

    return balance;
  };

  fetchFTList = async (network: string, chainType: string): Promise<TokenInfo[]> => {
    const config = this.store.config.get_ft_list;
    const data = await this.sendRequest(
      config.method,
      config.path,
      {
        network,
        chain_type: chainType,
      },
      {},
      WEB_NEXT_URL
    );
    return data.tokens;
  };

  fetchFTListFull = async (network: string, chainType: string): Promise<FungibleTokenInfo[]> => {
    const config = this.store.config.get_ft_list_full;
    const data: FungibleTokenListResponse = await this.sendRequest(
      config.method,
      config.path,
      {
        network,
        chain_type: chainType,
      },
      {},
      WEB_NEXT_URL
    );

    return data.tokens;
  };

  // todo
  isTokenStorageEnabled = async (address: string, token: CustomFungibleTokenInfo) => {
    const network = await userWalletService.getNetwork();
    const script = await getScripts(
      userWalletService.getNetwork(),
      'basic',
      'isTokenStorageEnabled'
    );
    if (!token.contractName || !token.path || !token.address) {
      throw new Error('Invalid token');
    }
    const cadence = script
      .replaceAll('<Token>', token.contractName)
      .replaceAll('<TokenBalancePath>', token.path.balance)
      .replaceAll('<TokenReceiverPath>', token.path.receiver)
      .replaceAll('<TokenAddress>', token.address);

    const isEnabled = await fcl.query({
      cadence: cadence,
      args: (arg, t) => [arg(address, t.Address)],
    });

    return isEnabled;
  };

  isTokenListEnabled = async (address: string) => {
    const script = await getScripts(userWalletService.getNetwork(), 'ft', 'isTokenListEnabled');
    const isEnabledList = await fcl.query({
      cadence: script,
      args: (arg, t) => [arg(address, t.Address)],
    });
    return isEnabledList;
  };

  isLinkedAccountTokenListEnabled = async (address: string) => {
    const script = await getScripts(
      userWalletService.getNetwork(),
      'ft',
      'isLinkedAccountTokenListEnabled'
    );
    const isEnabledList = await fcl.query({
      cadence: script,
      args: (arg, t) => [arg(address, t.Address)],
    });
    return isEnabledList;
  };

  getTokenListBalance = async (address: string, allTokens: TokenInfo[]): Promise<BalanceMap> => {
    const script = await getScripts(userWalletService.getNetwork(), 'ft', 'getTokenListBalance');
    const balanceList = await fcl.query({
      cadence: script,
      args: (arg, t) => [arg(address, t.Address)],
    });

    return balanceList;
  };

  getTokenBalanceStorage = async (address: string): Promise<BalanceMap> => {
    const script = await getScripts(userWalletService.getNetwork(), 'ft', 'getTokenBalanceStorage');
    const balanceList = await fcl.query({
      cadence: script,
      args: (arg, t) => [arg(address, t.Address)],
    });

    return balanceList;
  };

  getBlockList = async (hosts: string[] = [], forceCheck = false): Promise<string[]> => {
    return await googleSafeHostService.getBlockList(hosts, forceCheck);
  };

  getEnabledNFTList = async (): Promise<{ address: string; contractName: string }[]> => {
    const address = await userWalletService.getCurrentAddress();
    if (!address) return [];

    const getNftBalanceStorage = await this.getNftBalanceStorage(address);

    const resultArray = Object.entries(getNftBalanceStorage).map(([key]) => {
      // ignore the prefix
      const [, address, contractName] = key.split('.');
      return {
        address: `0x${address}`,
        contractName: contractName,
      };
    });

    return resultArray;
  };

  checkNFTListEnabled = async (address: string): Promise<Record<string, boolean>> => {
    // Returns a map of enabled NFTs for the address
    const script = await getScripts(userWalletService.getNetwork(), 'nft', 'checkNFTListEnabled');

    const isEnabledList = await fcl.query({
      cadence: script,
      args: (arg, t) => [arg(address, t.Address)],
    });
    return isEnabledList;
  };

  getNftBalanceStorage = async (address: string): Promise<Record<string, number>> => {
    // Returns a map of enabled NFTs for the address
    const script = await getScripts(
      userWalletService.getNetwork(),
      'collection',
      'getNFTBalanceStorage'
    );

    const isEnabledList = await fcl.query({
      cadence: script,
      args: (arg, t) => [arg(address, t.Address)],
    });
    return isEnabledList;
  };

  getTransactionTemplate = async (cadence: string, network: string) => {
    const base64 = Buffer.from(cadence, 'utf8').toString('base64');

    const data = {
      cadence_base64: base64,
      network: network.toLowerCase(),
    };
    const init = {
      method: 'POST',
      async: true,
      body: JSON.stringify(data),
      headers: {
        Network: network,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    };

    const response = await fetch('https://flix.flow.com/v1/templates/search', init);

    const template = await response.json();

    const auditorsResponse = await fetch(`https://flix.flow.com/v1/auditors?network=${network}`);
    const auditors = await auditorsResponse.json();

    fcl.config().put(
      'flow.auditors',
      auditors.map((item) => item.address)
    );

    const audits = await fcl.InteractionTemplateUtils.getInteractionTemplateAudits({
      template: template,
      auditors: auditors.map((item) => item.address),
    });

    const addresses = Object.keys(audits).filter((address) => audits[address]);

    if (addresses.length <= 0) {
      return null;
    }

    const result = auditors.filter((item) => addresses.includes(item.address));
    if (result.length <= 0) {
      return null;
    }
    return {
      auditor: result[0],
      template,
    };
  };

  validateRecaptcha = async (token: string) => {
    const config = this.store.config.validate_recaptcha;
    const data = await this.sendRequest(config.method, config.path, {
      token,
    });

    return data;
  };

  pingNetwork = async (network: string): Promise<boolean> => {
    try {
      const response = await fetch(`https://rest-${network}.onflow.org/v1/blocks?height=sealed`);
      const result = await response.json();
      return result[0].header !== null && result[0].header !== undefined;
    } catch (err) {
      return false;
    }
  };

  updateProfilePreference = async (privacy: number) => {
    const config = this.store.config.profile_preference;
    const data = await this.sendRequest(
      config.method,
      config.path,
      {},
      {
        private: privacy,
      }
    );

    return data;
  };

  updateProfile = async (nickname: string, avatar: string) => {
    const config = this.store.config.profile_update;
    const data = await this.sendRequest(
      config.method,
      config.path,
      {},
      {
        nickname: nickname,
        avatar: avatar,
      }
    );

    return data;
  };

  cadenceScriptsV2 = async (): Promise<NetworkScripts> => {
    const { data } = await this.sendRequest('GET', '/api/v2/scripts', {}, {}, WEB_NEXT_URL);
    return data;
  };

  nftCatalogList = async (address: string, limit: any, offset: any, network: string) => {
    const { data } = await this.sendRequest(
      'GET',
      `/api/v2/nft/list?address=${address}&limit=${limit}&offset=${offset}&network=${network}`,
      {},
      {},
      WEB_NEXT_URL
    );
    return data;
  };

  nftCatalogCollections = async (address: string, network: string): Promise<NFTCollections[]> => {
    const { data } = await this.sendRequest(
      'GET',
      `/api/v2/nft/id?address=${address}&network=${network}`,
      {},
      {},
      WEB_NEXT_URL
    );
    return data;
  };

  nftCatalogCollectionList = async (
    address: string,
    contractName: string,
    limit: any,
    offset: any,
    network: string
  ) => {
    const { data } = await this.sendRequest(
      'GET',
      `/api/v2/nft/collectionList?address=${address}&limit=${limit}&offset=${offset}&collectionIdentifier=${contractName}&network=${network}`,
      {},
      {},
      WEB_NEXT_URL
    );
    return data;
  };

  /**
   * The entire list of nft collections
   * @returns The entire list of nft collections
   * @deprecated Use getNFTV2CollectionList instead
   */
  nftCollectionList = async () => {
    const { data } = await this.sendRequest('GET', '/api/nft/collections', {}, {}, WEB_NEXT_URL);
    return data;
  };

  evmFTList = async () => {
    const { data } = await this.sendRequest('GET', '/api/evm/fts', {}, {}, WEB_NEXT_URL);
    return data;
  };

  /** @deprecated
   * Use getUserTokens has price information. It returns evm tokens with price information.
   */
  getEvmFT = async (address: string, network: string) => {
    const { data } = await this.sendRequest(
      'GET',
      `/api/v3/evm/${address}/fts?network=${network}`,
      {},
      {},
      WEB_NEXT_URL
    );
    return data;
  };

  getEvmNFT = async (address: string, network: string) => {
    const { data } = await this.sendRequest(
      'GET',
      `/api/evm/${address}/nfts?network=${network}`,
      {},
      {},
      WEB_NEXT_URL
    );
    return data;
  };

  decodeEvmCall = async (data: string, address = '') => {
    const bodyData = {
      to: address, // address -- optional
      data: data, // calldata -- required
    };
    const res = await this.sendRequest('POST', `/api/evm/decodeData`, {}, bodyData, WEB_NEXT_URL);
    return res;
  };

  EvmNFTcollectionList = async (
    address: string,
    collectionIdentifier: string,
    limit = 24,
    offset = 0
  ) => {
    const network = await userWalletService.getNetwork();
    const { data } = await this.sendRequest(
      'GET',
      `/api/v3/evm/nft/collectionList?network=${network}&address=${address}&collectionIdentifier=${collectionIdentifier}&limit=${limit}&offset=${offset}`,
      {},
      {},
      WEB_NEXT_URL
    );
    return data;
  };

  EvmNFTID = async (network: string, address: string) => {
    const { data } = await this.sendRequest(
      'GET',
      `/api/v3/evm/nft/id?network=${network}&address=${address}`,
      {},
      {},
      WEB_NEXT_URL
    );
    return data;
  };

  EvmNFTList = async (address: string, limit = 24, offset = 0) => {
    const network = await userWalletService.getNetwork();
    const { data } = await this.sendRequest(
      'GET',
      `/api/v3/evm/nft/list?network=${network}&address=${address}&limit=${limit}&offset=${offset}`,
      {},
      {},
      WEB_NEXT_URL
    );
    return data;
  };

  getNFTCadenceList = async (address: string, network = 'mainnet', offset = 0, limit = 5) => {
    const { data } = await this.sendRequest(
      'GET',
      `/api/v2/nft/id?network=${network}&address=${address}`,
      {},
      {},
      WEB_NEXT_URL
    );
    return data;
  };

  getNFTV2CollectionList = async (network = 'mainnet'): Promise<NftCollection[]> => {
    const { data } = await this.sendRequest(
      'GET',
      `/api/v2/nft/collections?network=${network}`,
      {},
      {},
      WEB_NEXT_URL
    );
    return data;
  };

  putDeviceInfo = async (walletData: PublicKeyAccount[]) => {
    try {
      const installationId = await this.getInstallationId();

      await this.addDevice({
        wallet_id: '',
        wallettest_id: '',
        device_info: {
          device_id: installationId,
          district: '',
          name: 'FRW Chrome Extension',
          type: '2',
          user_agent: 'Chrome',
        },
      });
    } catch (error) {
      consoleError('Error while adding device:', error);
      return;
    }
  };

  getNews = async (): Promise<NewsItem[]> => {
    // Get news from firebase function
    const data = await this.sendRequest(
      'GET',
      process.env.API_NEWS_PATH,
      {},
      {},
      process.env.API_BASE_URL
    );

    const news = data.map(
      (dataFromApi: {
        id: string;
        priority: string;
        type: string;
        title: string;
        body?: string;
        icon?: string;
        image?: string;
        url?: string;
        expiry_time: string;
        display_type: string;
        conditions?: string[]; // Add conditions field
      }) => {
        const newsItem = {
          ...dataFromApi,
          expiryTime: new Date(dataFromApi.expiry_time),
          displayType: dataFromApi.display_type,
          conditions: dataFromApi.conditions as NewsConditionType[], // Map conditions
        };
        return newsItem;
      }
    );

    return news;
  };

  freshUserInfo = async (
    mainAddress: FlowAddress,
    keys: FclAccount,
    pubKTuple,
    wallet,
    isChild: ActiveAccountType
  ) => {
    const loggedInAccounts: LoggedInAccount[] = (await storage.get('loggedInAccounts')) || [];

    if (!isChild) {
      await storage.set('keyIndex', '');
      await storage.set('hashAlgoString', '');
      await storage.set('signAlgoString', '');
      await storage.set('pubKey', '');

      const { P256, SECP256K1 } = pubKTuple;

      const keyInfoA = findKeyAndInfo(keys, P256.pubK);
      const keyInfoB = findKeyAndInfo(keys, SECP256K1.pubK);
      const keyInfo = keyInfoA ||
        keyInfoB || {
          index: 0,
          signAlgoString: keys.keys[0].signAlgoString,
          hashAlgoString: keys.keys[0].hashAlgoString,
          publicKey: keys.keys[0].publicKey,
        };
      await storage.set('keyIndex', keyInfo.index);
      await storage.set('signAlgoString', keyInfo.signAlgoString);
      await storage.set('hashAlgoString', keyInfo.hashAlgoString);
      await storage.set('pubKey', keyInfo.publicKey);
      // Make sure the address is a FlowAddress

      if (!isValidFlowAddress(mainAddress)) {
        throw new Error('Invalid Flow address');
      }
      const flowAddress: FlowAddress = mainAddress;
      const updatedWallet: LoggedInAccount = {
        ...wallet,
        address: flowAddress,
        pubKey: keyInfo.publicKey,
        hashAlgoString: keyInfo.hashAlgoString,
        signAlgoString: keyInfo.signAlgoString,
        weight: keys.keys[0].weight,
      };

      const accountIndex = loggedInAccounts.findIndex(
        // Check both pubKey and username. Older versions allowed the pubKey to be imported twice with different usernames
        (account) =>
          account.pubKey === updatedWallet.pubKey && account.username === updatedWallet.username
      );

      if (accountIndex === -1) {
        loggedInAccounts.push(updatedWallet);
      } else {
        loggedInAccounts[accountIndex] = updatedWallet;
      }
      await storage.set('loggedInAccounts', loggedInAccounts);
    }

    const otherAccounts: LoggedInAccountWithIndex[] = loggedInAccounts
      .filter((account) => account.username !== wallet.username)
      .map((account) => {
        const indexInLoggedInAccounts = loggedInAccounts.findIndex(
          (loggedInAccount) => loggedInAccount.username === account.username
        );
        return { ...account, indexInLoggedInAccounts };
      })
      .slice(0, 2);

    return { otherAccounts, wallet, loggedInAccounts };
  };

  // ** Get supported currencies **
  getSupportedCurrencies = async (): Promise<Currency[]> => {
    let currencies = [DEFAULT_CURRENCY];
    try {
      const supportedCurrencies: CurrencyResponse = await this.sendRequest(
        'GET',
        `/api/v4/currencies`,
        {},
        {},
        WEB_NEXT_URL
      );

      currencies = supportedCurrencies?.data?.currencies || [DEFAULT_CURRENCY];
    } catch (error) {
      consoleError('Error fetching supported currencies, using default USD:', error);
    }
    return currencies;
  };

  getAccountsWithPublicKey = async (
    publicKey: string,
    network: string
  ): Promise<PublicKeyAccount[]> => {
    const url =
      network === 'testnet'
        ? `https://staging.key-indexer.flow.com/key/${publicKey}`
        : `https://production.key-indexer.flow.com/key/${publicKey}`;
    const result = await fetch(url);
    const json: {
      publicKey: string;
      accounts: {
        address: string;
        keyId: number;
        weight: number;
        sigAlgo: number;
        hashAlgo: number;
        isRevoked: boolean;
        signing: string;
        hashing: string;
      }[];
    } = await result.json();

    // Now massage the data to match the type we want
    const accounts: PublicKeyAccount[] = json.accounts
      .filter((account) => !account.isRevoked && account.weight >= 1000)
      .map((account) => ({
        address: account.address,
        publicKey: json.publicKey,
        keyIndex: account.keyId,
        weight: account.weight,
        signAlgo: account.sigAlgo,
        signAlgoString: account.signing,
        hashAlgo: account.hashAlgo,
        hashAlgoString: account.hashing,
      }));

    return accounts;
  };

  async fetchCadenceTokenInfo(
    network: string,
    address: string,
    currencyCode: string = 'USD'
  ): Promise<CadenceTokenInfo[]> {
    const response: CadenceTokensApiResponseV4 = await this.sendRequest(
      'GET',
      `/api/v4/cadence/tokens/ft/${address}`,
      { network, currency: currencyCode },
      {},
      WEB_NEXT_URL
    );
    if (!response?.data?.result || !response?.data?.storage) {
      throw new Error('Could not fetch token info');
    }

    // TODO: TB remove this after the API is updated
    const storageInfo: StorageResponse = response?.data?.storage;
    const cadenceTokenInfo: CadenceTokenInfo[] = response?.data?.result.map((token) => {
      if (token.symbol.toUpperCase() === 'FLOW') {
        return {
          ...token,
          balance: storageInfo.availableBalanceToUse,
          displayBalance: storageInfo.availableBalanceToUse,
          balanceInFLOW: storageInfo.availableBalanceToUse,
          balanceInUSD: BigNumber(storageInfo.availableBalanceToUse)
            .multipliedBy(BigNumber(token.priceInUSD))
            .toString(),
          balanceInCurrency: BigNumber(storageInfo.availableBalanceToUse)
            .multipliedBy(BigNumber(token.priceInCurrency))
            .toString(),
        };
      }
      return token;
    });
    return cadenceTokenInfo;
  }

  async fetchEvmTokenInfo(
    network: string,
    address: string,
    currencyCode: string = 'USD'
  ): Promise<EvmTokenInfo[]> {
    const formattedEvmAddress = address.startsWith('0x') ? address : `0x${address}`;

    const userEvmTokenList: EvmTokensApiResponseV4 = await this.sendRequest(
      'GET',
      `/api/v4/evm/tokens/ft/${formattedEvmAddress}`,
      { network, currency: currencyCode },
      {},
      WEB_NEXT_URL
    );
    if (!userEvmTokenList?.data) {
      throw new Error('No token info found');
    }
    return userEvmTokenList?.data;
  }
}

const openApiService = new OpenApiService();

if (process.env.NODE_ENV === 'development') {
  // Log all functions and their signatures
  const functions = Object.entries(openApiService)
    .filter(
      ([name, value]) =>
        typeof value === 'function' &&
        name !== 'constructor' &&
        typeof name === 'string' &&
        name !== 'get'
    )
    .map(([name]) => {
      const func = openApiService[name];
      // Use a safer way to get function info
      const funcStr = func.toString();
      const isAsync = funcStr.startsWith('async');
      const basicSignature = funcStr.split('{')[0].trim();

      return {
        name,
        isAsync,
        fullBody: funcStr,
        usesSendRequest: funcStr.includes('this.sendRequest'),
        usesFetchDirectly: funcStr.includes('fetch('),
        basicSignature,
        // Simple regex to extract parameter names without accessing arguments
        params: basicSignature
          .slice(basicSignature.indexOf('(') + 1, basicSignature.lastIndexOf(')'))
          .split(',')
          .map((param) => param.trim())
          .map((param) => {
            if (param.startsWith('PriceProvider.')) {
              return param.replace('PriceProvider.', '');
            }
            return param;
          })
          .filter(Boolean),
      };
    });

  consoleLog('OpenApiService Functions:', functions);
}

export const getScripts = async (network: string, category: string, scriptName: string) => {
  try {
    // Force a proper load of the cadence scripts
    const cadenceScripts = await openApiService.getCadenceScripts();
    if (!cadenceScripts) {
      throw new Error('Cadence scripts not loaded');
    }
    const networkScripts =
      network === 'mainnet' ? cadenceScripts.scripts.mainnet : cadenceScripts.scripts.testnet;
    if (!networkScripts) {
      throw new Error('Network scripts not found');
    }
    const categoryScripts = networkScripts[category];
    if (!categoryScripts) {
      throw new Error('Category scripts not found');
    }
    const script = categoryScripts[scriptName];
    if (!script) {
      throw new Error('Script not found');
    }
    const scriptString = Buffer.from(script, 'base64').toString('utf-8');
    const modifiedScriptString = scriptString.replaceAll('<platform_info>', `Extension-${version}`);
    return modifiedScriptString;
  } catch (error) {
    if (error instanceof Error) {
      mixpanelTrack.track('script_error', {
        script_id: scriptName,
        error: error.message,
      });
    }
    throw error;
  }
};

export default openApiService;
