import compareVersions from 'compare-versions';

import { type FlowNetwork, MAINNET_NETWORK } from '@onflow/flow-wallet-shared/types/network-types';
import { type Currency, DEFAULT_CURRENCY } from '@onflow/flow-wallet-shared/types/wallet-types';

import storage from '@/extension-shared/utils/storage';

import keyringService from './keyring';
import createPersistStore from '../utils/persistStore';

const version = process.env.release || '0';
export interface PreferenceAccount {
  type: string;
  address: string;
  brandName: string;
  alianName?: string;
  displayBrandName?: string;
  index?: number;
  balance?: number;
}
// export interface ChainGas {
//   gasPrice?: number | null; // custom cached gas price
//   gasLevel?: string | null; // cached gasLevel
//   lastTimeSelect?: 'gasLevel' | 'gasPrice'; // last time selection, 'gasLevel' | 'gasPrice'
// }
// export interface GasCache {
//   [chainId: string]: ChainGas;
// }
// export interface addedToken {
//   [address: string]: string[];
// }
interface PreferenceStore {
  currentAccount: PreferenceAccount | undefined | null;
  externalLinkAck: boolean;
  hiddenAddresses: PreferenceAccount[];
  hiddenAccounts: string[];
  balanceMap: {
    [address: string]: any;
  };
  useLedgerLive: boolean;
  locale: string;
  watchAddressPreference: Record<string, number>;
  isDefaultWallet: boolean;
  lastTimeSendToken: Record<string, any>;
  walletSavedList: [];
  alianNames: Record<string, string>;
  initAlianNames: boolean;
  // gasCache: GasCache;
  currentVersion: string;
  firstOpen: boolean;
  pinnedChain: string[];
  // addedToken: addedToken;

  // lilico Preference
  isDeveloperModeEnabled: boolean;
  network: FlowNetwork;
  isFreeGasFeeEnabled: boolean;
  displayCurrency: Currency;
}

const SUPPORT_LOCALES = ['en'];

class PreferenceService {
  store!: PreferenceStore;
  popupOpen = false;
  hasOtherProvider = false;

  init = async () => {
    const defaultLang = 'en';
    const isDeveloperModeEnabled = await storage.get('developerMode');
    this.store = await createPersistStore<PreferenceStore>({
      name: 'preference',
      template: {
        currentAccount: undefined,
        externalLinkAck: false,
        hiddenAddresses: [],
        hiddenAccounts: [],
        balanceMap: {},
        useLedgerLive: false,
        locale: defaultLang,
        watchAddressPreference: {},
        isDefaultWallet: false,
        lastTimeSendToken: {},
        walletSavedList: [],
        alianNames: {},
        initAlianNames: false,
        // gasCache: {},
        currentVersion: '0',
        firstOpen: false,
        pinnedChain: [],
        // addedToken: {},
        isDeveloperModeEnabled: isDeveloperModeEnabled || false,
        network: MAINNET_NETWORK,
        isFreeGasFeeEnabled: false,
        displayCurrency: DEFAULT_CURRENCY,
      },
    });
    if (!this.store.locale || this.store.locale !== defaultLang) {
      this.store.locale = defaultLang;
    }
    if (this.store.isDefaultWallet === undefined || this.store.isDefaultWallet === null) {
      this.store.isDefaultWallet = true;
    }
    if (this.store.currentAccount) {
      // Clear address - it shouldn't be stored
      this.store.currentAccount.address = '';
    }
    if (!this.store.lastTimeSendToken) {
      this.store.lastTimeSendToken = {};
    }
    if (!this.store.alianNames) {
      this.store.alianNames = {};
    }
    if (!this.store.initAlianNames) {
      this.store.initAlianNames = false;
    }
    // if (!this.store.gasCache) {
    //   this.store.gasCache = {};
    // }
    if (!this.store.pinnedChain) {
      this.store.pinnedChain = [];
    }
    // if (!this.store.addedToken) {
    //   this.store.addedToken = {};
    // }
    if (!this.store.externalLinkAck) {
      this.store.externalLinkAck = false;
    }
    if (!this.store.hiddenAddresses) {
      this.store.hiddenAddresses = [];
    }
    if (!this.store.hiddenAccounts) {
      this.store.hiddenAccounts = [];
    }
    if (!this.store.balanceMap) {
      this.store.balanceMap = {};
    }
    if (!this.store.useLedgerLive) {
      this.store.useLedgerLive = false;
    }
    if (!this.store.walletSavedList) {
      this.store.walletSavedList = [];
    }
    if (!this.store.displayCurrency) {
      this.store.displayCurrency = DEFAULT_CURRENCY;
    }
  };

  getLastTimeSendToken = (address: string) => {
    const key = address.toLowerCase();
    return this.store.lastTimeSendToken[key];
  };

  setLastTimeSendToken = (address: string, token: any) => {
    const key = address.toLowerCase();
    this.store.lastTimeSendToken = {
      ...this.store.lastTimeSendToken,
      [key]: token,
    };
  };

  setIsDefaultWallet = (val: boolean) => {
    this.store.isDefaultWallet = val;
  };

  getIsDefaultWallet = () => {
    return this.store.isDefaultWallet;
  };

  getHasOtherProvider = () => {
    return this.hasOtherProvider;
  };

  setHasOtherProvider = (val: boolean) => {
    this.hasOtherProvider = val;
  };

  // getAcceptLanguages = async () => {
  //   let langs = await chrome.i18n.getAcceptLanguages();
  //   if (!langs) langs = [];
  //   return langs
  //     .map((lang) => lang.replace(/-/g, '_'))
  //     .filter((lang) => SUPPORT_LOCALES.includes(lang));
  // };

  getHiddenAddresses = (): PreferenceAccount[] => {
    return structuredClone(this.store.hiddenAddresses);
  };

  hideAddress = (type: string, address: string, brandName: string) => {
    this.store.hiddenAddresses = [
      ...this.store.hiddenAddresses,
      {
        type,
        address: '',
        brandName,
      },
    ];
    if (
      type === this.store.currentAccount?.type &&
      brandName === this.store.currentAccount.brandName
    ) {
      this.resetCurrentAccount();
    }
  };

  /**
   * If current account be hidden or deleted
   * call this function to reset current account
   * to the first address in address list
   */
  resetCurrentAccount = async () => {
    const [account] = await keyringService.getAllVisibleAccountsArray();
    this.setCurrentAccount(account);
  };

  showAddress = (type: string, address: string) => {
    this.store.hiddenAddresses = this.store.hiddenAddresses.filter((item) => {
      return item.type !== type || item.address !== address;
    });
  };

  getCurrentAccount = (): PreferenceAccount | undefined | null => {
    return structuredClone(this.store.currentAccount);
  };

  setCurrentAccount = (account: PreferenceAccount | null) => {
    // We can keep the address in the current account as it should now be an invalid eth address - but unique
    // It may be helpful for debugging. It should never be used for anything else
    this.store.currentAccount = account
      ? {
          ...account,
        }
      : undefined;
  };

  setPopupOpen = (isOpen) => {
    this.popupOpen = isOpen;
  };

  getPopupOpen = () => this.popupOpen;

  updateAddressBalance = (address: string, data: any) => {
    const balanceMap = this.store.balanceMap || {};
    this.store.balanceMap = {
      ...balanceMap,
      [address.toLowerCase()]: data,
    };
  };

  removeAddressBalance = (address: string) => {
    const key = address.toLowerCase();
    if (key in this.store.balanceMap) {
      const map = this.store.balanceMap;
      delete map[key];
      this.store.balanceMap = map;
    }
  };

  getAddressBalance = (address: string): any | null => {
    const balanceMap = this.store.balanceMap || {};
    return balanceMap[address.toLowerCase()] || null;
  };

  getExternalLinkAck = (): boolean => {
    return this.store.externalLinkAck;
  };

  setExternalLinkAck = (ack = false) => {
    this.store.externalLinkAck = ack;
  };

  getLocale = () => {
    return this.store.locale;
  };

  setLocale = (locale: string) => {
    this.store.locale = locale;
  };

  // updateUseLedgerLive = async (value: boolean) => {
  //   this.store.useLedgerLive = value;
  //   const keyrings = keyringService.getKeyringsByType(
  //     HARDWARE_KEYRING_TYPES.Ledger.type
  //   );
  //   await Promise.all(
  //     keyrings.map(async (keyring) => {
  //       await keyring.updateTransportMethod(value);
  //       keyring.restart();
  //     })
  //   );
  // };

  isUseLedgerLive = () => {
    return this.store.useLedgerLive;
  };
  getWalletSavedList = () => {
    return this.store.walletSavedList || [];
  };

  updateWalletSavedList = (list: []) => {
    this.store.walletSavedList = list;
  };
  getAlianName = (address: string) => {
    const key = address.toLowerCase();
    return this.store.alianNames[key];
  };
  getAllAlianName = () => {
    return this.store.alianNames;
  };
  updateAlianName = (address: string, name: string) => {
    const key = address.toLowerCase();
    this.store.alianNames = {
      ...this.store.alianNames,
      [key]: name,
    };
  };
  // getInitAlianNameStatus = () => {
  //   return this.store.initAlianNames;
  // };
  // changeInitAlianNameStatus = () => {
  //   this.store.initAlianNames = true;
  // };
  // getLastTimeGasSelection = (chainId: string) => {
  //   return this.store.gasCache[chainId];
  // };

  // updateLastTimeGasSelection = (chainId: string, gas: ChainGas) => {
  //   this.store.gasCache = {
  //     ...this.store.gasCache,
  //     [chainId]: gas,
  //   };
  // };
  getIsFirstOpen = () => {
    if (!this.store.currentVersion || compareVersions(version, this.store.currentVersion)) {
      this.store.currentVersion = version;
      this.store.firstOpen = true;
    }
    return this.store.firstOpen;
  };
  updateIsFirstOpen = () => {
    this.store.firstOpen = false;
  };
  getSavedChains = () => {
    return this.store.pinnedChain;
  };
  saveChain = (name: string) => {
    this.store.pinnedChain = [...this.store.pinnedChain, name];
  };
  updateChain = (list: string[]) => (this.store.pinnedChain = list);
  // getAddedToken = (address: string) => {
  //   const key = address.toLowerCase();
  //   return this.store.addedToken[key] || [];
  // };
  // updateAddedToken = (address: string, tokenList: []) => {
  //   const key = address.toLowerCase();
  //   this.store.addedToken[key] = tokenList;
  // };
  getDisplayCurrency = () => {
    return this.store.displayCurrency || DEFAULT_CURRENCY;
  };
  setDisplayCurrency = (currency: Currency) => {
    this.store.displayCurrency = currency;
  };
}

export default new PreferenceService();
