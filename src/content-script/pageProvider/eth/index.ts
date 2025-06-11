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
import PostMessage from './utils/message/post-message';
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

// Check if we're running in MAIN world by looking for the bridge UUID event
let isMainWorld = false;
let bridgeUUID = '';

log('PageProvider starting - checking for bridge UUID');

// First check if UUIDs are already available from global storage
const existingUUIDs = (window as any).__frwUUIDs;
if (existingUUIDs?.bridgeUUID && existingUUIDs?.walletUUID) {
  isMainWorld = true;
  bridgeUUID = existingUUIDs.bridgeUUID;
  uuid = existingUUIDs.walletUUID;

  // Store in window for easy access
  (window as any).__frwBridgeUUID = bridgeUUID;
  (window as any).__frwWalletUUID = uuid;

  log('Found existing UUIDs - bridge UUID:', bridgeUUID, 'wallet UUID:', uuid);
} else {
  log('No existing UUIDs found, waiting for bridge UUID event');
}

// Function to wait for wallet UUID
const waitForWalletUUID = (): Promise<string> => {
  return new Promise((resolve) => {
    if (uuid) {
      log('UUID already available:', uuid);
      resolve(uuid);
      return;
    }

    let checkCount = 0;

    const timeoutId = setTimeout(() => {
      clearInterval(checkInterval);
      const fallbackUUID = uuid || 'flow-wallet-default';
      log(`UUID wait timed out after ${checkCount} checks, using fallback:`, fallbackUUID);
      resolve(fallbackUUID);
    }, 1000);

    // Check periodically for the UUID
    const checkInterval = setInterval(() => {
      checkCount++;
      if (typeof (window as any).__frwWalletUUID !== 'undefined') {
        uuid = (window as any).__frwWalletUUID;
        log(`Got UUID after ${checkCount} checks:`, uuid);
        clearInterval(checkInterval);
        clearTimeout(timeoutId);
        resolve(uuid);
      }
    }, 10);
  });
};

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
  private _bcm: BroadcastChannelMessage | PostMessage;

  constructor({ maxListeners = 100 } = {}) {
    super();
    this.setMaxListeners(maxListeners);

    // Initialize communication based on execution context
    log(
      'EthereumProvider constructor - isMainWorld:',
      isMainWorld,
      'bridgeUUID:',
      bridgeUUID,
      'channelName:',
      channelName
    );

    if (isMainWorld && bridgeUUID) {
      log('Creating PostMessage with bridgeUUID:', bridgeUUID);
      this._bcm = new PostMessage(bridgeUUID);
    } else {
      log('Creating BroadcastChannelMessage with channelName:', channelName);
      this._bcm = new BroadcastChannelMessage(channelName);
    }

    this.initialize();
    this.shimLegacy();
    this._pushEventHandlers = new PushEventHandlers(this);
  }

  initialize = async () => {
    log('EthereumProvider - initialize');
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
    log('EthereumProvider - _requestPromiseCheckVisibility', document.visibilityState);
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
    log('EthereumProvider - isConnected', this._isConnected);
    return true;
  };

  // TODO: support multi request!
  request = async (data) => {
    log('EthereumProvider - request', data);
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
    log('EthereumProvider - _request', data);
    if (!data) {
      throw ethErrors.rpc.invalidRequest();
    }

    this._requestPromiseCheckVisibility();

    return this._requestPromise.call(() => {
      if (data.method !== 'eth_call') {
        log('[request]', JSON.stringify(data, null, 2));
      }

      return this._bcm
        .request(data)
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
    log('EthereumProvider - requestInternalMethods', data);
    return this._dedupePromise.call(data.method, () => this._request(data));
  };

  // shim to matamask legacy api
  sendAsync = (payload, callback) => {
    log('EthereumProvider - sendAsync', payload);
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
    log('EthereumProvider - send', payload);
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
    log('EthereumProvider - shimLegacy');
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

// Will be initialized asynchronously
let flowProvider: EthereumProvider | null = null;
let resolveProvider: (provider: EthereumProvider) => void;
const flowProviderPromise = new Promise<EthereumProvider>((resolve) => {
  resolveProvider = resolve;
});

// Listen for the bridge event to set config and initialize the provider
document.addEventListener(
  'frw:bridge-uuid',
  ((event: CustomEvent) => {
    log('Received bridge UUID event, setting config', event.detail);
    if (event.detail?.bridgeUUID && event.detail?.walletUUID) {
      isMainWorld = true;
      bridgeUUID = event.detail.bridgeUUID;
      uuid = event.detail.walletUUID;

      // Store in window for easy access
      (window as any).__frwBridgeUUID = bridgeUUID;
      (window as any).__frwWalletUUID = uuid;

      log('Updated from event - bridge UUID:', bridgeUUID, 'wallet UUID:', uuid);
    }
    // Initialize the provider now that we have the config
    initializeFlowProvider();
  }) as EventListener,
  { once: true }
); // Important: only handle this once

const createProvider = () => {
  const provider = new EthereumProvider();
  patchProvider(provider);
  return new Proxy(provider, {
    deleteProperty: (target, prop) => {
      if (typeof prop === 'string' && ['on', 'isFrw', 'isMetaMask', '_isFrw'].includes(prop)) {
        delete target[prop];
      }
      return true;
    },
  });
};

const initializeFlowProvider = () => {
  // Prevent double-initialization
  if (flowProvider) {
    return;
  }
  log('Initializing Flow provider...');
  flowProvider = createProvider();
  resolveProvider(flowProvider); // Resolve the promise for other parts of the script
  return flowProvider;
};

const requestHasOtherProvider = async () => {
  const provider = await flowProviderPromise;
  return provider.requestInternalMethods({
    method: 'hasOtherProvider',
    params: [],
  });
};

const requestIsDefaultWallet = async () => {
  const provider = await flowProviderPromise;
  return provider.requestInternalMethods({
    method: 'isDefaultWallet',
    params: [],
  }) as Promise<boolean>;
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

const initOperaProvider = async () => {
  const provider = await flowProviderPromise;
  window.ethereum = provider;
  provider._isReady = true;
  window.frw = provider;
  patchProvider(provider);
  provider.on('frw:chainChanged', switchChainNotice);
};

const initProvider = async () => {
  const provider = await flowProviderPromise;
  provider._isReady = true;
  provider.on('defaultWalletChanged', switchWalletNotice);
  patchProvider(provider);
  if (window.ethereum) {
    await requestHasOtherProvider();
  }
  if (!window.web3) {
    window.web3 = {
      currentProvider: provider,
    };
  }
  const descriptor = Object.getOwnPropertyDescriptor(window, 'ethereum');
  const canDefine = !descriptor || descriptor.configurable;
  if (canDefine) {
    try {
      Object.defineProperties(window, {
        frw: {
          value: provider,
          configurable: false,
          writable: false,
        },
        ethereum: {
          get() {
            log('ethereum get');
            // This proxy is the key to multi-wallet interoperability.
            // It intercepts requests and routes them to our wallet or the default
            // wallet based on the connection state and method type.
            const currentProvider = window.flowWalletRouter.currentProvider;
            const flowProvider = window.flowWalletRouter.flowProvider;

            // The proxy is always returned, wrapping the current default provider.
            // This ensures we can intercept requests even if our wallet is not the active one.
            return new Proxy(currentProvider, {
              get(target, prop) {
                // Handle request method specially
                if (prop === 'request') {
                  return async (data) => {
                    // Check if user is connected to Flow Wallet
                    const connectedToFlowWallet = isConnectedToFlowWallet(flowProvider);

                    if (data && shouldRouteToFlowWallet(data.method, connectedToFlowWallet)) {
                      return flowProvider.request(data);
                    }
                    // Route other methods to the default provider
                    return target.request(data);
                  };
                }
                // Handle sendAsync method
                if (prop === 'sendAsync') {
                  return async (payload, callback) => {
                    const connectedToFlowWallet = isConnectedToFlowWallet(flowProvider);

                    if (
                      payload &&
                      !Array.isArray(payload) &&
                      shouldRouteToFlowWallet(payload.method, connectedToFlowWallet)
                    ) {
                      return flowProvider.sendAsync(payload, callback);
                    }
                    return target.sendAsync(payload, callback);
                  };
                }
                // Handle send method
                if (prop === 'send') {
                  return async (payload, callback) => {
                    const connectedToFlowWallet = isConnectedToFlowWallet(flowProvider);

                    if (
                      typeof payload === 'object' &&
                      payload.method &&
                      shouldRouteToFlowWallet(payload.method, connectedToFlowWallet)
                    ) {
                      return flowProvider.send(payload, callback);
                    }
                    return target.send(payload, callback);
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
            flowProvider: provider,
            lastInjectedProvider: window.ethereum,
            currentProvider: provider,
            providers: [provider, ...(window.ethereum ? [window.ethereum] : [])],
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
      window.ethereum = provider;
      window.frw = provider;
    }
  } else {
    window.ethereum = provider;
    window.frw = provider;
  }
};

// Set up initialization promises
const providerInitPromise = flowProviderPromise.then((provider) => {
  return new Promise<void>((resolve) => {
    const checkInit = () => {
      if (provider._initialized) {
        resolve();
      } else {
        provider.once('_initialized', resolve);
      }
    };
    checkInit();
  });
});

(async () => {
  try {
    if (isOpera) {
      await initOperaProvider();
    } else {
      await initProvider();
    }
  } catch (e) {
    consoleError('An error occurred while initializing the Flow wallet provider', e);
  }
})();

(async () => {
  try {
    const provider = await flowProviderPromise;
    const frwAsDefault = await requestIsDefaultWallet();
    // Set our wallet as the default if configured, but do not overwrite
    // the window.ethereum proxy, which is essential for routing.
    window.flowWalletRouter?.setDefaultProvider(frwAsDefault);
  } catch (e) {
    consoleError('An error occurred while checking if the Flow wallet is the default wallet', e);
  }
})();

const EIP6963Icon =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUwIiBoZWlnaHQ9IjI1MCIgdmlld0JveD0iMCAwIDI1MCAyNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxnIGNsaXAtcGF0aD0idXJsKCNjbGlwMF8xMzc2MV8zNTIxKSI+CjxyZWN0IHdpZHRoPSIyNTAiIGhlaWdodD0iMjUwIiByeD0iNDYuODc1IiBmaWxsPSJ3aGl0ZSIvPgo8ZyBjbGlwLXBhdGg9InVybCgjY2xpcDFfMTM3NjFfMzUyMSkiPgo8cmVjdCB3aWR0aD0iMjUwIiBoZWlnaHQ9IjI1MCIgZmlsbD0idXJsKCNwYWludDBfbGluZWFyXzEzNzYxXzM1MjEpIi8+CjxwYXRoIGQ9Ik0xMjUgMjE3LjUyOUMxNzYuMTAyIDIxNy41MjkgMjE3LjUyOSAxNzYuMTAyIDIxNy41MjkgMTI1QzIxNy41MjkgNzMuODk3NSAxNzYuMTAyIDMyLjQ3MDcgMTI1IDMyLjQ3MDdDNzMuODk3NSAzMi40NzA3IDMyLjQ3MDcgNzMuODk3NSAzMi40NzA3IDEyNUMzMi40NzA3IDE3Ni4xMDIgNzMuODk3NSAyMTcuNTI5IDEyNSAyMTcuNTI5WiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTE2NS4zODIgMTEwLjQyMkgxMzkuNTg1VjEzNi43OEgxNjUuMzgyVjExMC40MjJaIiBmaWxsPSJibGFjayIvPgo8cGF0aCBkPSJNMTEzLjIyNyAxMzYuNzhIMTM5LjU4NVYxMTAuNDIySDExMy4yMjdWMTM2Ljc4WiIgZmlsbD0iIzQxQ0M1RCIvPgo8L2c+CjwvZz4KPGRlZnM+CjxsaW5lYXJHcmFkaWVudCBpZD0icGFpbnQwX2xpbmVhcl8xMzc2MV8zNTIxIiB4MT0iMCIgeTE9IjAiIHgyPSIyNTAiIHkyPSIyNTAiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0iIzFDRUI4QSIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiM0MUNDNUQiLz4KPC9saW5lYXJHcmFkaWVudD4KPGNsaXBQYXRoIGlkPSJjbGlwMF8xMzc2MV8zNTIxIj4KPHJlY3Qgd2lkdGg9IjI1MCIgaGVpZ2h0PSIyNTAiIHJ4PSI0Ni44NzUiIGZpbGw9IndoaXRlIi8+CjwvY2xpcFBhdGg+CjxjbGlwUGF0aCBpZD0iY2xpcDFfMTM3NjFfMzUyMSI+CjxyZWN0IHdpZHRoPSIyNTAiIGhlaWdodD0iMjUwIiBmaWxsPSJ3aGl0ZSIvPgo8L2NsaXBQYXRoPgo8L2RlZnM+Cjwvc3ZnPgo=';

const announceEip6963Provider = (provider: EthereumProvider) => {
  // Ensure we have a valid UUID before announcing
  if (!uuid) {
    log('EIP-6963: No UUID available, skipping announcement');
    return;
  }

  const info: EIP6963ProviderInfo = {
    uuid: uuid,
    name: 'Flow Wallet',
    icon: EIP6963Icon,
    rdns: 'com.flowfoundation.wallet',
  };

  log('EIP-6963: Announcing provider with UUID', uuid);

  window.dispatchEvent(
    new CustomEvent('eip6963:announceProvider', {
      detail: Object.freeze({ info, provider }),
    })
  );
};

// Set up EIP-6963 event listener
window.addEventListener<any>(
  'eip6963:requestProvider',
  async (event: EIP6963RequestProviderEvent) => {
    log('eip6963:requestProvider', event);
    try {
      const provider = await flowProviderPromise;
      // Only announce if provider is ready
      if (provider._isReady) {
        announceEip6963Provider(provider);
      } else {
        // If not ready, wait for it
        await providerInitPromise;
        announceEip6963Provider(provider);
      }
    } catch (e) {
      log('Error handling eip6963:requestProvider:', e);
    }
  }
);

// Wait for both UUIDs and provider initialization
Promise.all([waitForWalletUUID(), flowProviderPromise])
  .then(([walletUUID, provider]) => {
    providerInitPromise.then(() => {
      log('Provider initialized and got wallet UUID:', walletUUID);

      // Announce immediately when both are ready
      announceEip6963Provider(provider);

      // Also announce when DOM is ready (for late-loading dApps)
      domReadyCall(() => {
        log('DOM ready, announcing EIP-6963 provider again');
        announceEip6963Provider(provider);
      });

      // Announce after a short delay to catch very late-loading dApps
      setTimeout(() => {
        log('Delayed EIP-6963 announcement');
        announceEip6963Provider(provider);
      }, 100);
    });
  })
  .catch((e) => {
    log('Error in EIP-6963 setup:', e);
  });

window.dispatchEvent(new Event('ethereum#initialized'));
