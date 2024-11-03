import * as ethUtil from 'ethereumjs-util';
import { ethErrors } from 'eth-rpc-errors';
import {
  keyringService,
  preferenceService,
  notificationService,
  permissionService,
  sessionService,
  openapiService,
  pageStateCacheService,
  userInfoService,
  coinListService,
  addressBookService,
  userWalletService,
  transactionService,
  nftService,
  googleDriveService,
  passwordService,
  flownsService,
  stakingService,
  proxyService,
} from 'background/service';
import BN from 'bignumber.js';
import { openIndexPage } from 'background/webapi/tab';
import { CacheState } from 'background/service/pageStateCache';
import i18n from 'background/service/i18n';
import { KEYRING_CLASS, DisplayedKeryring } from 'background/service/keyring';
import { openInternalPageInTab } from 'ui/utils/webapi';
import { isValidEthereumAddress } from 'ui/utils/address';
import BaseController from './base';
import { INTERNAL_REQUEST_ORIGIN, EVENTS, KEYRING_TYPE } from 'consts';
import { Account } from '../service/preference';
import { ConnectedSite } from '../service/permission';
import user, { UserInfoStore } from '../service/user';
import { CoinItem } from '../service/coinList';
import DisplayKeyring from '../service/keyring/display';
import provider from './provider';
import eventBus from '@/eventBus';
import { setPageStateCacheWhenPopupClose, getScripts } from 'background/utils';
import { withPrefix, getAccountKey } from 'ui/utils/address';
import * as t from '@onflow/types';
import * as fcl from '@onflow/fcl';
import {
  fclTestnetConfig,
  fclMainnetConfig,
} from '../fclConfig';
import { notification, storage } from 'background/webapi';
import { NFTData, NFTModel } from '../service/networkModel';
import fetchConfig from 'background/utils/remoteConfig';
import defaultConfig from '../utils/defaultConfig.json';
import { getApp } from 'firebase/app';
import { getAuth } from '@firebase/auth';
import testnetCodes from '../service/swap/swap.deploy.config.testnet.json';
import mainnetCodes from '../service/swap/swap.deploy.config.mainnet.json';
import { pk2PubKey, seed2PubKey, formPubKey } from '../../ui/utils/modules/passkey';
import { getHashAlgo, getSignAlgo, getStoragedAccount } from 'ui/utils';
import emoji from 'background/utils/emoji.json';
import placeholder from 'ui/FRWAssets/image/placeholder.png';
import { F } from 'ts-toolbelt';
import web3 from 'web3';


const stashKeyrings: Record<string, any> = {};

export class WalletController extends BaseController {

  openapi = openapiService;

  /* wallet */
  boot = (password) => keyringService.boot(password);
  isBooted = () => keyringService.isBooted();
  loadMemStore = () => keyringService.loadMemStore();
  verifyPassword = (password: string) =>
    keyringService.verifyPassword(password);

  // requestETHRpc = (data: { method: string; params: any }, chainId: string) => {
  //   return providerController.ethRpc(
  //     {
  //       data,
  //       session: {
  //         name: 'Flow',
  //         origin: INTERNAL_REQUEST_ORIGIN,
  //         icon: './images/icon-128.png',
  //       },
  //     },
  //     chainId
  //   );
  // };

  sendRequest = (data) => {
    return provider({
      data,
      session: {
        name: 'Flow Wallet',
        origin: INTERNAL_REQUEST_ORIGIN,
        icon: './images/icon-128.png',
      },
    });
  };

  getApproval = notificationService.getApproval;
  resolveApproval = notificationService.resolveApproval;
  rejectApproval = notificationService.rejectApproval;

  // initAlianNames = async () => {
  //   await preferenceService.changeInitAlianNameStatus();
  //   const keyrings = await keyringService.getAllTypedAccounts();
  //   const walletConnectKeyrings = keyrings.filter(
  //     (item) => item.type === 'WalletConnect'
  //   );
  //   const catergoryGroupAccount = keyrings.map((item) => ({
  //     type: item.type,
  //     accounts: item.accounts,
  //   }));
  //   let walletConnectList: DisplayedKeryring['accounts'] = [];
  //   for (let i = 0; i < walletConnectKeyrings.length; i++) {
  //     const keyring = walletConnectKeyrings[i];
  //     walletConnectList = [...walletConnectList, ...keyring.accounts];
  //   }
  //   const groupedWalletConnectList = groupBy(walletConnectList, 'brandName');
  //   if (keyrings.length > 0) {
  //     console.log(
  //       keyrings,
  //       'keyrings',
  //       groupedWalletConnectList,
  //       '==================='
  //     );
  //     // Object.keys(groupedWalletConnectList).forEach((key) => {
  //     //   groupedWalletConnectList[key].map((acc, index) => {
  //     //     this.updateAlianName(
  //     //       acc?.address,
  //     //       `${WALLET_BRAND_CONTENT[acc?.brandName]} ${index + 1}`
  //     //     );
  //     //   });
  //     // });
  //     const catergories = groupBy(
  //       catergoryGroupAccount.filter((group) => group.type !== 'WalletConnect'),
  //       'type'
  //     );
  //     const result = Object.keys(catergories)
  //       .map((key) =>
  //         catergories[key].map((item) =>
  //           item.accounts.map((acc) => ({
  //             address: acc.address,
  //             type: key,
  //           }))
  //         )
  //       )
  //       .map((item) => item.flat(1));
  //     result.forEach((group) =>
  //       group.forEach((acc, index) => {
  //         this.updateAlianName(
  //           acc?.address,
  //           `${BRAND_ALIAN_TYPE_TEXT[acc?.type]} ${index + 1}`
  //         );
  //       })
  //     );
  //   }
  // };

  unlock = async (password: string) => {
    console.log('unlocking --- ')
    // const alianNameInited = await preferenceService.getInitAlianNameStatus();
    // const alianNames = await preferenceService.getAllAlianName();
    await keyringService.submitPassword(password);

    // only password is correct then we store it
    await passwordService.setPassword(password);

    sessionService.broadcastEvent('unlock');
    // if (!alianNameInited && Object.values(alianNames).length === 0) {
    //   this.initAlianNames();
    // }
  };

  switchUnlock = async (password: string) => {
    // const alianNameInited = await preferenceService.getInitAlianNameStatus();
    // const alianNames = await preferenceService.getAllAlianName();

    await keyringService.submitPassword(password);

    // only password is correct then we store it
    await passwordService.setPassword(password);
    const pubKey = await this.getPubKey();
    await userWalletService.switchLogin(pubKey);

    sessionService.broadcastEvent('unlock');
    // if (!alianNameInited && Object.values(alianNames).length === 0) {
    //   this.initAlianNames();
    // }
  };

  retrievePk = async (password: string) => {
    // const alianNameInited = await preferenceService.getInitAlianNameStatus();
    // const alianNames = await preferenceService.getAllAlianName();
    const pk = await keyringService.retrievePk(password);
    return pk;
    // if (!alianNameInited && Object.values(alianNames).length === 0) {
    //   this.initAlianNames();
    // }
  };

  extractKeys = (keyrings) => {
    let privateKeyHex, publicKeyHex;

    for (const keyring of keyrings) {
      if (keyring.type === 'Simple Key Pair' && keyring.wallets?.length > 0) {
        const privateKeyData = keyring.wallets[0].privateKey.data;
        privateKeyHex = Buffer.from(privateKeyData).toString('hex');
        const publicKeyData = keyring.wallets[0].publicKey.data;
        publicKeyHex = Buffer.from(publicKeyData).toString('hex');
        break;
      } else if (keyring.type === 'HD Key Tree') {
        const activeIndex = keyring.activeIndexes?.[0];
        if (activeIndex !== undefined) {
          const wallet = keyring._index2wallet?.[activeIndex.toString()];
          if (wallet) {
            const privateKeyData = wallet.privateKey.data;
            privateKeyHex = Buffer.from(privateKeyData).toString('hex');
            const publicKeyData = wallet.publicKey.data;
            publicKeyHex = Buffer.from(publicKeyData).toString('hex');
            break;
          }
        }
      }
    }

    return { privateKeyHex, publicKeyHex };
  };

  isUnlocked = async () => {
    const isUnlocked = keyringService.memStore.getState().isUnlocked;
    if (!isUnlocked) {
      let password = '';
      try {
        password = await passwordService.getPassword();
      } catch (err) {
        password = '';
      }
      if (password && password.length > 0) {
        try {
          await this.unlock(password);
          return keyringService.memStore.getState().isUnlocked;
        } catch (err) {
          await passwordService.clear();
          return false;
        }
      }
    }
    return isUnlocked;
  };

  lockWallet = async () => {
    await keyringService.setLocked();
    await passwordService.clear();
    sessionService.broadcastEvent('accountsChanged', []);
    sessionService.broadcastEvent('lock');
  };

  // lockadd here
  lockAdd = async () => {
    const switchingTo =
      process.env.NODE_ENV === 'production' ? 'mainnet' : 'testnet';

    const password = keyringService.getPassword();
    await storage.set('tempPassword', password);
    await keyringService.setLocked();
    await passwordService.clear();
    sessionService.broadcastEvent('accountsChanged', []);
    sessionService.broadcastEvent('lock');
    openInternalPageInTab('addwelcome', true);
    await this.switchNetwork(switchingTo);
    window.close();
  };

  // lockadd here
  resetPwd = async () => {
    const switchingTo =
      process.env.NODE_ENV === 'production' ? 'mainnet' : 'testnet';
    await storage.clear();

    await keyringService.resetKeyRing();
    await keyringService.setLocked();
    await passwordService.clear();
    sessionService.broadcastEvent('accountsChanged', []);
    sessionService.broadcastEvent('lock');
    openInternalPageInTab('reset', true);
    await this.switchNetwork(switchingTo);
    window.close();
  };

  // lockadd here
  restoreWallet = async () => {
    const switchingTo =
      process.env.NODE_ENV === 'production' ? 'mainnet' : 'testnet';

    const password = keyringService.getPassword();
    await storage.set('tempPassword', password);
    await keyringService.setLocked();
    await passwordService.clear();

    sessionService.broadcastEvent('accountsChanged', []);
    sessionService.broadcastEvent('lock');
    openInternalPageInTab('restore', true);
    await this.switchNetwork(switchingTo);
    window.close();
  };

  setPopupOpen = (isOpen) => {
    preferenceService.setPopupOpen(isOpen);
  };
  openIndexPage = openIndexPage;

  hasPageStateCache = () => pageStateCacheService.has();
  getPageStateCache = () => {
    if (!this.isUnlocked()) return null;
    return pageStateCacheService.get();
  };
  clearPageStateCache = () => pageStateCacheService.clear();
  setPageStateCache = (cache: CacheState) => pageStateCacheService.set(cache);

  getAddressBalance = async (address: string) => {
    const data = await openapiService.getCoinList(address);
    preferenceService.updateAddressBalance(address, data);
    return data;
  };
  getAddressCacheBalance = (address: string | undefined) => {
    if (!address) return null;
    return preferenceService.getAddressBalance(address);
  };

  setHasOtherProvider = (val: boolean) =>
    preferenceService.setHasOtherProvider(val);
  getHasOtherProvider = () => preferenceService.getHasOtherProvider();

  getExternalLinkAck = () => preferenceService.getExternalLinkAck();

  setExternalLinkAck = (ack) => preferenceService.setExternalLinkAck(ack);

  getLocale = () => preferenceService.getLocale();
  setLocale = (locale: string) => preferenceService.setLocale(locale);

  getLastTimeSendToken = (address: string) =>
    preferenceService.getLastTimeSendToken(address);
  setLastTimeSendToken = (address: string, token: any) =>
    preferenceService.setLastTimeSendToken(address, token);

  /* chains */
  getSavedChains = () => preferenceService.getSavedChains();
  saveChain = (id: string) => preferenceService.saveChain(id);
  updateChain = (list: string[]) => preferenceService.updateChain(list);
  /* connectedSites */

  getConnectedSite = permissionService.getConnectedSite;
  getConnectedSites = permissionService.getConnectedSites;
  setRecentConnectedSites = (sites: ConnectedSite[]) => {
    permissionService.setRecentConnectedSites(sites);
  };
  getRecentConnectedSites = () => {
    return permissionService.getRecentConnectedSites();
  };
  getCurrentConnectedSite = (tabId: number) => {
    const { origin } = sessionService.getSession(tabId) || {};
    return permissionService.getWithoutUpdate(origin);
  };
  updateConnectSite = (origin: string, data: ConnectedSite) => {
    permissionService.updateConnectSite(origin, data);
    // sessionService.broadcastEvent(
    //   'chainChanged',
    //   {
    //     chain: CHAINS[data.chain].hex,
    //     networkVersion: CHAINS[data.chain].network,
    //   },
    //   data.origin
    // );
  };
  removeConnectedSite = (origin: string) => {
    sessionService.broadcastEvent('accountsChanged', [], origin);
    permissionService.removeConnectedSite(origin);
  };
  // getSitesByDefaultChain = permissionService.getSitesByDefaultChain;
  topConnectedSite = (origin: string) =>
    permissionService.topConnectedSite(origin);
  unpinConnectedSite = (origin: string) =>
    permissionService.unpinConnectedSite(origin);
  /* keyrings */

  clearKeyrings = () => keyringService.clearKeyrings();

  getPrivateKey = async (
    password: string,
    address: string
  ) => {
    await this.verifyPassword(password);
    const keyring = await keyringService.getKeyringForAccount(address);
    if (!keyring) return null;
    return await keyring.exportAccount(address);
  };

  getMnemonics = async (password: string) => {
    await this.verifyPassword(password);
    const keyring = this._getKeyringByType(KEYRING_CLASS.MNEMONIC);
    const serialized = await keyring.serialize();
    const seedWords = serialized.mnemonic;
    return seedWords;
  };

  checkMnemonics = async () => {
    const keyring = this._getKeyringByType(KEYRING_CLASS.MNEMONIC);
    const serialized = await keyring.serialize();
    if (serialized) {
      return true;
    }
    return false;
  };

  getKey = async (password) => {
    let privateKey;
    const keyrings = await this.getKeyrings(password || '');

    for (const keyring of keyrings) {
      if (keyring.mnemonic) {
        const mnemonic = await this.getMnemonics(password || '');
        const seed = await seed2PubKey(mnemonic);
        const PK1 = seed.P256.pk;
        const PK2 = seed.SECP256K1.pk;

        const account = await getStoragedAccount();
        // if (accountIndex < 0 || accountIndex >= loggedInAccounts.length) {
        //   throw new Error("Invalid account index.");
        // }
        // const account = loggedInAccounts[accountIndex];
        const signAlgo =
          typeof account.signAlgo === 'string'
            ? getSignAlgo(account.signAlgo)
            : account.signAlgo;
        privateKey = signAlgo === 1 ? PK1 : PK2;
        break;
      } else if (
        keyring.wallets &&
        keyring.wallets.length > 0 &&
        keyring.wallets[0].privateKey
      ) {
        privateKey = keyrings[0].wallets[0].privateKey.toString('hex');
        break;
      }
    }
    if (!privateKey) {
      const error = new Error(
        'No mnemonic or private key found in any of the keyrings.'
      );
      throw error;
    }
    return privateKey;
  };

  getPubKey = async () => {
    let privateKey;
    let pubKTuple;
    const keyrings = await keyringService.getKeyring();
    for (const keyring of keyrings) {
      if (
        keyring.type === 'Simple Key Pair'
      ) {
        // If a private key is found, extract it and break the loop
        privateKey = keyring.wallets[0].privateKey.toString('hex');
        pubKTuple = await pk2PubKey(privateKey);
        break;
      } else if (keyring.activeIndexes[0] === 1) {
        // If publicKey is found, extract it and break the loop
        const serialized = await keyring.serialize();
        const publicKey = serialized.publicKey;
        pubKTuple = await formPubKey(publicKey);
        break;
      } else if (keyring.mnemonic) {
        // If mnemonic is found, extract it and break the loop
        const serialized = await keyring.serialize();
        const mnemonic = serialized.mnemonic;
        pubKTuple = await seed2PubKey(mnemonic);
        break;
      } else if (
        keyring.wallets &&
        keyring.wallets.length > 0 &&
        keyring.wallets[0].privateKey
      ) {
        // If a private key is found, extract it and break the loop
        privateKey = keyring.wallets[0].privateKey.toString('hex');
        pubKTuple = await pk2PubKey(privateKey);
        break;
      }
    }

    if (!pubKTuple) {
      const error = new Error(
        'No mnemonic or private key found in any of the keyrings.'
      );
      throw error;
    }
    return pubKTuple;
  };

  importPrivateKey = async (data) => {
    const privateKey = ethUtil.stripHexPrefix(data);
    const buffer = Buffer.from(privateKey, 'hex');

    const error = new Error(i18n.t('the private key is invalid'));
    try {
      if (!ethUtil.isValidPrivate(buffer)) {
        throw error;
      }
    } catch {
      throw error;
    }

    const keyring = await keyringService.importPrivateKey(privateKey);
    return this._setCurrentAccountFromKeyring(keyring);
  };

  getPreMnemonics = () => keyringService.getPreMnemonics();
  generatePreMnemonic = () => keyringService.generatePreMnemonic();
  removePreMnemonics = () => keyringService.removePreMnemonics();
  createKeyringWithMnemonics = async (mnemonic) => {
    // TODO: NEED REVISIT HERE:
    await keyringService.clearKeyrings();

    const keyring = await keyringService.createKeyringWithMnemonics(mnemonic);
    keyringService.removePreMnemonics();
    return this._setCurrentAccountFromKeyring(keyring);
  };

  createKeyringWithProxy = async (publicKey, mnemonic) => {
    // TODO: NEED REVISIT HERE:
    await keyringService.clearKeyrings();

    const keyring = await keyringService.importPublicKey(publicKey, mnemonic);
    keyringService.removePreMnemonics();
    return this._setCurrentAccountFromKeyring(keyring);
  };

  addAccounts = async (mnemonic) => {
    // TODO: NEED REVISIT HERE:

    const keyring = await keyringService.createKeyringWithMnemonics(mnemonic);
    keyringService.removePreMnemonics();
    return this._setCurrentAccountFromKeyring(keyring);
  };

  getHiddenAddresses = () => preferenceService.getHiddenAddresses();
  showAddress = (type: string, address: string) =>
    preferenceService.showAddress(type, address);
  hideAddress = (type: string, address: string, brandName: string) => {
    preferenceService.hideAddress(type, address, brandName);
    const current = preferenceService.getCurrentAccount();
    if (current?.address === address && current.type === type) {
      this.resetCurrentAccount();
    }
  };

  removeAddress = async (address: string, type: string, brand?: string) => {
    await keyringService.removeAccount(address, type, brand);
    preferenceService.removeAddressBalance(address);
    const current = preferenceService.getCurrentAccount();
    if (
      current?.address === address &&
      current.type === type &&
      current.brandName === brand
    ) {
      this.resetCurrentAccount();
    }
  };

  resetCurrentAccount = async () => {
    const [account] = await this.getAccounts();
    if (account) {
      preferenceService.setCurrentAccount(account);
    } else {
      preferenceService.setCurrentAccount(null);
    }
  };

  addKeyring = async (keyringId) => {
    const keyring = stashKeyrings[keyringId];
    if (keyring) {
      await keyringService.addKeyring(keyring);
      this._setCurrentAccountFromKeyring(keyring);
    } else {
      throw new Error('failed to addKeyring, keyring is undefined');
    }
  };

  getKeyringByType = (type: string) => keyringService.getKeyringByType(type);

  checkHasMnemonic = () => {
    try {
      const keyring = this._getKeyringByType(KEYRING_CLASS.MNEMONIC);
      return !!keyring.mnemonic;
    } catch (e) {
      return false;
    }
  };

  deriveNewAccountFromMnemonic = async () => {
    const keyring = this._getKeyringByType(KEYRING_CLASS.MNEMONIC);

    const result = await keyringService.addNewAccount(keyring);
    this._setCurrentAccountFromKeyring(keyring, -1);
    return result;
  };

  getAccountsCount = async () => {
    const accounts = await keyringService.getAccounts();
    return accounts.filter((x) => x).length;
  };

  getKeyrings = async (password) => {
    await this.verifyPassword(password);
    const accounts = await keyringService.getKeyring();
    return accounts;
  };

  getTypedAccounts = async (type) => {
    return Promise.all(
      keyringService.keyrings
        .filter((keyring) => !type || keyring.type === type)
        .map((keyring) => keyringService.displayForKeyring(keyring))
    );
  };

  getAllVisibleAccounts: () => Promise<DisplayedKeryring[]> = async () => {
    const typedAccounts = await keyringService.getAllTypedVisibleAccounts();

    return typedAccounts.map((account) => ({
      ...account,
      keyring: new DisplayKeyring(account.keyring),
    }));
  };

  getAllVisibleAccountsArray: () => Promise<Account[]> = () => {
    return keyringService.getAllVisibleAccountsArray();
  };

  getAllClassAccounts: () => Promise<DisplayedKeryring[]> = async () => {
    const typedAccounts = await keyringService.getAllTypedAccounts();

    return typedAccounts.map((account) => ({
      ...account,
      keyring: new DisplayKeyring(account.keyring),
    }));
  };

  changeAccount = (account: Account) => {
    preferenceService.setCurrentAccount(account);
  };

  isUseLedgerLive = () => preferenceService.isUseLedgerLive();

  // updateUseLedgerLive = async (value: boolean) =>
  //   preferenceService.updateUseLedgerLive(value);

  connectHardware = async ({
    type,
    hdPath,
    needUnlock = false,
    isWebUSB = false,
  }: {
    type: string;
    hdPath?: string;
    needUnlock?: boolean;
    isWebUSB?: boolean;
  }) => {
    let keyring;
    let stashKeyringId: number | null = null;
    try {
      keyring = this._getKeyringByType(type);
    } catch {
      const Keyring = keyringService.getKeyringClassForType(type);
      keyring = new Keyring();
      stashKeyringId = Object.values(stashKeyrings).length;
      stashKeyrings[stashKeyringId] = keyring;
    }

    if (hdPath && keyring.setHdPath) {
      keyring.setHdPath(hdPath);
    }

    if (needUnlock) {
      await keyring.unlock();
    }

    if (keyring.useWebUSB) {
      keyring.useWebUSB(isWebUSB);
    }

    return stashKeyringId;
  };

  signPersonalMessage = async (
    type: string,
    from: string,
    data: string,
    options?: any
  ) => {
    const keyring = await keyringService.getKeyringForAccount(from, type);
    const res = await keyringService.signPersonalMessage(
      keyring,
      { from, data },
      options
    );
    if (type === KEYRING_TYPE.WalletConnectKeyring) {
      eventBus.emit(EVENTS.broadcastToUI, {
        method: EVENTS.SIGN_FINISHED,
        params: {
          success: true,
          data: res,
        },
      });
    }
    return res;
  };

  signTransaction = async (
    type: string,
    from: string,
    data: any,
    options?: any
  ) => {
    const keyring = await keyringService.getKeyringForAccount(from, type);
    return keyringService.signTransaction(keyring, data, options);
  };

  requestKeyring = (type, methodName, keyringId: number | null, ...params) => {
    let keyring;
    if (keyringId !== null && keyringId !== undefined) {
      keyring = stashKeyrings[keyringId];
    } else {
      try {
        keyring = this._getKeyringByType(type);
      } catch {
        const Keyring = keyringService.getKeyringClassForType(type);
        keyring = new Keyring();
      }
    }
    if (keyring[methodName]) {
      return keyring[methodName].call(keyring, ...params);
    }
  };

  unlockHardwareAccount = async (keyring, indexes, keyringId) => {
    let keyringInstance: any = null;
    try {
      keyringInstance = this._getKeyringByType(keyring);
    } catch (e) {
      // NOTHING
    }
    if (!keyringInstance && keyringId !== null && keyringId !== undefined) {
      await keyringService.addKeyring(stashKeyrings[keyringId]);
      keyringInstance = stashKeyrings[keyringId];
    }
    for (let i = 0; i < indexes.length; i++) {
      keyringInstance!.setAccountToUnlock(indexes[i]);
      await keyringService.addNewAccount(keyringInstance);
    }

    return this._setCurrentAccountFromKeyring(keyringInstance);
  };

  setIsDefaultWallet = (val: boolean) =>
    preferenceService.setIsDefaultWallet(val);
  isDefaultWallet = () => preferenceService.getIsDefaultWallet();

  private _getKeyringByType(type) {
    const keyring = keyringService.getKeyringsByType(type)[0];

    if (keyring) {
      return keyring;
    }

    throw ethErrors.rpc.internal(`No ${type} keyring found`);
  }

  private async _setCurrentAccountFromKeyring(keyring, index = 0) {
    const accounts = keyring.getAccountsWithBrand
      ? await keyring.getAccountsWithBrand()
      : await keyring.getAccounts();
    const account = accounts[index < 0 ? index + accounts.length : index];

    if (!account) {
      throw new Error('the current account is empty');
    }

    const _account = {
      address: typeof account === 'string' ? account : account.address,
      type: keyring.type,
      brandName: typeof account === 'string' ? keyring.type : account.brandName,
    };
    preferenceService.setCurrentAccount(_account);

    return [_account];
  }

  getHighlightWalletList = () => {
    return preferenceService.getWalletSavedList();
  };

  updateHighlightWalletList = (list) => {
    return preferenceService.updateWalletSavedList(list);
  };

  getAlianName = (address: string) => preferenceService.getAlianName(address);
  updateAlianName = (address: string, name: string) =>
    preferenceService.updateAlianName(address, name);
  getAllAlianName = () => preferenceService.getAllAlianName();
  // getInitAlianNameStatus = () => preferenceService.getInitAlianNameStatus();
  // updateInitAlianNameStatus = () =>
  //   preferenceService.changeInitAlianNameStatus();
  // getLastTimeGasSelection = (chainId) => {
  //   return preferenceService.getLastTimeGasSelection(chainId);
  // };

  // updateLastTimeGasSelection = (chainId: string, gas: ChainGas) => {
  //   return preferenceService.updateLastTimeGasSelection(chainId, gas);
  // };
  getIsFirstOpen = () => {
    return preferenceService.getIsFirstOpen();
  };
  updateIsFirstOpen = () => {
    return preferenceService.updateIsFirstOpen();
  };
  listChainAssets = async (address: string) => {
    return await openapiService.getCoinList(address);
  };
  // getAddedToken = (address: string) => {
  //   return preferenceService.getAddedToken(address);
  // };
  // updateAddedToken = (address: string, tokenList: []) => {
  //   return preferenceService.updateAddedToken(address, tokenList);
  // };

  // lilico new service

  // userinfo
  getUserInfo = async (forceRefresh: boolean) => {
    const data = await userInfoService.getUserInfo();

    if (forceRefresh) {
      return await this.fetchUserInfo();
    }

    if (data.username.length) {
      return data;
    }

    return await this.fetchUserInfo();
  };

  fetchUserInfo = async () => {
    const result = await openapiService.userInfo();
    const info = result['data'];
    const avatar = this.addTokenForFirebaseImage(info.avatar);

    const updatedUrl = this.replaceAvatarUrl(avatar);

    info.avatar = updatedUrl;
    userInfoService.addUserInfo(info);
    return info;
  };

  replaceAvatarUrl = (url) => {
    const baseUrl = "https://source.boringavatars.com/";
    const newBaseUrl = "https://lilico.app/api/avatar/";

    if (url.startsWith(baseUrl)) {
      return url.replace(baseUrl, newBaseUrl);
    }

    return url;
  }

  addTokenForFirebaseImage = (avatar: string): string => {
    if (!avatar) {
      return avatar;
    }
    try {
      const url = new URL(avatar);
      if (url.host === 'firebasestorage.googleapis.com') {
        url.searchParams.append('alt', 'media');
        return url.toString();
      }
      return avatar;
    } catch (err) {
      console.log(err);
      return avatar;
    }
  };

  checkUserDomain = async (username: string) => {
    const res = await openapiService.getFlownsAddress(username, 'meow');
    const network = await this.getNetwork();

    if (res) {
      await userInfoService.setMeow(username + '.meow', network);
    }
  };

  checkUserChildAccount = async () => {
    const cacheKey = 'checkUserChildAccount';
    const ttl = 5 * 60 * 1000; // 5 minutes in milliseconds

    // Try to get the cached result
    let meta = await storage.getExpiry(cacheKey);
    if (!meta) {
      try {
        const network = await this.getNetwork();
        let result = {};
        const address = await userWalletService.getMainWallet(network);
        result = await openapiService.checkChildAccountMeta(address);

        if (result) {
          meta = result;

          // Store the result in the cache with an expiry
          await storage.setExpiry(cacheKey, meta, ttl);
        }
      } catch (error) {
        console.error('Error occurred:', error);
        return {}; // Return an empty object in case of an error
      }
    }

    return meta;
  };

  checkAccessibleNft = async (childAccount) => {
    try {

      // const res = await openapiService.checkChildAccount(address);
      // const nfts = await openapiService.queryAccessible(
      //   '0x84221fe0294044d7',
      //   '0x16c41a2b76dee69b'
      // );
      const nfts = await openapiService.checkChildAccountNFT(childAccount);
      // openapiService.checkChildAccountNFT(address).then((res) => {
      //   console.log(res)
      // }).catch((err) => {
      //   console.log(err)
      // })

      return nfts;
    } catch (error) {
      console.log(error, 'error ===')
      return []
    }

  };

  checkAccessibleFt = async (childAccount) => {
    const network = await this.getNetwork();

    const address = await userWalletService.getMainWallet(network);
    // const res = await openapiService.checkChildAccount(address);
    const result = await openapiService.queryAccessibleFt(
      address,
      childAccount
    );
    // openapiService.checkChildAccountNFT(address).then((res) => {
    //   console.log(res)
    // }).catch((err) => {
    //   console.log(err)
    // })

    return result;
  };

  getMainWallet = async () => {
    const network = await this.getNetwork();
    const address = await userWalletService.getMainWallet(network);

    return address;
  }

  fetchFlownsInbox = async () => {
    const info = await userInfoService.getUserInfo();
    const res = await openapiService.getFlownsInbox(info.username);

    return res;
  };

  setPopStat = async (stat: boolean) => {
    const network = await this.getNetwork();
    flownsService.setPop(network, stat);
  };

  fetchPopStat = async () => {
    const network = await this.getNetwork();
    const popStat = await flownsService.getPop(network);
    return popStat;
  };

  fetchUserDomain = async () => {
    const network = await this.getNetwork();
    const domain = await userInfoService.getMeow(network);
    return domain;
  };

  updateUserInfo = (data: UserInfoStore) => {
    userInfoService.updateUserInfo(data);
  };

  removeUserInfo = () => {
    userInfoService.removeUserInfo();
  };

  getDashIndex = async () => {
    const dashIndex = await userInfoService.getDashIndex();
    return dashIndex;
  };

  setDashIndex = (data: number) => {
    userInfoService.setDashIndex(data);
  };

  //coinList
  getCoinList = async (_expiry = 5000): Promise<CoinItem[]> => {
    const network = await this.getNetwork();
    const now = new Date();
    const expiry = coinListService.getExpiry();
    let childType = await userWalletService.getActiveWallet();
    childType = childType === 'evm' ? 'evm' : 'coinItem';
    // compare the expiry time of the item with the current time
    if (now.getTime() > expiry) {
      if (childType === 'evm') {
        await this.refreshEvmList(_expiry);
      } else {
        await this.refreshCoinList(_expiry);
      }
    }
    const listCoins = coinListService.listCoins(network, childType);
    return listCoins;
  };

  private tokenPrice = async (tokenSymbol: string, address: string, data, contractName: string,) => {
    const token = tokenSymbol.toLowerCase();
    const key = contractName.toLowerCase() + '' + address.toLowerCase();
    const price = await openapiService.getPricesByKey(key, data);

    switch (token) {
      case 'flow': {
        const flowTokenPrice = await storage.getExpiry('flowTokenPrice');
        if (flowTokenPrice) {
          return flowTokenPrice;
        } else {
          const result = await openapiService.getTokenPrice('flow');
          await storage.setExpiry('flowTokenPrice', result, 300000); // 5 minutes in milliseconds
          return result;
        }
      }
      case 'usdc':
        return await openapiService.getUSDCPrice();
      case 'fusd':
        return Promise.resolve({
          price: { last: '1.0', change: { percentage: '0.0' } },
        });
      default:
        if (price) {
          return { price: { last: price, change: { percentage: '0.0' } } };
        } else {
          return null;
        }
    }
  };

  private evmtokenPrice = async (tokeninfo, data) => {
    const token = tokeninfo.symbol.toLowerCase();
    const price = await openapiService.getPricesByEvmaddress(tokeninfo.address, data);

    switch (token) {
      case 'flow': {
        const flowTokenPrice = await storage.getExpiry('flowTokenPrice');
        if (flowTokenPrice) {
          return flowTokenPrice;
        } else {
          const result = await openapiService.getTokenPrice('flow');
          await storage.setExpiry('flowTokenPrice', result, 300000); // 5 minutes in milliseconds
          return result;
        }
      }
      case 'usdc':
        return await openapiService.getUSDCPrice();
      case 'fusd':
        return Promise.resolve({
          price: { last: '1.0', change: { percentage: '0.0' } },
        });
      default:
        if (price) {
          return { price: { last: price, change: { percentage: '0.0' } } };
        } else {
          return null;
        }
    }
  };

  refreshCoinList = async (_expiry = 5000, { signal } = { signal: new AbortController().signal }) => {
    try {


      const network = await this.getNetwork();
      const now = new Date();
      const exp = _expiry + now.getTime();
      coinListService.setExpiry(exp);

      const address = await this.getCurrentAddress();
      const tokenList = await openapiService.getEnabledTokenList(network);

      let allBalanceMap;
      try {
        allBalanceMap = await openapiService.getTokenListBalance(address || '0x', tokenList);
      } catch (error) {
        console.error('Error refresh token list balance:', error);
        throw new Error('Failed to refresh token list balance');
      }
      const data = await openapiService.getTokenPrices();
      // Map over tokenList to get prices and handle errors individually
      const pricesPromises = tokenList.map(async (token) => {
        try {
          if (Object.keys(data).length === 0 && data.constructor === Object) {
            return { price: { last: '0.0', change: { percentage: '0.0' } } }
          } else {
            return await this.tokenPrice(token.symbol, token.address, data, token.contractName);
          }
        } catch (error) {
          console.error(`Error fetching price for token ${token.address}:`, error);
          return null;
        }
      });

      const pricesResults = await Promise.allSettled(pricesPromises);


      // Extract fulfilled prices
      const allPrice = pricesResults.map(result => result.status === 'fulfilled' ? result.value : null);

      const coins = tokenList.map((token, index) => {
        const tokenId = `A.${token.address.slice(2)}.${token.contractName}`;
        return {
          coin: token.name,
          unit: token.symbol,
          icon: token['logoURI'] || '',
          balance: parseFloat(parseFloat(allBalanceMap[tokenId]).toFixed(8)),
          price: allPrice[index] === null ? 0 : new BN(allPrice[index].price.last).toNumber(),
          change24h: allPrice[index] === null || !allPrice[index].price || !allPrice[index].price.change
            ? 0
            : new BN(allPrice[index].price.change.percentage).multipliedBy(100).toNumber(),
          total: allPrice[index] === null ? 0 : this.currencyBalance(allBalanceMap[tokenId], allPrice[index].price.last),
        };
      });
      coins.sort((a, b) => {
        if (b.total === a.total) {
          return b.balance - a.balance;
        } else {
          return b.total - a.total;
        }
      });

      // Add all coins at once
      if (signal.aborted) throw new Error('Operation aborted');
      coinListService.addCoins(coins, network);

      // const allTokens = await openapiService.getAllTokenInfo();
      // const enabledSymbols = tokenList.map((token) => token.symbol);
      // const disableSymbols = allTokens.map((token) => token.symbol).filter((symbol) => !enabledSymbols.includes(symbol));
      // console.log('disableSymbols are these ', disableSymbols, enabledSymbols, coins)
      // disableSymbols.forEach((coin) => coinListService.removeCoin(coin, network));
      const coinListResult = coinListService.listCoins(network);
      return coinListResult;
    } catch (err) {
      if (err.message === 'Operation aborted') {
        console.log('refreshCoinList operation aborted.');
      } else {
        console.error('refreshCoinList encountered an error:', err);
      }
      throw err;
    }
  };

  fetchTokenList = async (_expiry = 5000, { signal } = { signal: new AbortController().signal }) => {
    const network = await this.getNetwork();
    try {
      const now = new Date();
      const exp = _expiry + now.getTime();
      coinListService.setExpiry(exp);

      const tokenList = await openapiService.getEnabledTokenList(network);
      return tokenList;
    } catch (err) {
      if (err.message === 'Operation aborted') {
        console.log('fetchTokenList operation aborted.');
      } else {
        console.error('fetchTokenList encountered an error:', err);
      }
      throw err;
    }
  }

  fetchBalance = async ({ signal } = { signal: new AbortController().signal }) => {


    const network = await this.getNetwork();
    const tokenList = await openapiService.getEnabledTokenList(network);
    try {
      const address = await this.getCurrentAddress();
      let allBalanceMap;

      try {
        allBalanceMap = await openapiService.getTokenListBalance(address || '0x', tokenList);
      } catch (error) {
        console.error('Error fetching token list balance:', error);
        throw new Error('Failed to fetch token list balance');
      }

      const data = await openapiService.getTokenPrices();

      // Map over tokenList to get prices and handle errors individually
      const pricesPromises = tokenList.map(async (token) => {
        try {
          return await this.tokenPrice(token.symbol, token.address, data, token.contractName);
        } catch (error) {
          console.error(`Error fetching price for token ${token.symbol}:`, error);
          return null;
        }
      });

      const pricesResults = await Promise.allSettled(pricesPromises);

      // Extract fulfilled prices
      const allPrice = pricesResults.map(result => result.status === 'fulfilled' ? result.value : null);

      const coins = tokenList.map((token, index) => {
        const tokenId = `A.${token.address.slice(2)}.${token.contractName}`;
        return {
          coin: token.name,
          unit: token.symbol,
          icon: token['logoURI'] || '',
          balance: parseFloat(parseFloat(allBalanceMap[tokenId]).toFixed(8)),
          price: allPrice[index] === null ? 0 : new BN(allPrice[index].price.last).toNumber(),
          change24h: allPrice[index] === null || !allPrice[index].price || !allPrice[index].price.change
            ? 0
            : new BN(allPrice[index].price.change.percentage).multipliedBy(100).toNumber(),
          total: allPrice[index] === null ? 0 : this.currencyBalance(allBalanceMap[tokenId], allPrice[index].price.last),
        };
      });
      coins.sort((a, b) => {
        if (b.total === a.total) {
          return b.balance - a.balance;
        } else {
          return b.total - a.total;
        }
      });

      // Add all coins at once
      if (signal.aborted) throw new Error('Operation aborted');

      coinListService.addCoins(coins, network);
      return coins;
    } catch (err) {
      if (err.message === 'Operation aborted') {
        console.log('fetchBalance operation aborted.');
      } else {
        console.error('fetchBalance encountered an error:', err);
      }
      throw err;
    }
  }

  fetchCoinList = async (_expiry = 5000, { signal } = { signal: new AbortController().signal }) => {

    const network = await this.getNetwork();
    try {
      await this.fetchTokenList(_expiry, { signal });
      await this.fetchBalance({ signal });

      // const allTokens = await openapiService.getAllTokenInfo();
      // const enabledSymbols = tokenList.map((token) => token.symbol);
      // const disableSymbols = allTokens.map((token) => token.symbol).filter((symbol) => !enabledSymbols.includes(symbol));
      // console.log('disableSymbols are these ', disableSymbols, enabledSymbols, coins)
      // disableSymbols.forEach((coin) => coinListService.removeCoin(coin, network));

      const coinListResult = coinListService.listCoins(network);
      return coinListResult;
    } catch (err) {
      if (err.message === 'Operation aborted') {
        console.log('refreshCoinList operation aborted.');
      } else {
        console.error('fetch coinlist encountered an error:', err);
      }
      throw err;
    }
  }



  refreshEvmList = async (_expiry = 5000) => {
    const now = new Date();
    const exp = _expiry + now.getTime();
    coinListService.setExpiry(exp);
    const evmCustomToken = await storage.get('evmCustomToken') || [];

    const network = await this.getNetwork();

    const tokenList = await openapiService.getTokenListFromGithub(network);

    const address = await this.getEvmAddress();
    if (!isValidEthereumAddress(address)) {

      return new Error("Invalid Ethereum address in coinlist");
    }

    const allBalanceMap = await openapiService.getEvmFT(
      address || '0x',
      network
    );

    const flowBalance = await this.getBalance(address);


    const mergeBalances = (tokenList, allBalanceMap, flowBalance) => {
      return tokenList.map(token => {
        const balanceInfo = allBalanceMap.find(balance => {
          return balance.address.toLowerCase() === token.address.toLowerCase();
        });
        let balance = balanceInfo ? (Number(balanceInfo.balance) / Math.pow(10, balanceInfo.decimals)) : 0;
        // If the token unit is 'flow', set the balance to flowBalance
        if (token.symbol.toLowerCase() === 'flow') {
          balance = flowBalance / 1e18;
        }

        return {
          ...token,
          balance
        };
      });
    };


    const customToken = (mergedList, evmCustomToken) => {
      return mergedList.map(token => {
        const balanceInfo = evmCustomToken.find(customToken => {
          return customToken.address.toLowerCase() === token.address.toLowerCase();
        });

        const custom = balanceInfo ? true : false;

        return {
          ...token,
          custom
        };
      });
    };


    let mergedList = await mergeBalances(tokenList, allBalanceMap, flowBalance);
    mergedList = await customToken(mergedList, evmCustomToken);
    const data = await openapiService.getTokenEvmPrices();
    const prices = tokenList.map((token) => this.evmtokenPrice(token, data));

    const allPrice = await Promise.all(prices);
    const coins: CoinItem[] = mergedList.map((token, index) => {
      return {
        coin: token.name,
        unit: token.symbol,
        icon: token['logoURI'] || placeholder,
        balance: parseFloat(token.balance),
        price:
          allPrice[index] === null
            ? 0
            : new BN(allPrice[index].price.last).toNumber(),
        change24h:
          allPrice[index] === null ||
            !allPrice[index].price ||
            !allPrice[index].price.change
            ? 0
            : new BN(allPrice[index].price.change.percentage)
              .multipliedBy(100)
              .toNumber(),
        total:
          allPrice[index] === null
            ? 0
            : this.currencyBalance(
              token.balance,
              allPrice[index].price.last
            ),
        custom: token.custom
      };
    });
    console.log('mergeBalances ', mergedList, coins, tokenList, evmCustomToken)


    coins
      .sort((a, b) => {
        if (b.total === a.total) {
          return b.balance - a.balance;
        } else {
          return b.total - a.total;
        }
      })
      .map((coin) => coinListService.addCoin(coin, network, 'evm'));

    return coinListService.listCoins(network, 'evm');
  };

  reqeustEvmNft = async () => {
    const address = await this.getEvmAddress();
    const evmList = await openapiService.EvmNFTID(address);
    return evmList;
  };

  EvmNFTcollectionList = async (collection) => {
    const address = await this.getEvmAddress();
    const evmList = await openapiService.EvmNFTcollectionList(address, collection);
    return evmList;
  };

  reqeustEvmNftList = async () => {

    try {
      // Check if the nftList is already in storage and not expired
      const cachedNFTList = await storage.getExpiry('evmnftList');
      if (cachedNFTList) {
        return cachedNFTList;
      } else {
        // Fetch the nftList from the API
        const nftList = await openapiService.evmNFTList();
        // Cache the nftList with a one-hour expiry (3600000 milliseconds)
        await storage.setExpiry('evmnftList', nftList, 3600000);
        return nftList;
      }
    } catch (error) {
      console.error('Error fetching NFT list:', error);
      throw error;
    }
  };

  fetchPreviewNetNft = async () => {

    try {
      // Check if the nftList is already in storage and not expired
      const cachedNFTList = await storage.getExpiry('previewNetNftList');
      if (cachedNFTList) {
        return cachedNFTList;
      } else {
        // Fetch the nftList from the API

        const network = await this.getNetwork();
        const response = await fetch(
          `https://raw.githubusercontent.com/Outblock/token-list-jsons/outblock/jsons/${network}/flow/nfts.json`
        );
        const res = await response.json();
        console.log('nftList ', res)
        const nftList = res.tokens;
        // Cache the nftList with a one-hour expiry (3600000 milliseconds)
        await storage.setExpiry('previewNetNftList', nftList, 3600000);
        return nftList;
      }
    } catch (error) {
      console.error('Error fetching NFT list:', error);
      throw error;
    }
  };


  requestCadenceNft = async () => {
    const network = await this.getNetwork();
    const address = await this.getCurrentAddress();
    const NFTList = await openapiService.getNFTCadenceList(address!, network);
    return NFTList;
  };


  requestMainNft = async () => {
    const network = await this.getNetwork();
    const address = await this.getCurrentAddress();
    const NFTList = await openapiService.getNFTCadenceList(address!, network);
    return NFTList;
  };

  requestCollectionInfo = async (identifier) => {
    const network = await this.getNetwork();
    const address = await this.getCurrentAddress();
    const NFTCollection = await openapiService.getNFTCadenceCollection(address!, network, identifier);
    return NFTCollection;
  };

  private currencyBalance = (balance, price) => {
    const bnBalance = new BN(balance);
    const currencyBalance = bnBalance.times(new BN(price));
    return currencyBalance.toNumber();
  };

  setCurrentCoin = async (coinName: string) => {
    await coinListService.setCurrentCoin(coinName);
  };

  getCurrentCoin = async () => {
    return await coinListService.getCurrentCoin();
  };
  // addressBook
  setRecent = async (data) => {
    const network = await this.getNetwork();
    addressBookService.setRecent(data, network);
  };

  getRecent = async () => {
    const network = await this.getNetwork();
    return addressBookService.getRecent(network);
  };

  getAddressBook = async () => {
    const network = await this.getNetwork();
    const addressBook = await addressBookService.getAddresBook(network);
    if (!addressBook) {
      return await this.refreshAddressBook();
    } else if (!addressBook[0]) {
      return await this.refreshAddressBook();
    }
    return addressBook;
  };

  refreshAddressBook = async () => {
    const network = await this.getNetwork();
    const { data } = await openapiService.getAddressBook();
    const list = data.contacts;
    if (list && list.length > 0) {
      list.forEach((addressBook, index) => {
        if (list[index] && list[index].avatar) {
          list[index].avatar = this.addTokenForFirebaseImage(
            addressBook.avatar
          );
        }
      });
    }
    addressBookService.setAddressBook(list, network);
    return list;
  };

  checkAddress = async (address: string) => {
    const formatted = withPrefix(address.trim())!;

    if (!/^(0x)?[a-fA-F0-9]{16}$/.test(formatted)) {
      throw new Error('Invalid address length or format');
    }

    const account = await openapiService.getFlowAccount(formatted);
    if (!account) {
      throw new Error("Can't find address in chain");
    }
    return account;
  };

  //user wallets
  refreshUserWallets = async () => {
    const network = await this.getNetwork();
    const active = await userWalletService.getActiveWallet();
    const v2data = await openapiService.userWalletV2();
    const filteredData = v2data.data.wallets.filter(
      (item) => item.blockchain !== null
    );

    if (!active) {
      userInfoService.addUserId(v2data.data.id);
      userWalletService.setUserWallets(filteredData, network);
    }

    return filteredData;
  };

  getUserWallets = async () => {
    const network = await this.getNetwork();
    const wallets = await userWalletService.getUserWallets(network);
    if (!wallets[0]) {
      await this.refreshUserWallets();
      const data = await userWalletService.getUserWallets(network);
      return data;
    } else if (!wallets[0].blockchain) {
      await this.refreshUserWallets();
      const data = await userWalletService.getUserWallets(network);
      return data;
    }
    return wallets;
  };

  // switchWallet = async (walletId:number, blockId:number, _sortKey = 'id' ) => {
  //   const network = await this.getNetwork();
  //   await userWalletService.switchWallet(walletId, blockId, _sortKey,network);
  // }

  setChildWallet = async (wallet: any) => {
    await userWalletService.setChildWallet(wallet);
  };

  getActiveWallet = async () => {
    const activeWallet = await userWalletService.getActiveWallet();
    return activeWallet;
  };

  setActiveWallet = async (wallet: any, key: any) => {
    await userWalletService.setActiveWallet(key);

    const network = await this.getNetwork();
    await userWalletService.setCurrentWallet(wallet, key, network);
  };

  hasCurrentWallet = async () => {
    const wallet = await userWalletService.getCurrentWallet();
    return wallet.address !== '';
  };

  getCurrentWallet = async () => {
    const wallet = await userWalletService.getCurrentWallet();
    if (!wallet.address) {
      const network = await this.getNetwork();
      await this.refreshUserWallets();
      const data = await userWalletService.getUserWallets(network);
      return data[0].blockchain[0];
    }
    return wallet;
  };

  getEvmWallet = async () => {
    const wallet = await userWalletService.getEvmWallet();
    return wallet;
  };

  setEvmAddress = async (address) => {
    await userWalletService.setEvmAddress(address);
  }


  getEvmAddress = async () => {
    const wallet = await userWalletService.getEvmWallet();
    const address = withPrefix(wallet.address) || '';
    return address;
  };

  getCurrentAddress = async () => {
    const address = await userWalletService.getCurrentAddress();
    if (!address) {
      const data = this.refreshUserWallets();
      return withPrefix(data[0].blockchain[0].address);
    } else if (address.length < 3) {
      const data = this.refreshUserWallets();
      return withPrefix(data[0].blockchain[0].address);
    }
    return withPrefix(address);
  };

  getMainAddress = async () => {

    const network = await this.getNetwork();
    const address = await userWalletService.getMainWallet(network);
    if (!address) {
      const data = this.refreshUserWallets();
      return withPrefix(data[0].blockchain[0].address);
    } else if (address.length < 3) {
      const data = this.refreshUserWallets();
      return withPrefix(data[0].blockchain[0].address);
    }
    return withPrefix(address);
  };

  sendTransaction = async (cadence: string, args: any[]): Promise<string> => {
    return await userWalletService.sendTransaction(cadence, args);
  };



  createCOA = async (amount = '0.0'): Promise<string> => {

    const formattedAmount = parseFloat(amount).toFixed(8);

    const script = await getScripts('evm', 'createCoa');

    return await userWalletService.sendTransaction(
      script
      ,
      [
        fcl.arg(formattedAmount, t.UFix64),
      ]
    );
  };



  createCoaEmpty = async (): Promise<string> => {
    const network = await this.getNetwork();

    const script = await getScripts('evm', 'createCoaEmpty');

    return await userWalletService.sendTransaction(
      script
      ,
      []
    );
  };



  transferFlowEvm = async (recipientEVMAddressHex: string, amount = '1.0', gasLimit = 30000000): Promise<string> => {
    const network = await this.getNetwork();
    const formattedAmount = parseFloat(amount).toFixed(8);


    const script = await getScripts('evm', 'transferFlowToEvmAddress');
    if (recipientEVMAddressHex.startsWith('0x')) {
      recipientEVMAddressHex = recipientEVMAddressHex.substring(2);
    }

    return await userWalletService.sendTransaction(
      script
      ,
      [
        fcl.arg(recipientEVMAddressHex, t.String),
        fcl.arg(formattedAmount, t.UFix64),
        fcl.arg(gasLimit, t.UInt64),
      ]
    );
  };



  transferFTToEvm = async (tokenContractAddress: string, tokenContractName: string, amount = '1.0', contractEVMAddress: string, data, gas): Promise<string> => {
    const network = await this.getNetwork();
    const formattedAmount = parseFloat(amount).toFixed(8);



    const script = await getScripts('bridge', 'bridgeTokensToEvmAddress');
    if (contractEVMAddress.startsWith('0x')) {
      contractEVMAddress = contractEVMAddress.substring(2);
    }
    const dataBuffer = Buffer.from(data.slice(2), 'hex');
    const dataArray = Uint8Array.from(dataBuffer);
    const regularArray = Array.from(dataArray);
    const gasLimit = 30000000;

    return await userWalletService.sendTransaction(
      script
      ,
      [
        fcl.arg(tokenContractAddress, t.Address),
        fcl.arg(tokenContractName, t.String),
        fcl.arg(formattedAmount, t.UFix64),
        fcl.arg(contractEVMAddress, t.String),
        fcl.arg(regularArray, t.Array(t.UInt8)),
        fcl.arg(gasLimit, t.UInt64),
      ]
    );
  };



  transferFTToEvmV2 = async (vaultIdentifier: string, amount = '1.0', recipient): Promise<string> => {
    const network = await this.getNetwork();
    const formattedAmount = parseFloat(amount).toFixed(8);



    const script = await getScripts('bridge', 'bridgeTokensToEvmAddressV2');

    return await userWalletService.sendTransaction(
      script
      ,
      [
        fcl.arg(vaultIdentifier, t.String),
        fcl.arg(formattedAmount, t.UFix64),
        fcl.arg(recipient, t.String),
      ]
    );
  };


  transferFTFromEvm = async (flowidentifier: string, amount = '1.0', receiver: string, tokenResult): Promise<string> => {
    const network = await this.getNetwork();
    const amountStr = amount.toString();

    const amountBN = new BN(amountStr.replace('.', ''));

    const decimalsCount = amountStr.split('.')[1]?.length || 0;
    const scaleFactor = new BN(10).pow(tokenResult!.decimals - decimalsCount);

    // Multiply amountBN by scaleFactor
    const integerAmount = amountBN.multipliedBy(scaleFactor);
    const integerAmountStr = integerAmount.integerValue(BN.ROUND_DOWN).toFixed();


    console.log('integerAmountStr amount ', integerAmountStr, amount)
    const script = await getScripts('bridge', 'bridgeTokensFromEvmToFlowV2');
    return await userWalletService.sendTransaction(
      script
      ,
      [
        fcl.arg(flowidentifier, t.String),
        fcl.arg(integerAmountStr, t.UInt256),
        fcl.arg(receiver, t.Address),
      ]
    );
  };



  withdrawFlowEvm = async (amount = '1.0', address: string): Promise<string> => {
    const network = await this.getNetwork();
    const formattedAmount = parseFloat(amount).toFixed(8);
    const script = await getScripts('evm', 'withdrawCoa');

    return await userWalletService.sendTransaction(
      script
      ,
      [
        fcl.arg(formattedAmount, t.UFix64),
        fcl.arg(address, t.Address),
      ]

    );
  };




  fundFlowEvm = async (amount = '1.0'): Promise<string> => {
    const network = await this.getNetwork();
    const formattedAmount = parseFloat(amount).toFixed(8);


    const script = await getScripts('evm', 'fundCoa');

    return await userWalletService.sendTransaction(
      script
      ,
      [
        fcl.arg(formattedAmount, t.UFix64),
      ]

    );
  };




  coaLink = async (amount = '1.0'): Promise<string> => {
    const network = await this.getNetwork();
    const formattedAmount = parseFloat(amount).toFixed(8);


    const script = await getScripts('evm', 'coaLink');

    const result = await userWalletService.sendTransaction(
      script
      ,
      [
      ]

    );
    console.log('coaLink resutl ', result)
    return result;
  };



  checkCoaLink = async (): Promise<any> => {
    const checkedAddress = await storage.get('coacheckAddress');

    const script = await getScripts('evm', 'checkCoaLink');
    const mainAddress = await this.getMainWallet();
    console.log('getscript script ', mainAddress)
    if (checkedAddress === mainAddress) {
      return true;
    } else {
      const result = await fcl.query({
        cadence: script,
        args: (arg, t) => [arg(mainAddress, t.Address)],
      });
      if (result) {
        await storage.set('coacheckAddress', mainAddress);
      }
      return result
    }
  };




  bridgeToEvm = async (flowIndentifier, amount = '1.0'): Promise<string> => {
    const network = await this.getNetwork();
    const formattedAmount = parseFloat(amount).toFixed(8);


    const script = await getScripts('bridge', 'bridgeTokensToEvmV2');

    return await userWalletService.sendTransaction(
      script
      ,
      [
        fcl.arg(flowIndentifier, t.String),
        fcl.arg(formattedAmount, t.UFix64),
      ]

    );
  };




  bridgeToFlow = async (flowIdentifier, amount = '1.0', tokenResult): Promise<string> => {


    const amountStr = amount.toString();

    const amountBN = new BN(amountStr.replace('.', ''));

    const decimalsCount = amountStr.split('.')[1]?.length || 0;
    const scaleFactor = new BN(10).pow(tokenResult.decimals - decimalsCount);

    // Multiply amountBN by scaleFactor
    const integerAmount = amountBN.multipliedBy(scaleFactor);
    const integerAmountStr = integerAmount.integerValue(BN.ROUND_DOWN).toFixed();

    const script = await getScripts('bridge', 'bridgeTokensFromEvmV2');

    return await userWalletService.sendTransaction(
      script
      ,
      [
        fcl.arg(flowIdentifier, t.String),
        fcl.arg(integerAmountStr, t.UInt256),
      ]

    );
  };



  queryEvmAddress = async (address: string): Promise<string | null> => {
    if (address.length > 20) {
      return '';
    }

    let evmAddress = '';
    try {
      evmAddress = await this.getEvmAddress();
    } catch (error) {
      await this.refreshEvmWallets();
      console.error('Error getting EVM address:', error);
    }

    if (evmAddress.length > 20) {
      return evmAddress;
    } else {
      await this.refreshEvmWallets();
    }
    try {
      const script = await getScripts('evm', 'getCoaAddr');
      const result = await fcl.query({
        cadence: script,
        args: (arg, t) => [arg(address, t.Address)],
      });

      if (result) {
        await this.setEvmAddress(result);
        return result;
      } else {
        return '';
      }
    } catch (error) {
      console.error('Error querying the script or setting EVM address:', error);
      return '';
    }
  };

  checkCanMoveChild = async () => {
    const mainAddress = await this.getMainAddress();
    const isChild = await this.getActiveWallet();
    if (!isChild) {
      const evmAddress = await this.queryEvmAddress(mainAddress!);
      const childResp = await this.checkUserChildAccount();
      const isEmptyObject = (obj: any) => {
        return Object.keys(obj).length === 0 && obj.constructor === Object;
      };
      if (evmAddress !== '' || !isEmptyObject(childResp)) {
        return true;
      } else {
        return false;
      }
    }
    return true;
  }



  sendEvmTransaction = async (to: string, gas, value, data) => {
    if (to.startsWith('0x')) {
      to = to.substring(2);
    }
    const network = await this.getNetwork();


    const script = await getScripts('evm', 'callContract');
    const gasLimit = 30000000;
    const dataBuffer = Buffer.from(data.slice(2), 'hex');
    const dataArray = Uint8Array.from(dataBuffer);
    const regularArray = Array.from(dataArray);

    let amount;

    // If value is 0, set amount to '0.00000000'
    if (value === 0 || value === '0x0' || value === '0') {
      amount = '0.00000000';
    } else {
      // Ensure '0x' prefix for the hex value
      if (typeof value === 'string' && !value.startsWith('0x')) {
        value = '0x' + value;
      }

      // Convert the hex value to number
      const number = web3.utils.hexToNumber(value);

      // Convert Wei to Ether
      amount = web3.utils.fromWei(number.toString(), 'ether');

      // Ensure the amount has exactly 8 decimal places
      amount = parseFloat(amount).toFixed(8);
    }


    const result = await userWalletService.sendTransaction(script, [
      fcl.arg(to, t.String),
      fcl.arg(amount, t.UFix64),
      fcl.arg(regularArray, t.Array(t.UInt8)),
      fcl.arg(gasLimit, t.UInt64),
    ]);

    return result;
    // const transaction = await fcl.tx(result).onceSealed();
    // console.log('transaction ', transaction);

    // return result;
  };




  dapSendEvmTX = async (to: string, gas, value, data) => {
    if (to.startsWith('0x')) {
      to = to.substring(2);
    }
    const network = await this.getNetwork();


    const script = await getScripts('evm', 'callContract');
    const gasLimit = 30000000;
    const dataBuffer = Buffer.from(data.slice(2), 'hex');
    const dataArray = Uint8Array.from(dataBuffer);
    const regularArray = Array.from(dataArray);

    let amount;
    // console.log('dapSendEvmTX value:', value);

    // If value is 0 or similar, set amount to '0.00000000'
    if (value === 0 || value === '0x0' || value === '0') {
      amount = '0.00000000';
    } else {
      // Check if the value is a string
      if (typeof value === 'string') {
        // Check if it starts with '0x'
        if (value.startsWith('0x')) {
          // If it's hex without '0x', add '0x'
          if (!/^0x[0-9a-fA-F]+$/.test(value)) {
            value = '0x' + value.replace(/^0x/, '');
          }
        } else {
          // If it's a regular string, convert to hex
          value = web3.utils.toHex(value);
        }
      }

      // Convert the hex value to number
      const number = web3.utils.hexToNumber(value);

      // Convert Wei to Ether
      amount = web3.utils.fromWei(number.toString(), 'ether');

      // Ensure the amount has exactly 8 decimal places
      amount = parseFloat(amount).toFixed(8);
    }

    // console.log('Final amount:', amount);

    const result = await userWalletService.sendTransaction(script, [
      fcl.arg(to, t.String),
      fcl.arg(amount, t.UFix64),
      fcl.arg(regularArray, t.Array(t.UInt8)),
      fcl.arg(gasLimit, t.UInt64),
    ]);

    console.log('result ', result)
    const res = await fcl.tx(result).onceSealed();
    const transactionExecutedEvent = res.events.find(event => event.type.includes("TransactionExecuted"));

    if (transactionExecutedEvent) {
      const hash = transactionExecutedEvent.data.hash;
      const hashHexString = hash.map(num => parseInt(num).toString(16).padStart(2, '0')).join('');

      return hashHexString;
    } else {
      console.log('Transaction Executed event not found');
    }


    // const transaction = await fcl.tx(result).onceSealed();
    // console.log('transaction ', transaction);

    // return result;
  };



  getBalance = async (hexEncodedAddress: string): Promise<string> => {
    const network = await this.getNetwork();


    if (hexEncodedAddress.startsWith('0x')) {
      hexEncodedAddress = hexEncodedAddress.substring(2);
    }

    const script = await getScripts('evm', 'getBalance');

    const result = await fcl.query({
      cadence: script,
      args: (arg, t) => [arg(hexEncodedAddress, t.String)],
    });
    return result;
  };



  getFlowBalance = async (address) => {
    const account = await fcl.send([fcl.getAccount(address!)]).then(fcl.decode);
    return account.balance;
  };



  getNonce = async (hexEncodedAddress: string): Promise<string> => {
    const network = await this.getNetwork();



    const script = await getScripts('evm', 'getNonce');

    const result = await fcl.query({
      cadence: script,
      args: (arg, t) => [arg(hexEncodedAddress, t.String)],
    });
    return result;
  };

  unlinkChildAccount = async (address: string): Promise<string> => {
    const network = await this.getNetwork();
    const script = await getScripts('hybridCustody', 'getChildAccountMeta');

    return await userWalletService.sendTransaction(script, [
      fcl.arg(address, t.Address),
    ]);
  };

  unlinkChildAccountV2 = async (address: string): Promise<string> => {
    const network = await this.getNetwork();
    const script = await getScripts('hybridCustody', 'unlinkChildAccount');

    return await userWalletService.sendTransaction(script, [
      fcl.arg(address, t.Address),
    ]);
  };

  editChildAccount = async (
    address: string,
    name: string,
    description: string,
    thumbnail: string
  ): Promise<string> => {
    const network = await this.getNetwork();
    const script = await getScripts('hybridCustody', 'editChildAccount');

    return await userWalletService.sendTransaction(script, [
      fcl.arg(address, t.Address),
      fcl.arg(name, t.String),
      fcl.arg(description, t.String),
      fcl.arg(thumbnail, t.String),
    ]);
  };

  // TODO: Replace with generic token
  transferTokens = async (
    symbol: string,
    address: string,
    amount: string
  ): Promise<string> => {
    const token = await openapiService.getTokenInfo(symbol);
    if (!token) {
      throw new Error(`Invaild token name - ${symbol}`);
    }
    const network = await this.getNetwork();
    const script = await getScripts('ft', 'transferTokens');

    return await userWalletService.sendTransaction(
      script
        .replaceAll('<Token>', token.contractName)
        .replaceAll('<TokenBalancePath>', token.path.balance)
        .replaceAll('<TokenReceiverPath>', token.path.receiver)
        .replaceAll('<TokenStoragePath>', token.path.vault)
        .replaceAll('<TokenAddress>', token.address),
      [fcl.arg(amount, t.UFix64), fcl.arg(address, t.Address)]
    );
  };

  // TODO: Replace with generic token
  transferInboxTokens = async (
    symbol: string,
    address: string,
    amount: string
  ): Promise<string> => {


    const token = await openapiService.getTokenInfo(symbol);
    const script = await getScripts('ft', 'transferTokens');

    if (!token) {
      throw new Error(`Invaild token name - ${symbol}`);
    }
    const network = await this.getNetwork();

    return await userWalletService.sendTransaction(
      script
        .replaceAll('<Token>', token.contractName)
        .replaceAll('<TokenBalancePath>', token.path.balance)
        .replaceAll('<TokenReceiverPath>', token.path.receiver)
        .replaceAll('<TokenStoragePath>', token.path.vault)
        .replaceAll('<TokenAddress>', token.address),
      [fcl.arg(amount, t.UFix64), fcl.arg(address, t.Address)]
    );
  };

  revokeKey = async (index: string): Promise<string> => {
    const script = await getScripts('basic', 'revokeKey');

    return await userWalletService.sendTransaction(script, [
      fcl.arg(index, t.Int),
    ]);
  };

  addKeyToAccount = async (
    publicKey: string,
    signatureAlgorithm: number,
    hashAlgorithm: number,
    weight: number
  ): Promise<string> => {
    return await userWalletService.sendTransaction(
      `
      import Crypto
      transaction(publicKey: String, signatureAlgorithm: UInt8, hashAlgorithm: UInt8, weight: UFix64) {
          prepare(signer: AuthAccount) {
              let key = PublicKey(
                  publicKey: publicKey.decodeHex(),
                  signatureAlgorithm: SignatureAlgorithm(rawValue: signatureAlgorithm)!
              )
              signer.keys.add(
                  publicKey: key,
                  hashAlgorithm: HashAlgorithm(rawValue: hashAlgorithm)!,
                  weight: weight
              )
          }
      }
      `,
      [
        fcl.arg(publicKey, t.String),
        fcl.arg(signatureAlgorithm, t.UInt8),
        fcl.arg(hashAlgorithm, t.UInt8),
        fcl.arg(weight.toFixed(1), t.UFix64),
      ]
    );
  };

  // TODO: Replace with generic token
  claimFTFromInbox = async (
    domain: string,
    amount: string,
    symbol: string,
    root = 'meow'
  ): Promise<string> => {
    const domainName = domain.split('.')[0];
    const token = await openapiService.getTokenInfoByContract(symbol);
    const script = await getScripts('domain', 'claimFTFromInbox');

    if (!token) {
      throw new Error(`Invaild token name - ${symbol}`);
    }
    const network = await this.getNetwork();
    const address = fcl.sansPrefix(token.address[network]);
    const key = `A.${address}.${symbol}.Vault`;
    return await userWalletService.sendTransaction(
      script
        .replaceAll('<Token>', token.contract_name)
        .replaceAll('<TokenBalancePath>', token.storage_path.balance)
        .replaceAll('<TokenReceiverPath>', token.storage_path.receiver)
        .replaceAll('<TokenStoragePath>', token.storage_path.vault)
        .replaceAll('<TokenAddress>', token.address[network]),
      [
        fcl.arg(domainName, t.String),
        fcl.arg(root, t.String),
        fcl.arg(key, t.String),
        fcl.arg(amount, t.UFix64),
      ]
    );
  };

  claimNFTFromInbox = async (
    domain: string,
    itemId: string,
    symbol: string,
    root = 'meow'
  ): Promise<string> => {
    const domainName = domain.split('.')[0];
    const token = await openapiService.getNFTCollectionInfo(symbol);
    if (!token) {
      throw new Error(`Invaild token name - ${symbol}`);
    }
    const address = fcl.sansPrefix(token.address);
    const key = `A.${address}.${symbol}.Collection`;
    const script = await getScripts('domain', 'claimNFTFromInbox');

    return await userWalletService.sendTransaction(
      script
        .replaceAll('<NFT>', token.contract_name)
        .replaceAll('<NFTAddress>', token.address)
        .replaceAll('<CollectionStoragePath>', token.path.storage_path)
        .replaceAll('<CollectionPublicType>', token.path.public_type)
        .replaceAll('<CollectionPublicPath>', token.path.public_path),
      [
        fcl.arg(domainName, t.String),
        fcl.arg(root, t.String),
        fcl.arg(key, t.String),
        fcl.arg(itemId, t.UInt64),
      ]
    );
  };

  enableTokenStorage = async (symbol: string) => {
    const token = await openapiService.getTokenInfo(symbol);
    if (!token) {
      return;
    }
    const network = await this.getNetwork();
    const script = await getScripts('storage', 'enableTokenStorage');

    return await userWalletService.sendTransaction(
      script
        .replaceAll('<Token>', token.contractName)
        .replaceAll('<TokenBalancePath>', token.path.balance)
        .replaceAll('<TokenReceiverPath>', token.path.receiver)
        .replaceAll('<TokenStoragePath>', token.path.vault)
        .replaceAll('<TokenAddress>', token.address),
      []
    );
  };

  enableNFTStorage = async (contract_name: string) => {
    const result = await openapiService.genTx(contract_name);
    if (!result) {
      return;
    }
    const cadence = result.data;
    return await userWalletService.sendTransaction(cadence, []);
  };

  enableNFTStorageLocal = async (token: NFTModel) => {
    const script = await getScripts('collection', 'enableNFTStorage');
    if (token['contractName']) {
      token.contract_name = token['contractName']
      token.path.storage_path = token['path']['storage']
      token.path.public_path = token['path']['public']
    }
    return await userWalletService.sendTransaction(
      script
        .replaceAll('<NFT>', token.contract_name)
        .replaceAll('<NFTAddress>', token.address)
        .replaceAll('<CollectionStoragePath>', token.path.storage_path)
        .replaceAll('<CollectionPublicType>', token.path.public_type)
        .replaceAll('<CollectionPublicPath>', token.path.public_path),
      []
    );
  };

  moveFTfromChild = async (
    childAddress: string,
    path: string,
    amount: string,
    symbol: string
  ): Promise<string> => {
    const token = await openapiService.getTokenInfo(symbol);
    if (!token) {
      throw new Error(`Invaild token name - ${symbol}`);
    }
    const script = await getScripts('hybridCustody', 'transferChildFT');

    return await userWalletService.sendTransaction(
      script
        .replaceAll('<Token>', token.contractName)
        .replaceAll('<TokenBalancePath>', token.path.balance)
        .replaceAll('<TokenReceiverPath>', token.path.receiver)
        .replaceAll('<TokenStoragePath>', token.path.vault)
        .replaceAll('<TokenAddress>', token.address),
      [
        fcl.arg(childAddress, t.Address),
        fcl.arg(path, t.String),
        fcl.arg(amount, t.UFix64),
      ]
    );
  };

  sendFTfromChild = async (
    childAddress: string,
    receiver: string,
    path: string,
    amount: string,
    symbol: string
  ): Promise<string> => {
    const token = await openapiService.getTokenInfo(symbol);
    if (!token) {
      throw new Error(`Invaild token name - ${symbol}`);
    }

    const script = await getScripts('hybridCustody', 'sendChildFT');

    return await userWalletService.sendTransaction(
      script
        .replaceAll('<Token>', token.contractName)
        .replaceAll('<TokenBalancePath>', token.path.balance)
        .replaceAll('<TokenReceiverPath>', token.path.receiver)
        .replaceAll('<TokenStoragePath>', token.path.vault)
        .replaceAll('<TokenAddress>', token.address),
      [
        fcl.arg(childAddress, t.Address),
        fcl.arg(receiver, t.Address),
        fcl.arg(path, t.String),
        fcl.arg(amount, t.UFix64),
      ]
    );
  };

  moveNFTfromChild = async (
    nftContractAddress: string,
    nftContractName: string,
    ids: number,
    token
  ): Promise<string> => {
    console.log('script is this ', nftContractAddress)

    const script = await getScripts('hybridCustody', 'transferChildNFT');

    return await userWalletService.sendTransaction(
      script
        .replaceAll('<NFT>', token.contract_name)
        .replaceAll('<NFTAddress>', token.address)
        .replaceAll('<CollectionStoragePath>', token.path.storage_path)
        .replaceAll('<CollectionPublicType>', token.path.public_type)
        .replaceAll('<CollectionPublicPath>', token.path.public_path),
      [
        fcl.arg(nftContractAddress, t.Address),
        fcl.arg(nftContractName, t.String),
        fcl.arg(ids, t.UInt64),
      ]
    );
  };

  sendNFTfromChild = async (
    linkedAddress: string,
    receiverAddress: string,
    nftContractName: string,
    ids: number,
    token
  ): Promise<string> => {

    const script = await getScripts('hybridCustody', 'sendChildNFT');

    return await userWalletService.sendTransaction(
      script
        .replaceAll('<NFT>', token.contract_name)
        .replaceAll('<NFTAddress>', token.address)
        .replaceAll('<CollectionStoragePath>', token.path.storage_path)
        .replaceAll('<CollectionPublicType>', token.path.public_type)
        .replaceAll('<CollectionPublicPath>', token.path.public_path),
      [
        fcl.arg(linkedAddress, t.Address),
        fcl.arg(receiverAddress, t.Address),
        fcl.arg(nftContractName, t.String),
        fcl.arg(ids, t.UInt64),
      ]
    );
  };

  sendNFTtoChild = async (
    linkedAddress: string,
    path: string,
    ids: number,
    token
  ): Promise<string> => {

    const script = await getScripts('hybridCustody', 'transferNFTToChild');
    return await userWalletService.sendTransaction(
      script
        .replaceAll('<NFT>', token.contract_name)
        .replaceAll('<NFTAddress>', token.address)
        .replaceAll('<CollectionStoragePath>', token.path.storage_path)
        .replaceAll('<CollectionPublicType>', token.path.public_type)
        .replaceAll('<CollectionPublicPath>', token.path.public_path),
      [
        fcl.arg(linkedAddress, t.Address),
        fcl.arg(path, t.String),
        fcl.arg(ids, t.UInt64),
      ]
    );
  };

  getChildAccountAllowTypes = async (
    parent: string,
    child: string,
  ) => {

    const script = await getScripts('hybridCustody', 'getChildAccountAllowTypes');
    const result = await fcl.query({
      cadence: script,
      args: (arg, t) => [arg(parent, t.Address), arg(child, t.Address)],
    });
    return result
  };



  checkChildLinkedVault = async (
    parent: string,
    child: string,
    path: string,
  ): Promise<string> => {

    const script = await getScripts('hybridCustody', 'checkChildLinkedVaults');

    const result = await fcl.query({
      cadence: script,
      args: (arg, t) => [arg(parent, t.Address), arg(child, t.Address), fcl.arg(path, t.String)],
    });
    return result
  };

  batchBridgeNftToEvm = async (
    flowIdentifier: string,
    ids: Array<number>,
  ): Promise<string> => {

    const script = await getScripts('bridge', 'batchBridgeNFTToEvmV2');

    return await userWalletService.sendTransaction(
      script,
      [
        fcl.arg(flowIdentifier, t.String),
        fcl.arg(ids, t.Array(t.UInt64)),
      ]
    );
  };


  batchBridgeNftFromEvm = async (
    flowIdentifier: string,
    ids: Array<number>,
  ): Promise<string> => {

    const script = await getScripts('bridge', 'batchBridgeNFTFromEvmV2');

    return await userWalletService.sendTransaction(
      script,
      [
        fcl.arg(flowIdentifier, t.String),
        fcl.arg(ids, t.Array(t.UInt256)),
      ]
    );
  };



  batchTransferNFTToChild = async (
    childAddr: string,
    identifier: string,
    ids: Array<number>,
    token
  ): Promise<string> => {

    const script = await getScripts('hybridCustody', 'batchTransferNFTToChild');

    return await userWalletService.sendTransaction(
      script
        .replaceAll('<NFT>', token.contract_name)
        .replaceAll('<NFTAddress>', token.address)
        .replaceAll('<CollectionStoragePath>', token.path.storage_path)
        .replaceAll('<CollectionPublicType>', token.path.public_type)
        .replaceAll('<CollectionPublicPath>', token.path.public_path),
      [
        fcl.arg(childAddr, t.Address),
        fcl.arg(identifier, t.String),
        fcl.arg(ids, t.Array(t.UInt64)),
      ]
    );
  };



  batchTransferChildNft = async (
    childAddr: string,
    identifier: string,
    ids: Array<number>,
    token
  ): Promise<string> => {

    const script = await getScripts('hybridCustody', 'batchTransferChildNFT');
    return await userWalletService.sendTransaction(
      script
        .replaceAll('<NFT>', token.contract_name)
        .replaceAll('<NFTAddress>', token.address)
        .replaceAll('<CollectionStoragePath>', token.path.storage_path)
        .replaceAll('<CollectionPublicType>', token.path.public_type)
        .replaceAll('<CollectionPublicPath>', token.path.public_path),
      [
        fcl.arg(childAddr, t.Address),
        fcl.arg(identifier, t.String),
        fcl.arg(ids, t.Array(t.UInt64)),
      ]
    );
  };

  sendChildNFTToChild = async (
    childAddr: string,
    receiver: string,
    identifier: string,
    ids: Array<number>,
    token
  ): Promise<string> => {

    const script = await getScripts('hybridCustody', 'batchSendChildNFTToChild');

    return await userWalletService.sendTransaction(
      script
        .replaceAll('<NFT>', token.contract_name)
        .replaceAll('<NFTAddress>', token.address)
        .replaceAll('<CollectionStoragePath>', token.path.storage_path)
        .replaceAll('<CollectionPublicType>', token.path.public_type)
        .replaceAll('<CollectionPublicPath>', token.path.public_path),
      [
        fcl.arg(childAddr, t.Address),
        fcl.arg(receiver, t.Address),
        fcl.arg(identifier, t.String),
        fcl.arg(ids, t.Array(t.UInt64)),
      ]
    );
  };

  batchBridgeChildNFTToEvm = async (
    childAddr: string,
    identifier: string,
    ids: Array<number>,
    token
  ): Promise<string> => {

    const script = await getScripts('hybridCustody', 'batchBridgeChildNFTToEvm');

    return await userWalletService.sendTransaction(
      script
        .replaceAll('<NFT>', token.contract_name)
        .replaceAll('<NFTAddress>', token.address)
        .replaceAll('<CollectionStoragePath>', token.path.storage_path)
        .replaceAll('<CollectionPublicType>', token.path.public_type)
        .replaceAll('<CollectionPublicPath>', token.path.public_path),
      [
        fcl.arg(identifier, t.String),
        fcl.arg(childAddr, t.Address),
        fcl.arg(ids, t.Array(t.UInt64)),
      ]
    );
  };

  batchBridgeChildNFTFromEvm = async (
    childAddr: string,
    identifier: string,
    ids: Array<number>,
  ): Promise<string> => {

    const script = await getScripts('hybridCustody', 'batchBridgeChildNFTFromEvm');

    return await userWalletService.sendTransaction(
      script,
      [
        fcl.arg(identifier, t.String),
        fcl.arg(childAddr, t.Address),
        fcl.arg(ids, t.Array(t.UInt256)),
      ]
    );
  };

  bridgeChildFTToEvm = async (
    childAddr: string,
    identifier: string,
    amount: number,
    token
  ): Promise<string> => {

    const script = await getScripts('hybridCustody', 'bridgeChildFTToEvm');

    return await userWalletService.sendTransaction(
      script
        .replaceAll('<NFT>', token.contract_name)
        .replaceAll('<NFTAddress>', token.address)
        .replaceAll('<CollectionStoragePath>', token.path.storage_path)
        .replaceAll('<CollectionPublicType>', token.path.public_type)
        .replaceAll('<CollectionPublicPath>', token.path.public_path),
      [
        fcl.arg(identifier, t.String),
        fcl.arg(childAddr, t.Address),
        fcl.arg(amount, t.UFix64),
      ]
    );
  };

  bridgeChildFTFromEvm = async (
    childAddr: string,
    vaultIdentifier: string,
    ids: Array<number>,
    token
  ): Promise<string> => {

    const script = await getScripts('hybridCustody', 'bridgeChildFTFromEvm');

    return await userWalletService.sendTransaction(
      script
        .replaceAll('<NFT>', token.contract_name)
        .replaceAll('<NFTAddress>', token.address)
        .replaceAll('<CollectionStoragePath>', token.path.storage_path)
        .replaceAll('<CollectionPublicType>', token.path.public_type)
        .replaceAll('<CollectionPublicPath>', token.path.public_path),
      [
        fcl.arg(vaultIdentifier, t.String),
        fcl.arg(childAddr, t.Address),
        fcl.arg(ids, t.UInt256),
      ]
    );
  };

  bridgeNftToEvmAddress = async (
    nftContractAddress: string,
    nftContractName: string,
    ids: number,
    contractEVMAddress: string,
    data: any,
    gas: any,
  ): Promise<string> => {

    const script = await getScripts('bridge', 'bridgeNFTToEvmAddress');

    const gasLimit = 30000000;
    const dataBuffer = Buffer.from(data.slice(2), 'hex');
    const dataArray = Uint8Array.from(dataBuffer);
    const regularArray = Array.from(dataArray);

    if (!nftContractAddress.startsWith('0x')) {
      nftContractAddress = '0x' + nftContractAddress;
    }


    if (contractEVMAddress.startsWith('0x')) {
      contractEVMAddress = contractEVMAddress.substring(2);
    }

    return await userWalletService.sendTransaction(
      script,
      [
        fcl.arg(nftContractAddress, t.Address),
        fcl.arg(nftContractName, t.String),
        fcl.arg(ids, t.UInt64),
        fcl.arg(contractEVMAddress, t.String),
        fcl.arg(regularArray, t.Array(t.UInt8)),
        fcl.arg(gasLimit, t.UInt64),
      ]
    );
  };


  bridgeNftFromEvmToFlow = async (
    flowIdentifier: string,
    ids: number,
    receiver: string,
  ): Promise<string> => {

    const script = await getScripts('bridge', 'bridgeNFTFromEvmToFlowV2');

    return await userWalletService.sendTransaction(
      script,
      [
        fcl.arg(flowIdentifier, t.String),
        fcl.arg(ids, t.UInt256),
        fcl.arg(receiver, t.Address),
      ]
    );
  };


  sendNFT = async (
    recipient: string,
    id: any,
    token: any
  ): Promise<string> => {
    const network = await this.getNetwork();
    const script = await getScripts('collection', 'sendNFT');

    return await userWalletService.sendTransaction(
      script
        .replaceAll('<NFT>', token.contract_name)
        .replaceAll('<NFTAddress>', token.address)
        .replaceAll('<CollectionStoragePath>', token.path.storage_path)
        .replaceAll('<CollectionPublicPath>', token.path.public_path),
      [fcl.arg(recipient, t.Address), fcl.arg(parseInt(id), t.UInt64)]
    );
  };

  sendNBANFT = async (
    recipient: string,
    id: any,
    token: NFTModel
  ): Promise<string> => {
    const network = await this.getNetwork();
    const script = await getScripts('collection', 'sendNbaNFT');

    return await userWalletService.sendTransaction(
      script
        .replaceAll('<NFT>', token.contract_name)
        .replaceAll('<NFTAddress>', token.address)
        .replaceAll('<CollectionStoragePath>', token.path.storage_path)
        .replaceAll('<CollectionPublicPath>', token.path.public_path),
      [fcl.arg(recipient, t.Address), fcl.arg(parseInt(id), t.UInt64)]
    );
  };

  sendInboxNFT = async (
    recipient: string,
    id: any,
    token: any
  ): Promise<string> => {
    const script = await getScripts('domain', 'sendInboxNFT');

    return await userWalletService.sendTransaction(
      script
        .replaceAll('<NFT>', token.contract_name)
        .replaceAll('<NFTAddress>', token.address)
        .replaceAll('<CollectionStoragePath>', token.path.storage_path)
        .replaceAll('<CollectionPublicPath>', token.path.public_path),
      [fcl.arg(recipient, t.Address), fcl.arg(parseInt(id), t.UInt64)]
    );
  };

  // SwapTokensForExactTokens
  swapSend = async (
    swapPaths,
    tokenInMax,
    tokenInVaultPath,
    tokenOutSplit,
    tokenOutVaultPath,
    tokenOutReceiverPath,
    tokenOutBalancePath,
    deadline
  ): Promise<string> => {
    const network = await this.getNetwork();
    // let SwapConfig = testnetCodes;

    // if (network == 'mainnet') {
    //   SwapConfig = mainnetCodes;
    // }

    // const CODE = SwapConfig.Codes.Transactions.SwapTokensForExactTokens;
    const CODE = await getScripts('swap', 'SwapTokensForExactTokens');
    const tokenInKey = swapPaths[0];
    const tokenOutKey = swapPaths[swapPaths.length - 1];
    const arr = tokenOutKey.split('.');
    if (arr.length != 3) {
      throw Error(
        `Invalid TokenKey String, expect [A.adress.name] got ${tokenOutKey}`
      );
    }
    const tokenName = arr[2];
    const tokenAddress = `0x${arr[1]}`;
    return await userWalletService.sendTransaction(
      CODE.replaceAll('Token1Name', tokenName).replaceAll(
        'Token1Addr',
        tokenAddress
      ),
      [
        fcl.arg(swapPaths, t.Array(t.String)),
        fcl.arg(tokenOutSplit, t.Array(t.UFix64)),
        fcl.arg(tokenInMax.toFixed(8), t.UFix64),
        fcl.arg(deadline.toFixed(8), t.UFix64),
        fcl.arg({ domain: 'storage', identifier: tokenInVaultPath }, t.Path),
        fcl.arg({ domain: 'storage', identifier: tokenOutVaultPath }, t.Path),
        fcl.arg({ domain: 'public', identifier: tokenOutReceiverPath }, t.Path),
        fcl.arg({ domain: 'public', identifier: tokenOutBalancePath }, t.Path),
      ]
    );
  };

  // SwapExactTokensForTokens
  sendSwap = async (
    swapPaths,
    tokenInSplit,
    tokenInVaultPath,
    tokenOutMin,
    tokenOutVaultPath,
    tokenOutReceiverPath,
    tokenOutBalancePath,
    deadline
  ): Promise<string> => {
    const network = await this.getNetwork();
    // let SwapConfig = testnetCodes;
    // if (network == 'mainnet') {
    //   SwapConfig = mainnetCodes;
    // }
    // const CODE = SwapConfig.Codes.Transactions.SwapExactTokensForTokens;
    const CODE = await getScripts('swap', 'SwapExactTokensForTokens');

    const tokenOutKey = swapPaths[swapPaths.length - 1];
    const arr = tokenOutKey.split('.');
    if (arr.length != 3) {
      throw Error(
        `Invalid TokenKey String, expect [A.adress.name] got ${tokenOutKey}`
      );
    }
    const tokenName = arr[2];
    const tokenAddress = `0x${arr[1]}`;
    return await userWalletService.sendTransaction(
      CODE.replaceAll('Token1Name', tokenName).replaceAll(
        'Token1Addr',
        tokenAddress
      ),
      [
        fcl.arg(swapPaths, t.Array(t.String)),
        fcl.arg(tokenInSplit, t.Array(t.UFix64)),
        fcl.arg(tokenOutMin.toFixed(8), t.UFix64),
        fcl.arg(deadline.toFixed(8), t.UFix64),
        fcl.arg({ domain: 'storage', identifier: tokenInVaultPath }, t.Path),
        fcl.arg({ domain: 'storage', identifier: tokenOutVaultPath }, t.Path),
        fcl.arg({ domain: 'public', identifier: tokenOutReceiverPath }, t.Path),
        fcl.arg({ domain: 'public', identifier: tokenOutBalancePath }, t.Path),
      ]
    );
  };

  //transaction

  getTransaction = async (
    address: string,
    limit: number,
    offset: number,
    _expiry = 60000
  ) => {
    const network = await this.getNetwork();
    const now = new Date();
    const expiry = transactionService.getExpiry();
    // compare the expiry time of the item with the current time

    const txList = {};

    // txList['list'] = await transactionService.listTransactions();
    txList['count'] = await transactionService.getCount();
    const sealed = await transactionService.listTransactions(network);
    if (now.getTime() > expiry) {
      this.refreshTransaction(address, limit, offset, _expiry);
    }
    const pending = await transactionService.listPending(network);
    let totalList = sealed;
    if (pending && pending.length > 0) {
      totalList = pending.concat(sealed);
    }
    txList['list'] = totalList;

    return txList;
  };

  getPendingTx = async () => {
    const network = await this.getNetwork();
    const pending = await transactionService.listPending(network);
    return pending;
  };

  refreshTransaction = async (
    address: string,
    limit: number,
    offset: number,
    _expiry = 5000
  ) => {
    const network = await this.getNetwork();
    const now = new Date();
    const exp = _expiry + now.getTime();
    transactionService.setExpiry(exp);
    const isChild = await this.getActiveWallet();
    let dataResult = {};
    if (isChild === 'evm') {
      let evmAddress = await this.queryEvmAddress(address);
      if (!evmAddress!.startsWith('0x')) {
        evmAddress = '0x' + evmAddress
      }
      const evmResult = await openapiService.getEVMTransfers(evmAddress!, '', limit);
      dataResult['transactions'] = evmResult.trxs
      dataResult['total'] = evmResult.next_page_params.items_count
    } else {
      const res = await openapiService.getTransfers(address, '', limit);
      dataResult = res.data
    }

    transactionService.setTransaction(dataResult, network);
    chrome.runtime.sendMessage({
      msg: 'transferListReceived',
    });
  };

  signInWithMnemonic = async (mnemonic: string, replaceUser = true) => {
    return userWalletService.signInWithMnemonic(mnemonic, replaceUser);
  };

  signInWithPrivatekey = async (pk: string, replaceUser = true) => {
    return userWalletService.sigInWithPk(pk, replaceUser);
  };

  signInWithProxy = async (token: string, user: string) => {
    return proxyService.proxySign(token, user);
  };

  requestProxyToken = async () => {
    return proxyService.requestJwt();
  };

  signInV3 = async (
    mnemonic: string,
    accountKey: any,
    deviceInfo: any,
    replaceUser = true
  ) => {
    return userWalletService.signInv3(
      mnemonic,
      accountKey,
      deviceInfo,
      replaceUser
    );
  };

  signMessage = async (message: string): Promise<string> => {
    return userWalletService.sign(message);
  };
  abortController = new AbortController();
  abort() {
    this.abortController.abort();  // Abort ongoing operations
    this.abortController = new AbortController();  // Create a new controller for subsequent operations
  }

  switchNetwork = async (network: string) => {

    await userWalletService.setNetwork(network);
    eventBus.emit('switchNetwork', network);
    if (network === 'testnet') {
      await fclTestnetConfig();
    } else if (network == 'mainnet') {
      await fclMainnetConfig();
    }
    this.refreshAll();

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      tabs[0].id &&
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'FCW:NETWORK',
          network: network,
        });
    });
  };

  checkNetwork = async () => {
    const network = await this.getNetwork();
    await this.switchNetwork(network);
  };

  switchMonitor = async (monitor: string) => {
    await userWalletService.setMonitor(monitor);
  };

  getMonitor = (): string => {
    return userWalletService.getMonitor();
  };


  refreshAll = async () => {
    await this.refreshUserWallets();
    this.clearNFT();
    this.clearChildAccount();
    this.refreshAddressBook();
    this.refreshEvmWallets();
    await this.getCadenceScripts();
    const address = await this.getCurrentAddress();
    if (address) {
      this.refreshTransaction(address, 15, 0);
    }

    this.abort();
    await this.refreshCoinList(5000);
  };

  getNetwork = async (): Promise<string> => {
    return await userWalletService.getNetwork();
  };

  clearChildAccount = () => {
    storage.remove('checkUserChildAccount');
  }

  getEvmEnabled = async (): Promise<boolean> => {
    const address = await this.getEvmAddress();
    if (isValidEthereumAddress(address)) {
      return true;
    } else {
      return false;
    }
  };

  refreshEvmWallets = () => {
    userWalletService.refreshEvm();
  }

  clearWallet = () => {
    userWalletService.clear();
  }

  getFlowscanUrl = async (): Promise<string> => {
    const network = await this.getNetwork();
    const isEvm = await this.getActiveWallet();
    let baseURL = 'https://www.flowscan.io';

    // Check if it's an EVM wallet and update the base URL
    if (isEvm === 'evm') {
      switch (network) {
        case 'testnet':
          baseURL = 'https://evm-testnet.flowscan.io';
          break;
        case 'mainnet':
          baseURL = 'https://evm.flowscan.io';
          break;
      }
    } else {
      // Set baseURL based on the network
      switch (network) {
        case 'testnet':
          baseURL = 'https://testnet.flowscan.io';
          break;
        case 'mainnet':
          baseURL = 'https://www.flowscan.io';
          break;
        case 'crescendo':
          baseURL = 'https://flow-view-source.vercel.app/crescendo';
          break;
      }
    }

    return baseURL;
  };

  getViewSourceUrl = async (): Promise<string> => {
    const network = await this.getNetwork();
    let baseURL = 'https://f.dnz.dev';
    switch (network) {
      case 'mainnet':
        baseURL = 'https://f.dnz.dev';
        break;
      case 'testnet':
        baseURL = 'https://f.dnz.dev';
        break;
      case 'crescendo':
        baseURL = 'https://f.dnz.dev';
        break;
    }
    return baseURL;
  };

  poll = async (fn, fnCondition, ms) => {
    let result = await fn();
    while (fnCondition(result)) {
      await this.wait(ms);
      result = await fn();
    }
    return result;
  };

  wait = (ms = 1000) => {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  };

  pollingTrnasaction = async (txId: string, network: string) => {
    if (!txId || !txId.match(/^0?x?[0-9a-fA-F]{64}/)) {
      return;
    }

    const fetchReport = async () =>
      (
        await fetch(
          `https://rest-${network}.onflow.org/v1/transaction_results/${txId}`
        )
      ).json();
    const validate = (result) => result.status !== 'Sealed';
    return await this.poll(fetchReport, validate, 3000);
  };

  listenTransaction = async (
    txId: string,
    sendNotification = true,
    title = chrome.i18n.getMessage('Transaction__Sealed'),
    body = '',
    icon = chrome.runtime.getURL('./images/icon-64.png')
  ) => {
    if (!txId || !txId.match(/^0?x?[0-9a-fA-F]{64}/)) {
      return;
    }
    const address = (await this.getCurrentAddress()) || '0x';
    const network = await this.getNetwork();
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      chrome.storage.session.set({
        transactionPending: { txId, network, date: new Date() },
      });
      eventBus.emit('transactionPending');
      chrome.runtime.sendMessage({
        msg: 'transactionPending',
        network: network,
      });
      transactionService.setPending(txId, address, network, icon, title);
      await fcl.tx(txId).onceSealed();
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      await chrome.storage.session.remove('transactionPending');
      const baseURL = this.getFlowscanUrl();
      transactionService.removePending(txId, address, network);
      this.refreshTransaction(address, 15, 0);
      eventBus.emit('transactionDone');
      chrome.runtime.sendMessage({
        msg: 'transactionDone',
      });
      if (sendNotification) {
        notification.create(
          `${baseURL}/transaction/${txId}`,
          title,
          body,
          icon
        );
      }
    } catch (err) {
      console.log('listen erro ', err)
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      await chrome.storage.session.remove('transactionPending');
      transactionService.removePending(txId, address, network);
      chrome.runtime.sendMessage({
        msg: 'transactionDone',
      });
    }
  };

  getNFTListCahce = async (): Promise<NFTData> => {
    const network = await this.getNetwork();
    // const list =
    // if (!list.length){
    // const data = this.refreshNft(address);
    // return data;
    // }
    return await nftService.getNft(network);
  };

  refreshNft = async (address: string, offset = 0): Promise<NFTData> => {
    // change the address to real address after testing complete
    // const address = await this.getCurrentAddress();
    const limit = 24;
    const network = await this.getNetwork();
    const data = await openapiService.nftCatalogList(address!, limit, offset, network);
    const nfts = data.nfts;
    if (!nfts) {
      return {
        nfts: [],
        nftCount: data.nftCount,
      };
    }
    nfts.map((nft) => {
      nft.unique_id = nft.collectionName + '_' + nft.id;
    });
    function getUniqueListBy(arr, key) {
      return [...new Map(arr.map((item) => [item[key], item])).values()];
    }
    const unique_nfts = getUniqueListBy(nfts, 'unique_id');
    const result = { nfts: unique_nfts, nftCount: data.nftCount };
    nftService.setNft(result, network);
    return result;
  };

  clearNFT = () => {
    nftService.clear();
  };

  clearNFTList = async () => {
    await nftService.clearNFTList();
  };

  clearNFTCollection = async () => {
    await nftService.clearNFTCollection();
  };

  clearCoinList = async () => {
    await coinListService.clear();
  };

  clearAllStorage = () => {
    nftService.clear();
    userInfoService.removeUserInfo();
    coinListService.clear();
    addressBookService.clear();
    userWalletService.clear();
    transactionService.clear();
  };

  clearLocalStorage = async () => {
    await storage.clear();
  };

  getCollectionCache = async () => {
    const network = await this.getNetwork();
    const list = await nftService.getCollectionList(network);
    if (!list) {
      return [];
    }
    const sortedList = list.sort((a, b) => b.count - a.count);
    return sortedList;
  };

  getSingleCollectionCache = async (collectionId: string) => {
    const network = await this.getNetwork();
    const list = await nftService.getSingleCollection(collectionId, network);
    if (!list) {
      return [];
    }
    return list;
  };

  getSingleCollection = async (
    address: string,
    contract: string,
    offset = 0
  ) => {
    const network = await this.getNetwork();
    const data = await openapiService.nftCatalogCollectionList(
      address!,
      contract,
      24,
      offset,
      network
    );

    data.nfts.map((nft) => {
      nft.unique_id = nft.collectionName + '_' + nft.id;
    });
    function getUniqueListBy(arr, key) {
      return [...new Map(arr.map((item) => [item[key], item])).values()];
    }
    const unique_nfts = getUniqueListBy(data.nfts, 'unique_id');
    data.nfts = unique_nfts;
    return data;
  };

  getSingleCollectionv2 = async (
    address: string,
    contract: string,
    offset = 0
  ) => {
    const network = await this.getNetwork();
    const data = await openapiService.getNFTCadenceCollection(
      address!,
      network,
      contract,
      offset,
      24,
    );

    data.nfts.map((nft) => {
      nft.unique_id = nft.collectionName + '_' + nft.id;
    });
    function getUniqueListBy(arr, key) {
      return [...new Map(arr.map((item) => [item[key], item])).values()];
    }
    const unique_nfts = getUniqueListBy(data.nfts, 'unique_id');
    data.nfts = unique_nfts;
    return data;
  };

  getCollectionApi = async (address: string, contract: string, offset = 0) => {
    const network = await this.getNetwork();
    const result = await openapiService.nftCollectionApiPaging(
      address!,
      contract,
      24,
      offset,
      network
    );
    result['info'] = result.collection;
    // result['info']['collectionDisplay']['name'] = result.collection.display.name
    // result['nftCount'] = result.collection.nftCount
    console.log('result  ---- ', result);
    return result;
  };

  refreshCollection = async (address: string) => {
    // change the address to real address after testing complete
    // const address = await this.getCurrentAddress();
    const network = await this.getNetwork();
    const data = await openapiService.nftCatalogCollections(address!, network);
    if (!data) {
      return [];
    }
    const sortedList = data.sort((a, b) => b.count - a.count);
    nftService.setCollectionList(sortedList, network);
    return sortedList;
  };

  getNftCatalog = async () => {
    const catStorage = await storage.get('catalogData');

    const now = new Date();
    const exp = 1000 * 60 * 60 * 1 + now.getTime();
    if (
      catStorage &&
      catStorage['expiry'] &&
      now.getTime() <= catStorage['expiry']
    ) {
      return catStorage['data'];
    }

    const data = (await openapiService.nftCatalog()) ?? [];
    const catalogData = {
      data: data,
      expiry: exp,
    };
    return data;
  };

  getCadenceScripts = async () => {
    try {
      const cadenceScrpts = await storage.get('cadenceScripts');
      const now = new Date();
      const exp = 1000 * 60 * 60 * 1 + now.getTime();
      const network = await userWalletService.getNetwork();
      if (
        cadenceScrpts &&
        cadenceScrpts['expiry'] &&
        now.getTime() <= cadenceScrpts['expiry'] &&
        cadenceScrpts.network == network
      ) {
        return cadenceScrpts['data'];
      }

      // const { cadence, networks } = data;
      // const cadencev1 = (await openapiService.cadenceScripts(network)) ?? {};

      const cadenceScriptsV2 = (await openapiService.cadenceScriptsV2()) ?? {};
      // const { scripts, version } = cadenceScriptsV2;
      // const cadenceVersion = cadenceScriptsV2.version;
      const cadence = cadenceScriptsV2.scripts[network]

      // for (const item of cadence) {
      //   console.log(cadenceVersion, 'cadenceVersion');
      //   if (item && item.version == cadenceVersion) {
      //     script = item;
      //   }
      // }

      const scripts = {
        data: cadence,
        expiry: exp,
        network,
      };
      storage.set('cadenceScripts', scripts);

      return cadence;
    } catch (error) {
      console.log(error, '=== get scripts error ===');
    }
  };

  getSwapConfig = async () => {
    const swapStorage = await storage.get('swapConfig');

    const now = new Date();
    const exp = 1000 * 60 * 60 * 1 + now.getTime();
    if (
      swapStorage &&
      swapStorage['expiry'] &&
      now.getTime() <= swapStorage['expiry']
    ) {
      return swapStorage['data'];
    }

    const data = (await openapiService.getSwapInfo()) ?? false;
    console.log('data expired ');
    const swapConfig = {
      data: data,
      expiry: exp,
    };
    storage.set('swapConfig', swapConfig);
    return data;
  };

  reset = async () => {
    await keyringService.loadStore(undefined);
    keyringService.store.subscribe((value) =>
      storage.set('keyringState', value)
    );
  };

  // Google Drive - Backup
  getBackupFiles = async () => {
    return googleDriveService.listFiles();
  };

  hasGooglePremission = async () => {
    return googleDriveService.hasGooglePremission();
  };

  deleteAllBackups = async () => {
    return googleDriveService.deleteAllFile();
  };

  deleteCurrentUserBackup = async () => {
    const data = await userInfoService.getUserInfo();
    const username = data.username;
    return googleDriveService.deleteUserBackup(username);
  };

  deleteUserBackup = async (username: string) => {
    return googleDriveService.deleteUserBackup(username);
  };

  hasCurrentUserBackup = async () => {
    const data = await userInfoService.getUserInfo();
    const username = data.username;
    return googleDriveService.hasUserBackup(username);
  };

  hasUserBackup = async (username: string) => {
    return googleDriveService.hasUserBackup(username);
  };

  syncBackup = async () => {
    const data = await userInfoService.getUserInfo();
    const username = data.username;
    const password = keyringService.password;
    const mnemonic = await this.getMnemonics(password || '');
    return this.uploadMnemonicToGoogleDrive(mnemonic, username, password);
  };

  uploadMnemonicToGoogleDrive = async (mnemonic, username, password) => {
    const app = getApp(process.env.NODE_ENV!);
    const user = await getAuth(app).currentUser;
    return googleDriveService.uploadMnemonicToGoogleDrive(
      mnemonic,
      username,
      user!.uid,
      password
    );
  };

  loadBackupAccounts = async (): Promise<string[]> => {
    return googleDriveService.loadBackupAccounts();
  };

  loadBackupAccountLists = async (): Promise<any[]> => {
    return googleDriveService.loadBackupAccountLists();
  };

  restoreAccount = async (username, password): Promise<string | null> => {
    return googleDriveService.restoreAccount(username, password);
  };

  getCurrentPassword = async (password: string) => {
    await keyringService.verifyPassword(password);
  };

  getPayerAddressAndKeyId = async () => {
    try {
      const config = await fetchConfig.remoteConfig();
      const network = await this.getNetwork();
      return config.payer[network];
    } catch {
      const network = await this.getNetwork();
      return defaultConfig.payer[network];
    }
  };

  allowLilicoPay = async (): Promise<boolean> => {
    const isFreeGasFeeKillSwitch = await storage.get('freeGas');
    const isFreeGasFeeEnabled = await storage.get('lilicoPayer');
    return isFreeGasFeeKillSwitch && isFreeGasFeeEnabled;
  };

  signPayer = async (signable): Promise<string> => {
    return await userWalletService.signPayer(signable);
  };

  signProposer = async (signable): Promise<string> => {
    return await userWalletService.signProposer(signable);
  };

  updateProfilePreference = async (privacy: number) => {
    await openapiService.updateProfilePreference(privacy);
  };

  flownsPrepare = async () => {
    const resp = await openapiService.flownsPrepare();
    return resp;
  };

  flownsResponse = async (script, domain, flownsAddress, lilicoAddress) => {
    const resp = await flownsService.sendTransaction(
      script,
      domain,
      flownsAddress,
      lilicoAddress
    );
    return resp;
  };

  setHistory = async (token, nft) => {
    const network = await userWalletService.getNetwork();
    const data = {
      token,
      nft,
    };
    await flownsService.setHistory(network, data);
  };

  getHistory = async () => {
    const network = await userWalletService.getNetwork();
    const resp = await flownsService.getHistory(network);
    return resp;
  };

  nodeInfo = async (address) => {
    const result = await stakingService.nodeInfo(address);
    return result;
  };

  stakeInfo = async (address) => {
    const result = await stakingService.stakeInfo(address);
    return result;
  };

  delegateInfo = async (address) => {
    const result = await stakingService.delegateInfo(address);
    return result;
  };

  delegateStore = async () => {
    const result = await stakingService.delegateStore();
    return result;
  };

  createDelegator = async (amount, node) => {
    const result = await stakingService.createDelegator(amount, node);
    return result;
  };

  createStake = async (amount, node, delegate) => {
    const result = await stakingService.createStake(amount, node, delegate);
    return result;
  };

  withdrawReward = async (amount, node, delegate) => {
    const result = await stakingService.withdrawReward(amount, node, delegate);
    return result;
  };

  restakeReward = async (amount, node, delegate) => {
    const result = await stakingService.restakeReward(amount, node, delegate);
    return result;
  };

  restakeUnstaked = async (amount, node, delegate) => {
    const result = await stakingService.restakeUnstaked(amount, node, delegate);
    return result;
  };

  withdrawUnstaked = async (amount, node, delegate) => {
    const result = await stakingService.withdrawUnstaked(
      amount,
      node,
      delegate
    );
    return result;
  };

  unstake = async (amount, node, delegate) => {
    const result = await stakingService.unstake(amount, node, delegate);
    return result;
  };

  getApr = async () => {
    const result = await stakingService.getApr();
    return result;
  };

  checkStakingSetup = async (address) => {
    return await stakingService.checkSetup(address);
  };

  setupDelegator = async (address) => {
    const result = await stakingService.setup(address);
    return result;
  };

  createFlowSandboxAddress = async (network) => {
    const account = await getStoragedAccount();
    const { hashAlgo, signAlgo, pubKey, weight } = account;

    const accountKey = {
      public_key: pubKey,
      hash_algo:
        typeof hashAlgo === 'string' ? getHashAlgo(hashAlgo) : hashAlgo,
      sign_algo:
        typeof signAlgo === 'string' ? getSignAlgo(signAlgo) : signAlgo,
      weight: weight,
    };

    const result = await openapiService.createFlowNetworkAddress(
      accountKey,
      network
    );
    return result;
  };

  checkCrescendo = async () => {
    const result = await userWalletService.checkCrescendo();
    return result;
  };



  getAccount = async () => {
    const address = await this.getCurrentAddress();
    const account = await fcl.send([fcl.getAccount(address!)]).then(fcl.decode);
    return account;
  };


  getEmoji = async () => {
    const currentId = await storage.get('currentId');
    let emojires = await storage.get(`${currentId}emoji`)
    if (!emojires) {
      const index1 = Math.floor(Math.random() * emoji.emojis.length);
      let index2;

      do {
        index2 = Math.floor(Math.random() * emoji.emojis.length);
      } while (index1 === index2);

      emojires = [emoji.emojis[index1], emoji.emojis[index2]];
      storage.set(`${currentId}emoji`, emojires)
    }

    return emojires;
  };


  setEmoji = async (emoji, type) => {
    const currentId = await storage.get('currentId');
    let emojires = await storage.get(`${currentId}emoji`)
    if (!emojires) {
      const index1 = Math.floor(Math.random() * emoji.emojis.length);
      let index2;

      do {
        index2 = Math.floor(Math.random() * emoji.emojis.length);
      } while (index1 === index2);

      emojires = [emoji.emojis[index1], emoji.emojis[index2]];
    }
    if (type === 'evm') {
      emojires[1] = emoji
    } else {
      emojires[0] = emoji
    }

    await storage.set(`${currentId}emoji`, emojires)

    return emojires;
  };


}

export default new WalletController();
