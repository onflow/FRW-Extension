// this script is injected into webpage's context
import { EventEmitter } from 'events';

import { ethErrors, serializeError } from 'eth-rpc-errors';

import { SAFE_RPC_METHODS } from '@/constant';
import { consoleError, consoleLog } from '@/shared/utils/console-log';

import DedupePromise from './pageProvider/dedupePromise';
import { switchChainNotice } from './pageProvider/interceptors/switchChain';
import { switchWalletNotice } from './pageProvider/interceptors/switchWallet';
import PushEventHandlers from './pageProvider/pushEventHandlers';
import ReadyPromise from './pageProvider/readyPromise';
import { domReadyCall, $ } from './pageProvider/utils';
import BroadcastChannelMessage from './utils/message/broadcastChannelMessage';
import { patchProvider } from './utils/metamask';

declare const __frw__channelName;
declare const __frw__isDefaultWallet;
declare const __frw__uuid;
declare const __frw__isOpera;

const log = (event, ...args) => {
  if (process.env.NODE_ENV !== 'production') {
    consoleLog(
      `%c [frw] (${new Date().toTimeString().slice(0, 8)}) ${event}`,
      'font-weight: bold; background-color: #7d6ef9; color: white;',
      ...args
    );
  }
};

let channelName = typeof __frw__channelName !== 'undefined' ? __frw__channelName : '';
let isDefaultWallet =
  typeof __frw__isDefaultWallet !== 'undefined' ? __frw__isDefaultWallet : false;
let isOpera = typeof __frw__isOpera !== 'undefined' ? __frw__isOpera : false;
let uuid = typeof __frw__uuid !== 'undefined' ? __frw__uuid : '';
let extensionId = '';

const getParams = () => {
  if (localStorage.getItem('frw:channelName')) {
    channelName = localStorage.getItem('frw:channelName') as string;
    localStorage.removeItem('frw:channelName');
  }
  if (localStorage.getItem('frw:isDefaultWallet')) {
    isDefaultWallet = localStorage.getItem('frw:isDefaultWallet') === 'true';
    localStorage.removeItem('frw:isDefaultWallet');
  }
  if (localStorage.getItem('frw:uuid')) {
    uuid = localStorage.getItem('frw:uuid') as string;
    localStorage.removeItem('frw:uuid');
  }
  if (localStorage.getItem('frw:isOpera')) {
    isOpera = localStorage.getItem('frw:isOpera') === 'true';
    localStorage.removeItem('frw:isOpera');
  }
  if (localStorage.getItem('frw:extensionId')) {
    extensionId = localStorage.getItem('frw:extensionId') as string;
    localStorage.removeItem('frw:extensionId');
  }
};
getParams();

export interface Interceptor {
  onRequest?: (data: any) => any;
  onResponse?: (res: any, data: any) => any;
}

interface StateProvider {
  accounts: string[] | null;
  isConnected: boolean;
  isUnlocked: boolean;
  initialized: boolean;
  isPermanentlyDisconnected: boolean;
}

interface EIP6963ProviderInfo {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
}
interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo;
  provider: EthereumProvider;
}

interface EIP6963RequestProviderEvent extends Event {
  type: 'eip6963:requestProvider';
}

export class EthereumProvider extends EventEmitter {
  chainId: string | null = null;
  selectedAddress: string | null = null;
  /**
   * The network ID of the currently connected Ethereum chain.
   * @deprecated
   */
  networkVersion: string | null = null;
  isFrw = true;
  isMetaMask = true;
  _isFrw = true;

  _isReady = false;
  _isConnected = false;
  _initialized = false;
  _isUnlocked = false;

  _cacheRequestsBeforeReady: any[] = [];
  _cacheEventListenersBeforeReady: [string | symbol, () => any][] = [];

  _state: StateProvider = {
    accounts: null,
    isConnected: false,
    isUnlocked: false,
    initialized: false,
    isPermanentlyDisconnected: false,
  };

  _metamask = {
    isUnlocked: () => {
      return new Promise((resolve) => {
        resolve(this._isUnlocked);
      });
    },
  };

  private _pushEventHandlers: PushEventHandlers;
  private _requestPromise = new ReadyPromise(2);
  private _dedupePromise = new DedupePromise([]);
  private _bcm = new BroadcastChannelMessage(channelName);

  constructor({ maxListeners = 100 } = {}) {
    super();
    this.setMaxListeners(maxListeners);
    this.initialize();
    this.shimLegacy();
    this._pushEventHandlers = new PushEventHandlers(this);
  }

  initialize = async () => {
    document.addEventListener('visibilitychange', this._requestPromiseCheckVisibility);

    this._bcm.connect().on('message', this._handleBackgroundMessage);
    domReadyCall(() => {
      const origin = location.origin;
      const icon =
        ($('head > link[rel~="icon"]') as HTMLLinkElement)?.href ||
        ($('head > meta[itemprop="image"]') as HTMLMetaElement)?.content;

      const name =
        document.title || ($('head > meta[name="title"]') as HTMLMetaElement)?.content || origin;

      this._bcm.request({
        method: 'tabCheckin',
        params: { icon, name, origin },
      });

      this._requestPromise.check(2);
    });

    try {
      const { chainId, accounts, networkVersion, isUnlocked }: any =
        await this.requestInternalMethods({
          method: 'getProviderState',
        });
      if (isUnlocked) {
        this._isUnlocked = true;
        this._state.isUnlocked = true;
      }
      this.chainId = chainId;
      this.networkVersion = networkVersion;
      this.emit('connect', { chainId });
      this._pushEventHandlers.chainChanged({
        chain: chainId,
        networkVersion,
      });

      this._pushEventHandlers.accountsChanged(accounts);
    } catch {
      //
    } finally {
      this._initialized = true;
      this._state.initialized = true;
      this.emit('_initialized');
    }
  };

  private _requestPromiseCheckVisibility = () => {
    if (document.visibilityState === 'visible') {
      this._requestPromise.check(1);
    } else {
      this._requestPromise.uncheck(1);
    }
  };

  private _handleBackgroundMessage = ({ event, data }) => {
    log('[push event]', event, data);
    if (this._pushEventHandlers[event]) {
      return this._pushEventHandlers[event](data);
    }

    this.emit(event, data);
  };

  isConnected = () => {
    return true;
  };

  // TODO: support multi request!
  request = async (data) => {
    if (!this._isReady) {
      const promise = new Promise((resolve, reject) => {
        this._cacheRequestsBeforeReady.push({
          data,
          resolve,
          reject,
        });
      });
      return promise;
    }
    return this._dedupePromise.call(data.method, () => this._request(data));
  };

  _request = async (data) => {
    if (!data) {
      throw ethErrors.rpc.invalidRequest();
    }

    this._requestPromiseCheckVisibility();

    return this._requestPromise.call(() => {
      if (data.method !== 'eth_call') {
        log('[request]', JSON.stringify(data, null, 2));
      }

      return this._bcm
        .request({
          ...data,
          extensionId,
        })
        .then((res) => {
          if (data.method !== 'eth_call') {
            log('[request: success]', data.method, res);
          }
          return res;
        })
        .catch((err) => {
          if (data.method !== 'eth_call') {
            log('[request: error]', data.method, serializeError(err));
          }
          throw serializeError(err);
        });
    });
  };

  requestInternalMethods = (data) => {
    return this._dedupePromise.call(data.method, () => this._request(data));
  };

  // shim to matamask legacy api
  sendAsync = (payload, callback) => {
    if (Array.isArray(payload)) {
      return Promise.all(
        payload.map(
          (item) =>
            new Promise((resolve) => {
              this.sendAsync(item, (err, res) => {
                // ignore error
                resolve(res);
              });
            })
        )
      ).then((result) => callback(null, result));
    }
    const { method, params, ...rest } = payload;
    this.request({ method, params })
      .then((result) => callback(null, { ...rest, method, result }))
      .catch((error) => callback(error, { ...rest, method, error }));
  };

  send = (payload, callback?) => {
    if (typeof payload === 'string' && (!callback || Array.isArray(callback))) {
      // send(method, params? = [])
      return this.request({
        method: payload,
        params: callback,
      }).then((result) => ({
        id: undefined,
        jsonrpc: '2.0',
        result,
      }));
    }

    if (typeof payload === 'object' && typeof callback === 'function') {
      return this.sendAsync(payload, callback);
    }

    let result;
    switch (payload.method) {
      case 'eth_accounts':
        result = this.selectedAddress ? [this.selectedAddress] : [];
        break;

      case 'eth_coinbase':
        result = this.selectedAddress || null;
        break;

      default:
        throw new Error('sync method doesnt support');
    }

    return {
      id: payload.id,
      jsonrpc: payload.jsonrpc,
      result,
    };
  };

  shimLegacy = () => {
    const legacyMethods = [
      ['enable', 'eth_requestAccounts'],
      ['net_version', 'net_version'],
    ];

    for (const [_method, method] of legacyMethods) {
      this[_method] = () => this.request({ method });
    }
  };

  on = (event: string | symbol, handler: (...args: any[]) => void) => {
    if (!this._isReady) {
      this._cacheEventListenersBeforeReady.push([event, handler]);
      return this;
    }
    return super.on(event, handler);
  };
}

declare global {
  interface Window {
    ethereum: EthereumProvider;
    web3: any;
    frw: EthereumProvider;
    flowWalletRouter: {
      flowProvider: EthereumProvider;
      lastInjectedProvider?: EthereumProvider;
      currentProvider: EthereumProvider;
      providers: EthereumProvider[];
      setDefaultProvider: (frwAsDefault: boolean) => void;
      addProvider: (provider: EthereumProvider) => void;
    };
  }
}

const provider = new EthereumProvider();
patchProvider(provider);
const flowProvider = new Proxy(provider, {
  deleteProperty: (target, prop) => {
    if (typeof prop === 'string' && ['on', 'isFrw', 'isMetaMask', '_isFrw'].includes(prop)) {
      delete target[prop];
    }
    return true;
  },
});

const requestHasOtherProvider = async () => {
  try {
    return await provider.requestInternalMethods({
      method: 'hasOtherProvider',
      params: [],
    });
  } catch (error) {
    consoleError('Error checking for other providers:', error);
    return false;
  }
};

const requestIsDefaultWallet = async () => {
  try {
    return (await provider.requestInternalMethods({
      method: 'isDefaultWallet',
      params: [],
    })) as Promise<boolean>;
  } catch (error) {
    consoleError('Error checking default wallet status:', error);
    return false;
  }
};

// Check if user is connected to Flow Wallet
const isConnectedToFlowWallet = (flowProvider: EthereumProvider) => {
  const connected =
    flowProvider.selectedAddress !== null && flowProvider.selectedAddress !== undefined;
  log(
    '[connection]',
    'Flow Wallet connected:',
    connected,
    'selectedAddress:',
    flowProvider.selectedAddress
  );
  return connected;
};

// Determine if a method should be routed to Flow Wallet
const shouldRouteToFlowWallet = (method: string, connectedToFlowWallet: boolean) => {
  // Connection methods that should only be handled by Flow Wallet if user is already connected
  // Otherwise let other wallets handle their own connection flow
  const connectionMethods = ['eth_accounts', 'eth_requestAccounts'];

  // Methods that should ONLY be routed to Flow Wallet when already connected
  const connectedOnlyMethods = [
    // Read-only methods (only when connected to avoid breaking other wallet connections)
    'eth_call',
    'eth_getBalance',
    'eth_getCode',
    'eth_blockNumber',
    'eth_gasPrice',
    'eth_getTransactionByHash',
    'eth_getTransactionReceipt',
    'eth_chainId',
    'net_version',
    // Transaction methods
    'eth_sendTransaction',
    'eth_estimateGas',
    'eth_signTransaction',
    'eth_signTypedData',
    'eth_signTypedData_v3',
    'eth_signTypedData_v4',
    'personal_sign',
    'wallet_requestPermissions',
    'wallet_getPermissions',
    'wallet_revokePermissions',
    'wallet_switchEthereumChain',
    'wallet_watchAsset',
  ];

  // Only route connection methods if already connected to Flow Wallet
  // This prevents intercepting MetaMask connection attempts
  if (connectionMethods.includes(method)) {
    if (connectedToFlowWallet) {
      log('[routing]', `${method} -> Flow Wallet (already connected)`);
      return true;
    } else {
      log('[routing]', `${method} -> Default provider (not connected, let other wallets handle)`);
      return false;
    }
  }

  // Route all other methods only if connected to Flow Wallet
  if (connectedToFlowWallet && connectedOnlyMethods.includes(method)) {
    log('[routing]', `${method} -> Flow Wallet (connected)`);
    return true;
  }

  // For any other safe RPC methods, only route if connected
  if (SAFE_RPC_METHODS.includes(method)) {
    if (connectedToFlowWallet) {
      log('[routing]', `${method} -> Flow Wallet (safe method, connected)`);
      return true;
    } else {
      log('[routing]', `${method} -> Default provider (safe method, not connected)`);
      return false;
    }
  }

  log('[routing]', `${method} -> Default provider (default case)`);
  return false;
};

const initOperaProvider = () => {
  window.ethereum = flowProvider;
  flowProvider._isReady = true;
  window.frw = flowProvider;
  patchProvider(flowProvider);
  flowProvider.on('frw:chainChanged', switchChainNotice);
};

const initProvider = async () => {
  flowProvider._isReady = true;
  flowProvider.on('defaultWalletChanged', switchWalletNotice);
  patchProvider(flowProvider);
  if (window.ethereum) {
    await requestHasOtherProvider();
  }
  if (!window.web3) {
    window.web3 = {
      currentProvider: flowProvider,
    };
  }
  const descriptor = Object.getOwnPropertyDescriptor(window, 'ethereum');
  const canDefine = !descriptor || descriptor.configurable;
  if (canDefine) {
    try {
      Object.defineProperties(window, {
        frw: {
          value: flowProvider,
          configurable: false,
          writable: false,
        },
        ethereum: {
          get() {
            // Proxy that routes specific methods
            const currentProvider = window.flowWalletRouter.currentProvider;
            const flowProvider = window.flowWalletRouter.flowProvider;

            // If current provider is Flow Wallet, return it directly
            if (currentProvider === flowProvider) {
              return currentProvider;
            }

            // Proxy that intercepts specific methods
            return new Proxy(currentProvider, {
              get(target, prop) {
                // Handle request method specially
                if (prop === 'request') {
                  return async (data) => {
                    try {
                      // Check if user is connected to Flow Wallet
                      const connectedToFlowWallet = isConnectedToFlowWallet(flowProvider);

                      if (data && shouldRouteToFlowWallet(data.method, connectedToFlowWallet)) {
                        return await flowProvider.request(data);
                      }
                      // Route other methods to the default provider
                      return await target.request(data);
                    } catch (error) {
                      consoleError('Error in request proxy:', error);
                      throw error;
                    }
                  };
                }
                // Handle sendAsync method
                if (prop === 'sendAsync') {
                  return async (payload, callback) => {
                    try {
                      const connectedToFlowWallet = isConnectedToFlowWallet(flowProvider);

                      if (
                        payload &&
                        !Array.isArray(payload) &&
                        shouldRouteToFlowWallet(payload.method, connectedToFlowWallet)
                      ) {
                        return await flowProvider.sendAsync(payload, callback);
                      }
                      return await target.sendAsync(payload, callback);
                    } catch (error) {
                      consoleError('Error in sendAsync proxy:', error);
                      if (callback) callback(error, null);
                      throw error;
                    }
                  };
                }
                // Handle send method
                if (prop === 'send') {
                  return async (payload, callback) => {
                    try {
                      const connectedToFlowWallet = isConnectedToFlowWallet(flowProvider);

                      if (
                        typeof payload === 'object' &&
                        payload.method &&
                        shouldRouteToFlowWallet(payload.method, connectedToFlowWallet)
                      ) {
                        return await flowProvider.send(payload, callback);
                      }
                      return await target.send(payload, callback);
                    } catch (error) {
                      consoleError('Error in send proxy:', error);
                      if (callback) callback(error, null);
                      throw error;
                    }
                  };
                }
                // For other properties, return from the target
                return target[prop];
              },
            });
          },
          set(newProvider) {
            window.flowWalletRouter.addProvider(newProvider);
          },
          configurable: false,
        },
        flowWalletRouter: {
          value: {
            flowProvider,
            lastInjectedProvider: window.ethereum,
            currentProvider: flowProvider,
            providers: [flowProvider, ...(window.ethereum ? [window.ethereum] : [])],
            setDefaultProvider(frwAsDefault: boolean) {
              if (frwAsDefault) {
                window.flowWalletRouter.currentProvider = window.frw;
              } else {
                const nonDefaultProvider =
                  window.flowWalletRouter.lastInjectedProvider ?? window.ethereum;
                window.flowWalletRouter.currentProvider = nonDefaultProvider;
              }
            },
            addProvider(provider) {
              if (!window.flowWalletRouter.providers.includes(provider)) {
                window.flowWalletRouter.providers.push(provider);
              }
              if (flowProvider !== provider) {
                requestHasOtherProvider();
                window.flowWalletRouter.lastInjectedProvider = provider;
              }
            },
          },
          configurable: false,
          writable: false,
        },
      });
    } catch (e) {
      // think that defineProperty failed means there is any other wallet
      await requestHasOtherProvider();
      consoleError(e);
      window.ethereum = flowProvider;
      window.frw = flowProvider;
    }
  } else {
    window.ethereum = flowProvider;
    window.frw = flowProvider;
  }
};

// Initialize provider async
const initializeWallet = async () => {
  try {
    if (isOpera) {
      initOperaProvider();
    } else {
      await initProvider();
    }

    const frwAsDefault = await requestIsDefaultWallet();
    window.flowWalletRouter?.setDefaultProvider(frwAsDefault);
    if (frwAsDefault) {
      window.ethereum = flowProvider;
    }

    log('[initialization]', 'Flow Wallet successfully initialized');
  } catch (error) {
    consoleError('Error during wallet initialization:', error);
    // Fallback to basic initialization
    if (isOpera) {
      initOperaProvider();
    } else {
      window.ethereum = flowProvider;
      window.frw = flowProvider;
    }
  }
};

// Initialize the wallet
initializeWallet();

const EIP6963Icon =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUwIiBoZWlnaHQ9IjI1MCIgdmlld0JveD0iMCAwIDI1MCAyNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxnIGNsaXAtcGF0aD0idXJsKCNjbGlwMF8xMzc2MV8zNTIxKSI+CjxyZWN0IHdpZHRoPSIyNTAiIGhlaWdodD0iMjUwIiByeD0iNDYuODc1IiBmaWxsPSJ3aGl0ZSIvPgo8ZyBjbGlwLXBhdGg9InVybCgjY2xpcDFfMTM3NjFfMzUyMSkiPgo8cmVjdCB3aWR0aD0iMjUwIiBoZWlnaHQ9IjI1MCIgZmlsbD0idXJsKCNwYWludDBfbGluZWFyXzEzNzYxXzM1MjEpIi8+CjxwYXRoIGQ9Ik0xMjUgMjE3LjUyOUMxNzYuMTAyIDIxNy41MjkgMjE3LjUyOSAxNzYuMTAyIDIxNy41MjkgMTI1QzIxNy41MjkgNzMuODk3NSAxNzYuMTAyIDMyLjQ3MDcgMTI1IDMyLjQ3MDdDNzMuODk3NSAzMi40NzA3IDMyLjQ3MDcgNzMuODk3NSAzMi40NzA3IDEyNUMzMi40NzA3IDE3Ni4xMDIgNzMuODk3NSAyMTcuNTI5IDEyNSAyMTcuNTI5WiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTE2NS4zODIgMTEwLjQyMkgxMzkuNTg1VjEzNi43OEgxNjUuMzgyVjExMC40MjJaIiBmaWxsPSJibGFjayIvPgo8cGF0aCBkPSJNMTEzLjIyNyAxMzYuNzhIMTM5LjU4NVYxMTAuNDIySDExMy4yMjdWMTM2Ljc4WiIgZmlsbD0iIzQxQ0M1RCIvPgo8L2c+CjwvZz4KPGRlZnM+CjxsaW5lYXJHcmFkaWVudCBpZD0icGFpbnQwX2xpbmVhcl8xMzc2MV8zNTIxIiB4MT0iMCIgeTE9IjAiIHgyPSIyNTAiIHkyPSIyNTAiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0iIzFDRUI4QSIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiM0MUNDNUQiLz4KPC9saW5lYXJHcmFkaWVudD4KPGNsaXBQYXRoIGlkPSJjbGlwMF8xMzc2MV8zNTIxIj4KPHJlY3Qgd2lkdGg9IjI1MCIgaGVpZ2h0PSIyNTAiIHJ4PSI0Ni44NzUiIGZpbGw9IndoaXRlIi8+CjwvY2xpcFBhdGg+CjxjbGlwUGF0aCBpZD0iY2xpcDFfMTM3NjFfMzUyMSI+CjxyZWN0IHdpZHRoPSIyNTAiIGhlaWdodD0iMjUwIiBmaWxsPSJ3aGl0ZSIvPgo8L2NsaXBQYXRoPgo8L2RlZnM+Cjwvc3ZnPgo=';

const announceEip6963Provider = (provider: EthereumProvider) => {
  const info: EIP6963ProviderInfo = {
    uuid: uuid,
    name: 'Flow Wallet',
    icon: EIP6963Icon,
    rdns: 'com.flowfoundation.wallet',
  };

  window.dispatchEvent(
    new CustomEvent('eip6963:announceProvider', {
      detail: Object.freeze({ info, provider }),
    })
  );
};

window.addEventListener<any>('eip6963:requestProvider', (event: EIP6963RequestProviderEvent) => {
  announceEip6963Provider(flowProvider);
});

announceEip6963Provider(flowProvider);

window.dispatchEvent(new Event('ethereum#initialized'));
