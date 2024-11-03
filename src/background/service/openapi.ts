import { Method } from 'axios';
import { createPersistStore, getScripts } from 'background/utils';
import { getPeriodFrequency } from '../../utils';
import { INITIAL_OPENAPI_URL, WEB_NEXT_URL } from 'consts';
import dayjs from 'dayjs';
import {
  TokenListProvider,
  Strategy,
  ENV,
  TokenInfo,
} from 'flow-native-token-registry';
import log from 'loglevel';
import {
  getAuth,
  signInWithCustomToken,
  setPersistence,
  indexedDBLocalPersistence,
  signInAnonymously,
  onAuthStateChanged,
  updateProfile,
} from '@firebase/auth';
import { initializeApp, getApp } from 'firebase/app';
import { getInstallations, getId } from 'firebase/installations';
import { Unsubscribe } from '@firebase/util';
import {
  AccountKey,
  CheckResponse,
  SignInResponse,
  UserInfoResponse,
  FlowTransaction,
  SendTransactionResponse,
  Period,
  PriceProvider,
  TokenModel,
  NFTModel,
  StorageInfo,
  DeviceInfo,
} from './networkModel';
import fetchConfig from 'background/utils/remoteConfig';
// import { getRemoteConfig, fetchAndActivate, getValue } from 'firebase/remote-config';
// import configJson from 'background/utils/firebase.config.json';
import {
  getFirbaseConfig,
  getFirbaseFunctionUrl,
} from 'background/utils/firebaseConfig';
import { findKeyAndInfo } from 'background/utils';
import {
  userWalletService,
  coinListService,
  addressBookService,
  userInfoService,
  transactionService,
  nftService,
  googleSafeHostService,
} from './index';
import * as fcl from '@onflow/fcl';
import { storage } from '@/background/webapi';
// import { userInfo } from 'os';
import {
  fclMainnetConfig,
  fclTestnetConfig,
} from '../fclConfig';

import { walletController } from '../controller';
// import userWallet from './userWallet';
// const axios = axiosOriginal.create({ adapter })

export interface OpenApiConfigValue {
  path: string;
  method: Method;
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
const pricesMap = {};

const waitForAuthInit = async () => {
  let unsubscribe: Promise<Unsubscribe>;
  await new Promise<void>((resolve) => {
    // @ts-expect-error firebase auth function
    unsubscribe = auth.onAuthStateChanged((user) => resolve());
  });
  (await unsubscribe!)();
};

onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in, see docs for a list of available properties
    // https://firebase.google.com/docs/reference/js/firebase.User
    // const uid = user.uid;
    console.log('User is signed in');
    if (user.isAnonymous) {
      console.log('User is anonymous');
    }
  } else {
    // User is signed out
    console.log('User is signed out');
  }

  fclSetup();
});

const fclSetup = async () => {
  const network = await userWalletService.getNetwork();
  switch (network) {
    case 'mainnet':
      await fclMainnetConfig();
      break;
    case 'testnet':
      await fclTestnetConfig();
      break;
  }
};

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
  create_flow_sandbox_address: {
    path: '/v1/user/address/crescendo',
    method: 'post',
    params: [],
  },
  create_flow_network_address: {
    path: '/v1/user/address/network',
    method: 'post',
    params: ['account_key', 'network'],
  },
  login: {
    path: '/v1/login',
    method: 'post',
    params: ['public_key', 'signature'],
  },
  loginv2: {
    path: '/v2/login',
    method: 'post',
    params: ['public_key', 'signature'],
  },
  loginv3: {
    path: '/v3/login',
    method: 'post',
    params: ['signature', 'account_key', 'device_info'],
  },
  importKey: {
    path: '/v3/import',
    method: 'post',
    params: [
      'username',
      'account_key',
      'device_info',
      'backup_info',
      'address',
    ],
  },
  coin_map: {
    path: '/v1/coin/map',
    method: 'get',
    params: [],
  },
  user_wallet: {
    path: '/v1/user/wallet',
    method: 'get',
    params: [],
  },
  user_wallet_v2: {
    path: '/v2/user/wallet',
    method: 'get',
    params: [],
  },
  user_info: {
    path: '/v1/user/info',
    method: 'get',
    params: [],
  },
  prepare_transaction: {
    path: '/v1/account/presign',
    method: 'post',
    params: ['transaction'],
  },
  sign_payer: {
    path: '/v1/account/signpayer',
    method: 'post',
    params: ['transaction', 'message'],
  },
  send_transaction: {
    path: '/v1/account/transaction',
    method: 'post',
    params: ['transaction'],
  },
  coin_list: {
    path: '/v1/account/info',
    method: 'get',
    params: ['address'],
  },
  coin_rate: {
    path: '/v1/coin/rate',
    method: 'get',
    params: ['coinId'],
  },
  nft_list_v2: {
    path: '/v2/nft/list',
    method: 'get',
    params: ['address', 'offset', 'limit'],
  },
  nft_list_lilico_v2: {
    path: '/v2/nft/detail/list',
    method: 'get',
    params: ['address', 'offset', 'limit'],
  },
  nft_collections_lilico_v2: {
    path: '/v2/nft/collections',
    method: 'get',
    params: ['address'],
  },
  nft_collections_single_v2: {
    path: '/v2/nft/single',
    method: 'get',
    params: ['address', 'contractName', 'limit', 'offset'],
  },
  nft_meta: {
    path: '/v2/nft/meta',
    method: 'get',
    params: ['address', 'contractName', 'contractAddress', 'tokenId'],
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
  flowns_prepare: {
    path: '/v1/flowns/prepare',
    method: 'get',
    params: [],
  },
  flowns_signature: {
    path: '/v1/flowns/signature',
    method: 'post',
    params: ['transaction', 'message'],
  },
  payer_signature: {
    path: '/v1/flowns/payer/signature',
    method: 'post',
    params: ['transaction', 'message'],
  },
  get_transfers: {
    path: '/v1/account/transfers',
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
};

class OpenApiService {
  store!: OpenApiStore;

  // request = rateLimit(axios.create(), { maxRPS });

  setHost = async (host: string) => {
    this.store.host = host;
    await this.init();
  };

  getHost = () => {
    return this.store.host;
  };

  init = async () => {
    this.store = await createPersistStore({
      name: 'openapi',
      template: {
        host: INITIAL_OPENAPI_URL,
        config: dataConfig,
      },
      fromStorage: false, // Debug only
    });

    await fclSetup();
  };

  checkAuthStatus = async () => {
    await waitForAuthInit();
    const app = getApp(process.env.NODE_ENV!);
    const user = await getAuth(app).currentUser;
    if (user && user.isAnonymous) {
      userWalletService.reSign();
    }
  };

  sendRequest = async (
    method = 'GET',
    url = '',
    params = {},
    data = {},
    host = this.store.host
  ) => {
    // Default options are marked with *
    let requestUrl = '';

    if (Object.keys(params).length) {
      requestUrl = host + url + '?' + new URLSearchParams(params).toString();
    } else {
      requestUrl = host + url;
    }
    const network = await userWalletService.getNetwork();

    const app = getApp(process.env.NODE_ENV!);
    const user = await getAuth(app).currentUser;
    const init = {
      method,
      async: true,
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
    return response.json(); // parses JSON response into native JavaScript objects
  };

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

  getPriceProvider = (token: string): PriceProvider[] => {
    switch (token) {
      case 'usdc':
        return [
          PriceProvider.binance,
          PriceProvider.kakren,
          PriceProvider.huobi,
        ];
      case 'flow':
        return [
          PriceProvider.binance,
          PriceProvider.kakren,
          PriceProvider.coinbase,
          PriceProvider.kucoin,
          PriceProvider.huobi,
        ];
      default:
        return [];
    }
  };

  getUSDCPrice = async (
    provider = PriceProvider.binance
  ): Promise<CheckResponse> => {
    const config = this.store.config.crypto_map;
    const data = await this.sendRequest(config.method, config.path, {
      provider,
      pair: this.getUSDCPricePair(provider),
    });
    return data.data.result;
  };

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

  getTokenPrices = async () => {


    const tokenPriceMap = await storage.getExpiry('pricesMap');
    if (tokenPriceMap) {
      return tokenPriceMap;
    } else {
      let data: any = [];
      try {
        const response = await this.sendRequest(
          'GET',
          `/api/prices`,
          {},
          {},
          WEB_NEXT_URL
        );
        data = response.data || [];  // Ensure data is set to an empty array if response.data is undefined
      } catch (error) {
        console.error('Error fetching prices:', error);
        data = [];  // Set data to empty array in case of an error
      }

      if (pricesMap && pricesMap['FLOW']) {
        return pricesMap;
      }
      data.map((d) => {
        const { rateToUSD, contractName, contractAddress } = d;
        const key = contractName.toLowerCase() + '' + contractAddress.toLowerCase();
        pricesMap[key] = rateToUSD.toFixed(8);
      });
      await storage.setExpiry('pricesMap', pricesMap, 300000); // 5 minutes in milliseconds
      return pricesMap;
    }

  };

  getTokenEvmPrices = async () => {


    const tokenPriceMap = await storage.getExpiry('evmPrice');
    if (tokenPriceMap) {
      return tokenPriceMap;
    } else {
      let data: any = [];
      try {
        const response = await this.sendRequest(
          'GET',
          `/api/prices`,
          {},
          {},
          WEB_NEXT_URL
        );
        data = response.data || [];  // Ensure data is set to an empty array if response.data is undefined
      } catch (error) {
        console.error('Error fetching prices:', error);
        data = [];  // Set data to empty array in case of an error
      }

      data.map((d) => {
        if (d.evmAddress) {
          const { rateToUSD, evmAddress } = d;
          const key = evmAddress.toLowerCase();
          pricesMap[key] = rateToUSD.toFixed(5);

        } else {
          const { rateToUSD, symbol } = d;
          const key = symbol.toUpperCase();
          pricesMap[key] = rateToUSD.toFixed(5);

        }
      });
      await storage.setExpiry('evmPrice', pricesMap, 300000); // 5 minutes in milliseconds
      return pricesMap;
    }

  };

  getPricesBySymbol = async (symbol: string, data) => {
    const key = symbol.toUpperCase();
    return data[key];
  };

  getPricesByAddress = async (symbol: string, data) => {
    const key = symbol.toLowerCase();
    return data[key];
  };


  getPricesByKey = async (symbol: string, data) => {
    const key = symbol.toLowerCase();
    return data[key];
  };

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

  getTokenPrice = async (token: string, provider = PriceProvider.binance) => {
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

  getTokenPriceHistory = async (
    token: string,
    period = Period.oneDay,
    provider = PriceProvider.binance
  ): Promise<CheckResponse> => {
    let after = dayjs();
    const periods = getPeriodFrequency(period);

    const providers = this.getPriceProvider(token);
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
      pair: this.getTokenPair(token, provider),
      after: period === Period.all ? '' : after.unix(),
      periods,
    });
    return data.data.result;
  };

  private _signWithCustom = async (token) => {
    this.clearAllStorage();
    await setPersistence(auth, indexedDBLocalPersistence);
    await signInWithCustomToken(auth, token);
  };

  private clearAllStorage = () => {
    nftService.clear();
    userInfoService.removeUserInfo();
    coinListService.clear();
    addressBookService.clear();
    userWalletService.clear();
    transactionService.clear();
  };

  checkUsername = async (username: string) => {
    const config = this.store.config.check_username;
    const data = await this.sendRequest(config.method, config.path, {
      username,
    });
    return data;
  };

  register = async (account_key: AccountKey, username: string) => {
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
    await this._signWithCustom(data.data.custom_token);
    await storage.set('currentId', data.data.id);
    return data;
  };

  login = async (
    public_key: string,
    signature: string,
    replaceUser = true
  ): Promise<SignInResponse> => {
    const config = this.store.config.login;
    // const result = await this.request[config.method](config.path, {
    //   public_key,
    //   signature,
    // });
    const result = await this.sendRequest(
      config.method,
      config.path,
      {},
      { public_key, signature }
    );
    if (!result.data) {
      throw new Error('NoUserFound');
    }
    if (replaceUser) {
      await this._signWithCustom(result.data.custom_token);
      await storage.set('currentId', result.data.id);
    }
    return result;
  };

  loginV2 = async (
    public_key: string,
    signature: string,
    replaceUser = true
  ): Promise<SignInResponse> => {
    const config = this.store.config.loginv2;
    const result = await this.sendRequest(
      config.method,
      config.path,
      {},
      { public_key, signature }
    );
    if (!result.data) {
      throw new Error('NoUserFound');
    }
    if (replaceUser) {
      await this._signWithCustom(result.data.custom_token);
      await storage.set('currentId', result.data.id);
    }
    return result;
  };

  loginV3 = async (
    account_key: any,
    device_info: any,
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
      throw new Error('NoUserFound');
    }
    if (replaceUser) {
      await this._signWithCustom(result.data.custom_token);
      await storage.set('currentId', result.data.id);
    }
    return result;
  };

  proxyKey = async (
    token: any,
    userId: any,
  ) => {
    if (token) {
      await this._signWithCustom(token);
      await storage.set('currentId', userId);
    }
    return;
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
  }

  importKey = async (
    account_key: any,
    device_info: any,
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
      await this._signWithCustom(result.data.custom_token);
      await storage.set('currentId', result.data.id);
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
    return await this.sendRequest(config.method, config.path);
  };

  userWallet = async () => {
    const config = this.store.config.user_wallet;
    const data = await this.sendRequest(config.method, config.path);
    return data;
  };

  //todo check data
  userWalletV2 = async () => {
    const config = this.store.config.user_wallet_v2;
    const data = await this.sendRequest(config.method, config.path);
    return data;
  };

  createFlowAddress = async () => {
    const config = this.store.config.create_flow_address;
    const data = await this.sendRequest(config.method, config.path);
    return data;
  };

  createFlowSandboxAddress = async () => {
    const config = this.store.config.create_flow_sandbox_address;
    const data = await this.sendRequest(config.method, config.path);
    return data;
  };

  createFlowNetworkAddress = async (
    account_key: AccountKey,
    network: string
  ) => {
    const config = this.store.config.create_flow_network_address;
    const data = await this.sendRequest(
      config.method,
      config.path,
      {},
      {
        account_key,
        network,
      }
    );
    return data;
  };

  getMoonpayURL = async (url) => {
    const baseURL = getFirbaseFunctionUrl();
    const response = await this.sendRequest(
      'POST',
      '/moonPaySignature',
      {},
      { url: url },
      baseURL
    );
    return response;
  };

  prepareTransaction = async (transaction: FlowTransaction) => {
    const config = this.store.config.prepare_transaction;
    const data = await this.sendRequest(
      config.method,
      config.path,
      {},
      { transaction }
    );
    return data;
  };

  signPayer = async (transaction, message: string) => {
    const messages = {
      envelope_message: message,
    };
    const config = this.store.config.sign_payer;
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

  signProposer = async (transaction, message: string) => {
    const messages = {
      envelope_message: message,
    };
    const config = this.store.config.sign_payer;
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

    const config = this.store.config.sign_payer;
    const baseURL = getFirbaseFunctionUrl();
    // 'http://localhost:5001/lilico-dev/us-central1'
    const data = await this.sendRequest(
      'GET',
      '/getProposer',
      {},
      {},
      baseURL
    );
    // (config.method, config.path, {}, { transaction, message: messages });
    return data;
  };

  sendTransaction = async (transaction): Promise<SendTransactionResponse> => {
    const config = this.store.config.send_transaction;
    const data = await this.sendRequest(
      config.method,
      config.path,
      {},
      {
        transaction,
      }
    );
    return data;
  };

  getCoinList = async (address) => {
    const config = this.store.config.coin_list;
    const data = await this.sendRequest(config.method, config.path, {
      address,
    });
    return data;
  };

  getCoinRate = async (coinId) => {
    const config = this.store.config.coin_rate;
    const data = await this.sendRequest(config.method, config.path, { coinId });
    return data;
  };

  getNFTList = async (address: string, offset: number, limit: number) => {
    const config = this.store.config.nft_list;
    const data = await this.sendRequest(config.method, config.path, {
      address,
      offset,
      limit,
    });
    return data;
  };

  // getNFTListV2 = async (address: string, offset: number, limit: number) => {
  //   const alchemyAPI = (await storage.get('alchemyAPI')) || false;
  //   const config = alchemyAPI
  //     ? this.store.config.nft_list_v2
  //     : this.store.config.nft_list_lilico_v2;
  //   const data = await this.sendRequest(config.method, config.path, {
  //     address,
  //     offset,
  //     limit,
  //   });
  //   return data;
  // };

  // getNFTCollectionV2 = async (address: string) => {
  //   // const alchemyAPI = await storage.get('alchemyAPI') || false
  //   const config = this.store.config.nft_collections_lilico_v2;
  //   const data = await this.sendRequest(config.method, config.path, {
  //     address,
  //   });
  //   return data;
  // };


  getNFTMetadata = async (
    address: string,
    contractName: string,
    contractAddress: string,
    tokenId: number
  ) => {
    const config = this.store.config.nft_meta;
    const data = await this.sendRequest(config.method, config.path, {
      address,
      contractName,
      contractAddress,
      tokenId,
    });

    return data;
  };

  getAddressBook = async () => {
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
    const data = await this.sendRequest(config.method, config.path, { id });
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

  getLastBlock = async () => {
    try {
      const account = await fcl.latestBlock(true);
      return account;
    } catch (error) {
      return null;
    }
  };

  checkChildAccount = async (address: string) => {
    const script = await getScripts('hybridCustody', 'checkChildAccount');
    const result = await fcl.query({
      cadence: script,
      args: (arg, t) => [arg(address, t.Address)],
    });
    return result;
  };

  queryAccessible = async (address: string, childAccount: string) => {
    const script = await getScripts('hybridCustody', 'checkChildAccount');

    const result = await fcl.query({
      cadence: script,
      args: (arg, t) => [arg(address, t.Address), arg(childAccount, t.Address)],
    });
    return result;
  };

  queryAccessibleFt = async (address: string, childAccount: string) => {
    const script = await getScripts('hybridCustody', 'getAccessibleCoinInfo');

    const result = await fcl.query({
      cadence: script,
      args: (arg, t) => [arg(address, t.Address), arg(childAccount, t.Address)],
    });
    return result;
  };

  checkChildAccountMeta = async (address: string) => {
    const script = await getScripts('hybridCustody', 'getChildAccountMeta');
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

  checkChildAccountNFT = async (address: string) => {
    const script = await getScripts('hybridCustody', 'getAccessibleChildAccountNFTs');

    const result = await fcl.query({
      cadence: script,
      args: (arg, t) => [arg(address, t.Address)],
    });
    console.log(result, 'check child nft info result----=====')
    return result;
  };

  getFlownsInbox = async (domain: string, root = 'meow') => {
    const script = await getScripts('domain', 'getFlownsInbox');

    const detail = await fcl.query({
      cadence: script,
      args: (arg, t) => [arg(domain, t.String), arg(root, t.String)],
    });
    return detail;
  };

  getFlownsAddress = async (domain: string, root = 'fn') => {
    const script = await getScripts('basic', 'getFlownsAddress');

    const address = await fcl.query({
      cadence: script,
      args: (arg, t) => [arg(domain, t.String), arg(root, t.String)],
    });
    return address;
  };


  getAccountMinFlow = async (address: string) => {
    const script = await getScripts('basic', 'getAccountMinFlow');

    const minFlow = await fcl.query({
      cadence: script,
      args: (arg, t) => [arg(address, t.Address)],
    });
    return minFlow;
  };



  getFlownsDomainsByAddress = async (address: string) => {
    const script = await getScripts('basic', 'getFlownsDomainsByAddress');

    const domains = await fcl.query({
      cadence: script,
      args: (arg, t) => [arg(address, t.Address)],
    });
    return domains;
  };

  getFindAddress = async (domain: string) => {
    const script = await getScripts('basic', 'getFindAddress');

    const address = await fcl.query({
      cadence: script,
      args: (arg, t) => [arg(domain, t.String)],
    });
    return address;
  };

  getFindDomainByAddress = async (domain: string) => {
    const script = await getScripts('basic', 'getFindDomainByAddress');

    const address = await fcl.query({
      cadence: script,
      args: (arg, t) => [arg(domain, t.Address)],
    });
    return address;
  };

  // getTransaction = async (address: string, limit: number, offset: number) => {
  //   const config = this.store.config.account_transaction;
  //   const data = await this.sendRequest(config.method, config.path, {
  //     address,
  //     limit,
  //     offset,
  //   });

  //   return data;
  // };

  getTransfers = async (address: string, after = '', limit: number) => {
    const config = this.store.config.get_transfers;
    const data = await this.sendRequest(config.method, config.path, {
      address,
      after,
      limit,
    });

    return data;
  };



  getEVMTransfers = async (address: string, after = '', limit: number) => {
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

  deviceList = async () => {
    const config = this.store.config.device_list;
    const data = await this.sendRequest(config.method, config.path, {});

    return data;
  };

  keyList = async () => {
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

  searchUser = async (keyword: string) => {
    const config = this.store.config.search_user;
    const data = await this.sendRequest(config.method, config.path, {
      keyword,
    });

    return data;
  };

  checkImport = async (key: string) => {
    const config = this.store.config.check_import;
    const data = await this.sendRequest(config.method, config.path, {
      key,
    });

    return data;
  };

  getTokenInfo = async (name: string, network = ''): Promise<TokenInfo | undefined> => {
    // FIX ME: Get defaultTokenList from firebase remote config
    if (!network) {
      network = await userWalletService.getNetwork();
    }
    const tokens = await this.getTokenListFromGithub(network);
    // const coins = await remoteFetch.flowCoins();
    return tokens.find(
      (item) => item.symbol.toLowerCase() == name.toLowerCase()
    );
  };

  getEvmTokenInfo = async (name: string, network = ''): Promise<TokenInfo | undefined> => {
    // FIX ME: Get defaultTokenList from firebase remote config
    if (!network) {
      network = await userWalletService.getNetwork();
    }
    const tokens = await this.getEvmListFromGithub(network);
    // const coins = await remoteFetch.flowCoins();
    return tokens.find(
      (item) => item.symbol.toLowerCase() == name.toLowerCase()
    );
  };

  getTokenInfoByContract = async (
    contractName: string
  ): Promise<TokenModel | undefined> => {
    // FIX ME: Get defaultTokenList from firebase remote config
    const coins = await remoteFetch.flowCoins();
    return coins.find(
      (item) => item.contract_name.toLowerCase() == contractName.toLowerCase()
    );
  };

  getAllToken = async () => {
    // FIX ME: Get defaultTokenList from firebase remote config
    const coins = await remoteFetch.flowCoins();
    return coins;
  };

  getNFTCollectionInfo = async (
    contract_name: string
  ): Promise<NFTModel | undefined> => {
    // FIX ME: Get defaultTokenList from firebase remote config
    const tokenList = await remoteFetch.nftCollection();

    // const network = await userWalletService.getNetwork();
    return tokenList.find((item) => item.id === contract_name);
  };

  getSwapInfo = async (): Promise<boolean> => {
    remoteFetch
      .remoteConfig()
      .then((res) => {
        return res.features.swap;
      })
      .catch((err) => {
        console.log('getNFTCollectionInfo -->', err);
      });
    return false;
  };

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  getAllTokenInfo = async (fiterNetwork = true): Promise<TokenInfo[]> => {
    const network = await userWalletService.getNetwork();
    const list = await this.getTokenListFromGithub(network);
    return fiterNetwork ? list.filter((item) => item.address) : list;
  };

  getAllNft = async (fiterNetwork = true): Promise<NFTModel[]> => {
    const list = await remoteFetch.nftCollection();
    // const network = await userWalletService.getNetwork();
    return list;
  };

  getAllNftV2 = async (fiterNetwork = true): Promise<NFTModel[]> => {
    const list = await remoteFetch.nftv2Collection();
    // const network = await userWalletService.getNetwork();
    return list;
  };

  isWalletTokenStorageEnabled = async (tokenSymbol: string) => {
    // FIX ME: Get defaultTokenList from firebase remote config
    const address = await userWalletService.getCurrentAddress();
    const tokenInfo = await this.getTokenInfo(tokenSymbol);
    if (!tokenInfo) {
      return;
    }
    return await this.isTokenStorageEnabled(address, tokenInfo);
  };

  getWalletTokenBalance = async (tokenSymbol: string) => {
    // FIX ME: Get defaultTokenList from firebase remote config
    const address = await userWalletService.getCurrentAddress();
    const tokenInfo = await this.getTokenInfo(tokenSymbol);
    if (!tokenInfo) {
      return;
    }
    return await this.getTokenBalanceWithModel(address, tokenInfo);
  };

  getTokenBalance = async (address: string, tokenSymbol: string) => {
    // FIX ME: Get defaultTokenList from firebase remote config
    const tokenInfo = await this.getTokenInfo(tokenSymbol);
    if (!tokenInfo) {
      return;
    }
    return await this.getTokenBalanceWithModel(address, tokenInfo);
  };

  getStorageInfo = async (address: string): Promise<StorageInfo> => {
    const script = await getScripts('basic', 'getStorageInfo');

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

  getTokenBalanceWithModel = async (address: string, token: TokenInfo) => {
    const script = await getScripts('basic', 'getTokenBalanceWithModel');
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

  getTokenListFromGithub = async (network: string) => {
    const childType = await userWalletService.getActiveWallet();
    let chainType = 'flow'
    if (childType === 'evm') {
      chainType = 'evm';
    }
    const gitToken = await storage.getExpiry(`GitTokenList${network}${chainType}`);
    // const gitToken = null
    if (gitToken) {
      return gitToken;
    } else {
      let response
      if (process.env.NODE_ENV === 'production') {
        response = await fetch(
          `https://raw.githubusercontent.com/Outblock/token-list-jsons/outblock/jsons/${network}/${chainType}/default.json`
        );
      } else if (process.env.NODE_ENV !== 'production' && childType !== 'evm' && (network === 'testnet' || network === 'mainnet')) {
        response = await fetch(
          `https://raw.githubusercontent.com/Outblock/token-list-jsons/outblock/jsons/${network}/${chainType}/dev.json`
        );
      } else if (process.env.NODE_ENV !== 'production' && childType === 'evm') {
        response = await fetch(
          `https://raw.githubusercontent.com/Outblock/token-list-jsons/outblock/jsons/${network}/${chainType}/default.json`
        );
      } else {
        response = await fetch(
          `https://raw.githubusercontent.com/Outblock/token-list-jsons/outblock/jsons/${network}/${chainType}/default.json`
        );
      }
      const res = await response.json();
      const { tokens = {} } = res;
      const hasFlowToken = tokens.some(token => token.symbol.toLowerCase() === 'flow');
      if (!hasFlowToken) {
        tokens.push({
          name: 'Flow',
          address: '0x4445e7ad11568276',
          contractName: 'FlowToken',
          path: {
            balance: '/public/flowTokenBalance',
            receiver: '/public/flowTokenReceiver',
            vault: '/storage/flowTokenVault',
          },
          logoURI:
            'https://cdn.jsdelivr.net/gh/FlowFans/flow-token-list@main/token-registry/A.1654653399040a61.FlowToken/logo.svg',
          decimals: 8,
          symbol: 'flow',
        })
      }
      storage.setExpiry(`GitTokenList${network}${chainType}`, tokens, 600000);
      return tokens;
    }
  };

  getEvmListFromGithub = async (network: string) => {
    const chainType = 'evm'

    const gitToken = await storage.getExpiry(`GitTokenList${network}${chainType}`);
    // const gitToken = null
    if (gitToken) {
      return gitToken;
    } else {
      const response = await fetch(
        `https://raw.githubusercontent.com/Outblock/token-list-jsons/outblock/jsons/${network}/${chainType}/default.json`
      );
      const res = await response.json();
      const { tokens = {} } = res;
      storage.setExpiry(`GitTokenList${network}${chainType}`, tokens, 600000);
      return tokens;
    }
  };

  getNFTListFromGithub = async (network: string) => {
    const childType = await userWalletService.getActiveWallet();
    let chainType = 'flow'
    if (childType === 'evm') {
      chainType = 'evm';
    }
    const gitToken = await storage.getExpiry(`GitNFTList${network}${chainType}`);
    if (gitToken && gitToken.length > 0) {
      return gitToken;
    } else {
      const response = await fetch(
        `https://raw.githubusercontent.com/Outblock/token-list-jsons/outblock/jsons/${network}/flow/nfts.json`
      );
      const res = await response.json();
      const { data = {} } = res;
      storage.setExpiry(`GitNFTList${network}${chainType}`, data, 600000);
      return data;
    }
  };

  getEnabledTokenList = async (network = '') => {
    // const tokenList = await remoteFetch.flowCoins();
    if (!network) {
      network = await userWalletService.getNetwork();
    }
    const address = await userWalletService.getCurrentAddress();

    const tokenList = await this.getTokenListFromGithub(network);
    let values;
    const isChild = await userWalletService.getActiveWallet();
    try {
      if (isChild && isChild !== 'evm') {
        values = await this.isLinkedAccountTokenListEnabled(address);
      } else if (!isChild) {
        values = await this.isTokenListEnabled(address);
      }
    } catch (error) {
      console.error(`Error isTokenListEnabled token:`);
      values = {}
    }

    const tokenItems: TokenInfo[] = [];
    const tokenMap = {};
    if (isChild !== 'evm') {
      tokenList.forEach((token) => {
        const tokenId = `A.${token.address.slice(2)}.${token.contractName}`;
        // console.log(tokenMap,'tokenMap',values)
        if (values[tokenId] == true) {
          tokenMap[token.name] = token;
        }
      });

    }

    // const data = values.map((value, index) => ({isEnabled: value, token: tokenList[index]}))
    // return values
    //   .map((value, index) => {
    //     if (value) {
    //       return tokens[index];
    //     }
    //   })
    //   .filter((item) => item);

    Object.keys(tokenMap).map((key, idx) => {
      const item = tokenMap[key];
      tokenItems.push(item);
    });
    return tokenItems;
  };

  // todo
  isTokenStorageEnabled = async (address: string, token: TokenInfo) => {
    const network = await userWalletService.getNetwork();
    const script = await getScripts('basic', 'isTokenStorageEnabled');

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
    const script = await getScripts('ft', 'isTokenListEnabled');
    const isEnabledList = await fcl.query({
      cadence: script,
      args: (arg, t) => [arg(address, t.Address)],
    });
    return isEnabledList;
  };


  isLinkedAccountTokenListEnabled = async (address: string) => {
    const script = await getScripts('ft', 'isLinkedAccountTokenListEnabled');
    const isEnabledList = await fcl.query({
      cadence: script,
      args: (arg, t) => [arg(address, t.Address)],
    });
    return isEnabledList;
  };

  getTokenListBalance = async (address: string, allTokens: TokenInfo[]) => {
    const network = await userWalletService.getNetwork();

    const tokens = allTokens.filter((token) => token.address);
    const script = await getScripts('ft', 'getTokenListBalance');
    const balanceList = await fcl.query({
      cadence: script,
      args: (arg, t) => [arg(address, t.Address)],
    });

    return balanceList;
  };

  getBlockList = async (
    hosts: string[] = [],
    forceCheck = false
  ): Promise<string[]> => {
    return await googleSafeHostService.getBlockList(hosts, forceCheck);
  };

  getEnabledNFTList = async () => {

    const address = await userWalletService.getCurrentAddress();


    const promiseResult = await this.checkNFTListEnabledNew(address);
    console.log(promiseResult, 'promiseResult');

    // const network = await userWalletService.getNetwork();
    // const notEmptyTokenList = tokenList.filter(value => value.address[network] !== null && value.address[network] !== '' )
    // const data = values.map((value, index) => ({isEnabled: value, token: tokenList[index]}))
    const resultArray = Object.entries(promiseResult)
      .filter(([_, value]) => value === true)  // Only keep entries with a value of true
      .map(([key, _]) => {
        const [prefix, address, contractName] = key.split('.');
        return {
          address: `0x${address}`,
          contract_name: contractName
        };
      });
    console.log(promiseResult, 'values', resultArray);

    return resultArray;
  };




  checkNFTListEnabledNew = async (address: string) => {
    const script = await getScripts('nft', 'checkNFTListEnabled');
    console.log('script checkNFTListEnabledNew ', script)

    const isEnabledList = await fcl.query({
      cadence: script,
      args: (arg, t) => [arg(address, t.Address)],
    });
    return isEnabledList;
  };

  // checkNFTListEnabledNew = async (
  //   address: string,
  //   allTokens
  // ): Promise<NFTModel[]> => {
  //   const tokenImports = allTokens
  //     .map((token) =>
  //       'import <Token> from <TokenAddress>'
  //         .replaceAll('<Token>', token.contract_name)
  //         .replaceAll('<TokenAddress>', token.address)
  //     )
  //     .join('\r\n');
  //   const tokenFunctions = allTokens
  //     .map((token) =>
  //       `
  //     pub fun check<Token>Vault(address: Address) : Bool {
  //       let account = getAccount(address)

  //       let vaultRef = account
  //       .getCapability<&{NonFungibleToken.CollectionPublic}>(<TokenCollectionPublicPath>)
  //       .check()

  //       return vaultRef
  //     }
  //     `
  //         .replaceAll('<TokenCollectionPublicPath>', token.path.public_path)
  //         .replaceAll('<Token>', token.contract_name)
  //         .replaceAll('<TokenAddress>', token.address)
  //     )
  //     .join('\r\n');

  //   const tokenCalls = allTokens
  //     .map((token) =>
  //       `
  //     check<Token>Vault(address: address)
  //     `.replaceAll('<Token>', token.contract_name)
  //     )
  //     .join(',');

  //   const cadence = `
  //     import NonFungibleToken from 0xNonFungibleToken
  //     <TokenImports>

  //     <TokenFunctions>

  //     pub fun main(address: Address) : [Bool] {
  //       return [<TokenCall>]
  //     }
  //   `
  //     .replaceAll('<TokenFunctions>', tokenFunctions)
  //     .replaceAll('<TokenImports>', tokenImports)
  //     .replaceAll('<TokenCall>', tokenCalls);

  //   const enabledList = await fcl.query({
  //     cadence: cadence,
  //     args: (arg, t) => [arg(address, t.Address)],
  //   });

  //   return enabledList;
  // };

  checkNFTListEnabled = async (
    address: string,
    allTokens: NFTModel[]
  ): Promise<NFTModel[]> => {
    const tokens = allTokens;
    const tokenImports = tokens
      .map((token) =>
        'import <Token> from <TokenAddress>'
          .replaceAll('<Token>', token.contract_name)
          .replaceAll('<TokenAddress>', token.address)
      )
      .join('\r\n');

    const tokenFunctions = tokens
      .map((token) =>
        `
      pub fun check<Token>Vault(address: Address) : Bool {
        let account = getAccount(address)

        let vaultRef = account
        .getCapability<&{NonFungibleToken.CollectionPublic}>(<TokenCollectionPublicPath>)
        .check()

        return vaultRef
      }
      `
          .replaceAll('<TokenCollectionPublicPath>', token.path.public_path)
          .replaceAll('<Token>', token.contract_name)
          .replaceAll('<TokenAddress>', token.address)
      )
      .join('\r\n');

    const tokenCalls = tokens
      .map((token) =>
        `
      check<Token>Vault(address: address)
      `.replaceAll('<Token>', token.contract_name)
      )
      .join(',');

    const cadence = `
      import NonFungibleToken from 0xNonFungibleToken
      <TokenImports>

      <TokenFunctions>

      pub fun main(address: Address) : [Bool] {
        return [<TokenCall>]
      }
    `
      .replaceAll('<TokenFunctions>', tokenFunctions)
      .replaceAll('<TokenImports>', tokenImports)
      .replaceAll('<TokenCall>', tokenCalls);

    const enabledList = await fcl.query({
      cadence: cadence,
      args: (arg, t) => [arg(address, t.Address)],
    });

    return enabledList;
  };

  getTransactionTemplate = async (cadence: string, network: string) => {
    console.log('getTransactionTemplate ->');
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

    console.log('getTransactionTemplate ->', init);
    const response = await fetch(
      'https://flix.flow.com/v1/templates/search',
      init
    );
    const template = await response.json();

    console.log('template ->', template);

    const auditorsResponse = await fetch(
      `https://flix.flow.com/v1/auditors?network=${network}`
    );
    const auditors = await auditorsResponse.json();
    console.log('auditors ->', auditors);

    fcl.config().put(
      'flow.auditors',
      auditors.map((item) => item.address)
    );

    const audits =
      await fcl.InteractionTemplateUtils.getInteractionTemplateAudits({
        template: template,
      });

    console.log('audits ->', audits);
    const addresses = Object.keys(audits).filter((address) => audits[address]);

    if (addresses.length <= 0) {
      return null;
    }

    const result = auditors.filter((item) => addresses.includes(item.address));
    console.log('result ->', result);
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

  flowScanQuery = async (query: string, operationName: string) => {
    const config = this.store.config.account_query;
    const data = await this.sendRequest(
      config.method,
      config.path,
      {},
      {
        query,
        operation_name: operationName,
      }
    );

    return data;
  };

  pingNetwork = async (network: string): Promise<boolean> => {
    try {
      const response = await fetch(
        `https://rest-${network}.onflow.org/v1/blocks?height=sealed`
      );
      const result = await response.json();
      return result[0].header != null;
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

  flownsPrepare = async () => {
    const config = this.store.config.flowns_prepare;
    const data = await this.sendRequest(config.method, config.path, {}, {});
    return data;
  };

  flownsAuthTransaction = async (transaction, envelope: string) => {
    const message = {
      envelope_message: envelope,
    };
    // console.log({transaction,message})
    const config = this.store.config.flowns_signature;
    const data = await this.sendRequest(
      config.method,
      config.path,
      {},
      {
        transaction,
        message,
      }
    );

    return data;
  };

  flownsTransaction = async (transaction, envelope: string) => {
    const message = {
      envelope_message: envelope,
    };
    const config = this.store.config.flowns_signature;
    const data = await this.sendRequest(
      config.method,
      config.path,
      {},
      {
        transaction,
        message,
      }
    );

    return data;
  };

  swapEstimate = async (
    network: string,
    inToken: string,
    outToken: string,
    amount
  ) => {
    const response = await fetch(
      `https://lilico.app/api/swap/v1/${network}/estimate?inToken=${inToken}&outToken=${outToken}&inAmount=${amount}`
    );
    return response.json();
  };

  swapOutEstimate = async (
    network: string,
    inToken: string,
    outToken: string,
    amount
  ) => {
    const response = await fetch(
      `https://lilico.app/api/swap/v1/${network}/estimate?inToken=${inToken}&outToken=${outToken}&outAmount=${amount}`
    );
    return response.json();
  };

  fetchTokenList = async (network: string) => {
    const response =
      await fetch(`https://cdn.jsdelivr.net/gh/FlowFans/flow-token-list@main/src/tokens/flow-${network}.tokenlist.json
    `);
    return response.json();
  };

  swapPairs = async (network: string) => {
    const response = await fetch(
      `https://lilico.app/api/swap/v1/${network}/pairs`
    );
    console.log(response);
    return response.json();
  };

  nftCatalog = async () => {
    const { data } = await this.sendRequest(
      'GET',
      'api/nft/collections',
      {},
      {},
      'https://lilico.app/'
    );
    return data;
  };

  cadenceScripts = async (network: string) => {
    const { data } = await this.sendRequest(
      'GET',
      `/api/scripts?network=${network}`,
      {},
      {},
      WEB_NEXT_URL
    );
    return data;
  };

  cadenceScriptsV2 = async () => {
    const { data } = await this.sendRequest(
      'GET',
      `/api/v2/scripts`,
      {},
      {},
      WEB_NEXT_URL
    );
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

  nftCatalogCollections = async (address: string, network: string) => {
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

  nftCollectionApiPaging = async (
    address: string,
    contractName: string,
    limit: any,
    offset: any,
    network: string
  ) => {
    const { data } = await this.sendRequest(
      'GET',
      `/api/storage/${network}/nft?address=${address}&limit=${limit}&offset=${offset}&path=${contractName}`,
      {},
      {},
      'https://lilico.app'
    );
    return data;
  };

  nftCollectionInfo = async (
    address: string,
    contractName: string,
    limit: any,
    offset: any,
    network: string
  ) => {
    const { data } = await this.sendRequest(
      'GET',
      `/api/storage/${network}/nft/collection?address=${address}&path=${contractName}`,
      {},
      {},
      'https://lilico.app'
    );
    return data;
  };

  nftCollectionList = async () => {
    const { data } = await this.sendRequest(
      'GET',
      '/api/nft/collections',
      {},
      {},
      WEB_NEXT_URL
    );
    return data;
  };

  evmFTList = async () => {
    const { data } = await this.sendRequest(
      'GET',
      '/api/evm/fts',
      {},
      {},
      WEB_NEXT_URL
    );
    return data;
  };

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


  getEvmFTPrice = async () => {
    const gitPrice = await storage.getExpiry(`EVMPrice`);

    if (gitPrice) {
      return gitPrice;
    } else {
      const { data } = await this.sendRequest(
        'GET',
        `/api/prices`,
        {},
        {},
        WEB_NEXT_URL
      );
      storage.setExpiry(`EVMPrice`, data, 6000);
      return data;
    }
  };

  evmNFTList = async () => {
    const { data } = await this.sendRequest(
      'GET',
      '/api/evm/nfts',
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

  EvmNFTcollectionList = async (address: string, collectionIdentifier: string, limit = 24, offset = 0) => {
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


  EvmNFTID = async (address: string) => {
    const network = await userWalletService.getNetwork();
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

  getNFTCadenceCollection = async (address: string, network = 'mainnet', identifier, offset = 0, limit = 24) => {
    const { data } = await this.sendRequest(
      'GET',
      `/api/v2/nft/collectionList?network=${network}&address=${address}&offset=${offset}&limit=${limit}&collectionIdentifier=${identifier}`,
      {},
      {},
      WEB_NEXT_URL
    );
    return data;
  };

  getNFTV2CollectionList = async (address: string, network = 'mainnet',) => {
    const { data } = await this.sendRequest(
      'GET',
      `/api/v2/nft/collections?network=${network}&address=${address}`,
      {},
      {},
      WEB_NEXT_URL
    );
    return data;
  };

  genTx = async (contract_name: string) => {
    const network = await userWalletService.getNetwork();
    const app = getApp(process.env.NODE_ENV!);
    const user = await getAuth(app).currentUser;

    // Wait for firebase auth to complete
    await waitForAuthInit();

    const init = {
      headers: {
        Network: network,
      },
    };

    if (user !== null) {
      const idToken = await user.getIdToken();
      init.headers['Authorization'] = idToken;
    } else {
      // If no user, then sign in as anonymous first
      await signInAnonymously(auth);
      const anonymousUser = await getAuth(app).currentUser;
      const idToken = await anonymousUser?.getIdToken();
      init.headers['Authorization'] = idToken;
    }
    const response = await fetch(
      `${WEB_NEXT_URL}/api/nft/gentx?collectionIdentifier=${contract_name}`,
      init
    );

    return response.json();
  };


  putDeviceInfo = async (walletData) => {
    try {
      const testnetId = walletData.find(
        (item) => item.chain_id === 'testnet'
      )?.id;
      const mainnetId = walletData.find(
        (item) => item.chain_id === 'mainnet'
      )?.id;
      const installationId = await this.getInstallationId();
      // console.log('location ', userlocation);

      await this.addDevice({
        wallet_id: mainnetId ? mainnetId.toString() : '',
        wallettest_id: testnetId ? testnetId.toString() : '',
        device_info: {
          device_id: installationId,
          district: '',
          name: 'FRW Chrome Extension',
          type: '2',
          user_agent: 'Chrome',
        },
      });
    } catch (error) {
      console.error('Error while adding device:', error);
      return;
    }
  };

  freshUserInfo = async (currentWallet, keys, pubKTuple, wallet, isChild) => {
    const loggedInAccounts = (await storage.get('loggedInAccounts')) || [];

    if (!isChild) {
      await storage.set('keyIndex', '');
      await storage.set('hashAlgo', '');
      await storage.set('signAlgo', '');
      await storage.set('pubKey', '');

      const { P256, SECP256K1 } = pubKTuple;

      const keyInfoA = findKeyAndInfo(keys, P256.pubK);
      const keyInfoB = findKeyAndInfo(keys, SECP256K1.pubK);
      const keyInfo = keyInfoA ||
        keyInfoB || {
        index: 0,
        signAlgo: keys.keys[0].signAlgo,
        hashAlgo: keys.keys[0].hashAlgo,
        publicKey: keys.keys[0].publicKey,
      };
      await storage.set('keyIndex', keyInfo.index);
      await storage.set('signAlgo', keyInfo.signAlgo);
      await storage.set('hashAlgo', keyInfo.hashAlgo);
      await storage.set('pubKey', keyInfo.publicKey);


      wallet['address'] = currentWallet.address;
      wallet['pubKey'] = keyInfo.publicKey;
      wallet['hashAlgo'] = keyInfo.hashAlgo;
      wallet['signAlgo'] = keyInfo.signAlgo;
      wallet['weight'] = keys.keys[0].weight;

      log.log('wallet is this:', wallet);

      const accountIndex = loggedInAccounts.findIndex(
        (account) => account.username === wallet.username
      );

      if (accountIndex === -1) {
        loggedInAccounts.push(wallet);
      } else {
        loggedInAccounts[accountIndex] = wallet;
      }
      await storage.set('loggedInAccounts', loggedInAccounts);
    }


    log.log('Updated loggedInAccounts:', loggedInAccounts);
    const otherAccounts = loggedInAccounts
      .filter((account) => account.username !== wallet.username)
      .map((account) => {
        const indexInLoggedInAccounts = loggedInAccounts.findIndex(
          (loggedInAccount) => loggedInAccount.username === account.username
        );
        return { ...account, indexInLoggedInAccounts };
      })
      .slice(0, 2);

    log.log('otherAccounts with index:', otherAccounts);
    // await setOtherAccounts(otherAccounts);
    // await setUserInfo(wallet);
    // await setLoggedIn(loggedInAccounts);
    return { otherAccounts, wallet, loggedInAccounts };
  };
}

export default new OpenApiService();
