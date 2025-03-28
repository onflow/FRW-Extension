/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as fcl from '@onflow/fcl';
import type { Account as FclAccount } from '@onflow/typedefs';
import * as t from '@onflow/types';
import BN from 'bignumber.js';
import * as bip39 from 'bip39';
import { ethErrors } from 'eth-rpc-errors';
import * as ethUtil from 'ethereumjs-util';
import { getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth/web-extension';
import { encode } from 'rlp';
import web3, { TransactionError, Web3 } from 'web3';

import {
  findAddressWithSeed,
  findAddressWithPK,
} from '@/background/utils/modules/findAddressWithPK';
import {
  pk2PubKey,
  formPubKey,
  jsonToKey,
  seed2PublicPrivateKey,
  seedWithPathAndPhrase2PublicPrivateKey,
  formPubKeyTuple,
} from '@/background/utils/modules/publicPrivateKey';
import eventBus from '@/eventBus';
import type { CoinItem, TokenInfo, BalanceMap } from '@/shared/types/coin-types';
import { type FeatureFlagKey, type FeatureFlags } from '@/shared/types/feature-types';
import { type PublicPrivateKeyTuple, type PublicKeyTuple } from '@/shared/types/key-types';
import { ContactType } from '@/shared/types/network-types';
import { type NFTCollectionData } from '@/shared/types/nft-types';
import { type TrackingEvents } from '@/shared/types/tracking-types';
import { type TransferItem, type TransactionState } from '@/shared/types/transaction-types';
import {
  type ActiveChildType,
  type LoggedInAccount,
  type FlowAddress,
  type PublicKeyAccount,
  type MainAccount,
  type ChildAccountMap,
  type WalletAccount,
  type EvmAddress,
  type WalletAddress,
  isEvmAccountType,
} from '@/shared/types/wallet-types';
import {
  ensureEvmAddressPrefix,
  getAccountKey,
  isValidEthereumAddress,
  isValidFlowAddress,
  withPrefix,
} from '@/shared/utils/address';
import { getHashAlgo, getSignAlgo } from '@/shared/utils/algo';
import { FLOW_BIP44_PATH } from '@/shared/utils/algo-constants';
import { getCurrentProfileId } from '@/shared/utils/current-id';
import { convertToIntegerAmount, validateAmount } from '@/shared/utils/number';
import { retryOperation } from '@/shared/utils/retryOperation';
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
  proxyService,
  newsService,
  mixpanelTrack,
  evmNftService,
} from 'background/service';
import i18n from 'background/service/i18n';
import {
  type DisplayedKeryring,
  type Keyring,
  KEYRING_CLASS,
  type KeyringType,
} from 'background/service/keyring';
import type { CacheState } from 'background/service/pageStateCache';
import { getScripts, replaceNftKeywords } from 'background/utils';
import emoji from 'background/utils/emoji.json';
import fetchConfig from 'background/utils/remoteConfig';
import { notification, storage } from 'background/webapi';
import { openIndexPage } from 'background/webapi/tab';
import { INTERNAL_REQUEST_ORIGIN, EVENTS, KEYRING_TYPE, EVM_ENDPOINT } from 'consts';

import type {
  BlockchainResponse,
  Contact,
  NFTModelV2,
  UserInfoResponse,
} from '../../shared/types/network-types';
import placeholder from '../images/placeholder.png';
import DisplayKeyring from '../service/keyring/display';
import { HDKeyring } from '../service/keyring/hdKeyring';
import { SimpleKeyring } from '../service/keyring/simpleKeyring';
import type { ConnectedSite } from '../service/permission';
import type { PreferenceAccount } from '../service/preference';
import { type EvaluateStorageResult, StorageEvaluator } from '../service/storage-evaluator';
import defaultConfig from '../utils/defaultConfig.json';
import erc20ABI from '../utils/erc20.abi.json';
import { getLoggedInAccount } from '../utils/getLoggedInAccount';
import {
  getAccountsByPublicKeyTuple,
  getOrCheckAddressByPublicKeyTuple,
} from '../utils/modules/findAddressWithPubKey';

import BaseController from './base';
import provider from './provider';

const stashKeyrings: Record<string, Keyring> = {};

interface TokenTransaction {
  symbol: string;
  contractName: string;
  address: string;
  timestamp: number;
}

export class WalletController extends BaseController {
  openapi = openapiService;
  private storageEvaluator: StorageEvaluator;
  private loaded = false;

  constructor() {
    super();
    this.storageEvaluator = new StorageEvaluator();
  }
  // Adding as tests load the extension really, really fast
  // It's possible to call the wallet controller before services are loaded
  // setLoaded is called in index.ts of the background
  isLoaded = async () => this.loaded;
  setLoaded = async (loaded: boolean) => {
    this.loaded = loaded;
  };

  /* wallet */
  boot = async (password) => {
    // When wallet first initializes through install, it will add a encrypted password to boot state. If is boot is false, it means there's no password set.
    const isBooted = await keyringService.isBooted();
    if (isBooted) {
      await keyringService.verifyPassword(password);
      await keyringService.updateUnlocked(password);
    } else {
      await keyringService.boot(password);
    }
  };
  isBooted = () => keyringService.isBooted();
  loadMemStore = () => keyringService.loadMemStore();
  verifyPassword = (password: string) => keyringService.verifyPassword(password);

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

  /**
   * Create a new wallet profile.
   * This is called on first registration and when the user wants to add a profile
   * @param password the password for the new profile, or confirmation of existing password
   * @param username the username for the new profile
   * @param mnemonic the mnemonic for the new private key
   */
  registerNewProfile = async (username: string, password: string, mnemonic: string) => {
    // The account is the public key of the account. It's derived from the mnemonic. We do not support custom curves or passphrases for new accounts

    const accountKey = getAccountKey(mnemonic);
    console.log('accountKey', accountKey);

    // We're booting the keyring with the new password
    // This does not update the vault, it simply sets the password / cypher methods we're going to use to store our private keys in the vault

    await this.boot(password);
    // We're then registering the account with the public key
    // This calls our backend API which gives us back an account id
    // This register call ALSO sets the currentId in local storage
    // In addition, it will sign us in to the new account with our auth (Firebase) on our backend
    // Note this auth is different to unlocking the wallet with the password.
    await openapiService.register(accountKey, username);

    // We're creating the keyring with the mnemonic. This will encypt the private keys and store them in the keyring vault and deepVault
    await this.createKeyringWithMnemonics(mnemonic);
    // We're creating the Flow address for the account
    // Only after this, do we have a valid wallet with a Flow address
    await openapiService.createFlowAddress();
  };

  /**
   * Sign in or create a new user by public key tuple
   */
  private signInOrCreateUserByPubKeyTuple = async (
    pubKTuple: PublicKeyTuple,
    username: string,
    signInFunction: () => Promise<void>
  ) => {
    // Check if the account is registered on our backend (i.e. it's been created in wallet or used previously in wallet)
    // Check if the seed phrase is valid and exists on the network
    // Note we're not bothering to check against any address here. We're assuming that's been done in the front end. We use the indexer to get the accounts
    const accounts = await getOrCheckAddressByPublicKeyTuple(pubKTuple);
    if (accounts.length === 0) {
      throw new Error('Invalid seed phrase');
    }

    // Now check if the account is registered on our backend (i.e. it's been created in wallet or used previously in wallet)
    const importCheckResult = await openapiService.checkImport(accounts[0].publicKey);
    if (importCheckResult.status === 409) {
      // The account has been previously imported, so just retrieve the current user name
      // Just login to the existing account using the private key

      // Sign in with the mnemonic
      await signInFunction();
    } else {
      // We have to create a new user on our backend

      const accountKeyStruct = {
        public_key: accounts[0].publicKey,
        sign_algo: accounts[0].signAlgo,
        hash_algo: accounts[0].hashAlgo,
        weight: 1000,
      };
      // Get the device info so e can do analytics
      const installationId = await openapiService.getInstallationId();

      const device_info = {
        device_id: installationId,
        device_name: navigator.userAgent,
        device_type: 'extension',
        push_token: '',
        platform: 'chrome',
      };
      // Import the account creating a new user on our backend
      // Sign in as the new user
      await openapiService.importKey(
        accountKeyStruct,
        device_info,
        username,
        {},
        accounts[0].address
      );
    }
  };

  /**
   * Import a profile using a mnemonic
   * @param username
   * @param password
   * @param mnemonic
   * @param address
   * @param path
   * @param phrase
   */
  importProfileUsingMnemonic = async (
    username: string,
    password: string,
    mnemonic: string,
    path: string = FLOW_BIP44_PATH,
    phrase: string = ''
  ) => {
    // Boot the keyring with the password
    // We should be validating the password as the first thing we do
    await this.boot(password);
    // Get the public key tuple from the mnemonic

    const pubKTuple: PublicKeyTuple = formPubKeyTuple(
      await seedWithPathAndPhrase2PublicPrivateKey(mnemonic, path, phrase)
    );
    const signInFunction = async () => {
      await this.signInWithMnemonic(mnemonic, true, path, phrase);
    };
    // Sign in or create a new user by public key tuple
    await this.signInOrCreateUserByPubKeyTuple(pubKTuple, username, signInFunction);

    // TODO: Remove this
    storage.remove('premnemonic');
    await this.saveIndex(username);

    // Now we can create the keyring with the mnemonic (and path and phrase)
    await this.createKeyringWithMnemonics(mnemonic, path, phrase);
  };

  /**
   * Import a profile using a private key
   * @param username
   * @param password
   * @param pk
   * @param address
   */

  importProfileByPrivateKey = async (
    username: string,
    password: string,
    pk: string,
    address: FlowAddress | null = null
  ) => {
    // Boot the keyring with the password
    // We should be validating the password as the first thing we do
    await this.boot(password);

    // Get the public key tuple from the private key
    const pubKTuple: PublicKeyTuple = await pk2PubKey(pk);

    const signInFunction = async () => {
      await this.signInWithPrivatekey(pk, true);
    };
    // Sign in or create a new user by public key tuple
    await this.signInOrCreateUserByPubKeyTuple(pubKTuple, username, signInFunction);

    // TODO: Remove this
    storage.remove('premnemonic');
    await this.saveIndex(username);

    // Now we can create the keyring with the mnemonic (and path and phrase)
    await this.importPrivateKey(pk);
  };

  /**
   * Switch the wallet profile to a different profile
   * @param id - The id of the keyring to switch to.
   */
  switchProfile = async (id: string) => {
    try {
      await keyringService.switchKeyring(id);
      const pubKey = await keyringService.getCurrentPublicKeyTuple();
      await userWalletService.switchLogin(pubKey);
    } catch (error) {
      throw new Error('Failed to switch account: ' + (error.message || 'Unknown error'));
    }
  };

  checkAvailableAccount = async (currentId: string) => {
    try {
      await keyringService.checkAvailableAccount(currentId);
    } catch (error) {
      console.error('Error finding available account:', error);
      throw new Error('Failed to find available account: ' + (error.message || 'Unknown error'));
    }
  };

  unlock = async (password: string) => {
    await keyringService.submitPassword(password);

    // only password is correct then we store it
    const pubKey = await keyringService.getCurrentPublicKeyTuple();
    await userWalletService.switchLogin(pubKey);
    // Set up all the wallet data
    await this.refreshWallets();

    sessionService.broadcastEvent('unlock');
  };

  submitPassword = async (password: string) => {
    await keyringService.submitPassword(password);
  };

  refreshWallets = async () => {
    // Refresh all the wallets after unlocking or switching profiles
    // Refresh the cadence scripts first
    await this.getCadenceScripts();

    // Refresh the main wallets
    await this.loadMainAccounts();

    // Get the selected main address
    const mainAddress = await this.getParentAddress();
    if (!mainAddress) {
      throw new Error('Main address not found');
    }

    // Refresh the EVM wallet
    await this.queryEvmAddress(mainAddress);
    // Refresh the child wallets
    await this.checkUserChildAccount();

    // Refresh the user info
    let userInfo = {};
    try {
      userInfo = await retryOperation(async () => this.getUserInfo(true), 3, 1000);
    } catch (error) {
      console.error('Error refreshing user info:', error);
    }
    // Refresh the logged in account
    const pubKTuple = await keyringService.getCurrentPublicKeyTuple();
    const fclAccount = await this.getAccount();
    // Refresh the user info
    await openapiService.freshUserInfo(
      mainAddress as FlowAddress,
      fclAccount,
      pubKTuple,
      userInfo,
      null
    );
  };

  retrievePk = async (password: string) => {
    const pk = await keyringService.retrievePk(password);
    return pk;
  };

  // This is not used anymore
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
    if (!this.isBooted()) {
      return false;
    }

    const isUnlocked = keyringService.memStore.getState().isUnlocked;
    return isUnlocked;
  };

  lockWallet = async () => {
    await keyringService.setLocked();
    await userWalletService.signOutCurrentUser();
    await userWalletService.clear();
    sessionService.broadcastEvent('accountsChanged', []);
    sessionService.broadcastEvent('lock');
  };

  signOutWallet = async () => {
    await keyringService.updateKeyring();
    await userWalletService.signOutCurrentUser();
    await userWalletService.clear();
    sessionService.broadcastEvent('accountsChanged', []);
  };

  // lockadd here
  lockAdd = async () => {
    await keyringService.setLocked();
    sessionService.broadcastEvent('accountsChanged', []);
    sessionService.broadcastEvent('lock');
    openIndexPage('welcome?add=true');
  };

  // lockadd here
  resetPwd = async () => {
    // WARNING: This resets absolutely everything
    // This is used when the user forgets their password
    // It should only be called from the landing page when the user is logged out
    // And the user should be redirected to the landing page
    // After calling this function

    // TODO: I believe the user should be logged out here
    // e.g. call signOutCurrentUser

    // This clears local storage but a lot is still kept in memory
    await storage.clear();

    // Note that this does not clear the 'booted' state
    // We should fix this, but it would involve making changes to keyringService
    await keyringService.resetKeyRing();
    await keyringService.setLocked();

    sessionService.broadcastEvent('accountsChanged', []);
    sessionService.broadcastEvent('lock');
    // Redirect to welcome so that users can import their account again
    openIndexPage('/welcome');
  };

  // lockadd here
  restoreWallet = async () => {
    const switchingTo = 'mainnet';

    await keyringService.setLocked();

    sessionService.broadcastEvent('accountsChanged', []);
    sessionService.broadcastEvent('lock');
    openIndexPage('restore');
    await this.switchNetwork(switchingTo);
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

  getAddressCacheBalance = (address: string | undefined) => {
    if (!address) return null;
    return preferenceService.getAddressBalance(address);
  };

  setHasOtherProvider = (val: boolean) => preferenceService.setHasOtherProvider(val);
  getHasOtherProvider = () => preferenceService.getHasOtherProvider();

  getExternalLinkAck = () => preferenceService.getExternalLinkAck();

  setExternalLinkAck = (ack) => preferenceService.setExternalLinkAck(ack);

  getLocale = () => preferenceService.getLocale();
  setLocale = (locale: string) => preferenceService.setLocale(locale);

  getLastTimeSendToken = (address: string) => preferenceService.getLastTimeSendToken(address);
  setLastTimeSendToken = (address: string, token: TokenTransaction) =>
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
  addConnectedSite = (
    origin: string,
    name: string,
    icon: string,
    defaultChain = 747,
    isSigned = false
  ) => {
    permissionService.addConnectedSite(origin, name, icon, defaultChain, isSigned);
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
  topConnectedSite = (origin: string) => permissionService.topConnectedSite(origin);
  unpinConnectedSite = (origin: string) => permissionService.unpinConnectedSite(origin);
  /* keyrings */

  clearKeyrings = () => keyringService.clearKeyrings();

  getPrivateKey = async (password: string, address: string) => {
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

  getPrivateKeyForCurrentAccount = async (password) => {
    let privateKey;
    const keyrings = await this.getKeyrings(password || '');

    for (const keyring of keyrings) {
      if (keyring instanceof HDKeyring) {
        const mnemonic = await this.getMnemonics(password || '');
        const seed = await seed2PublicPrivateKey(mnemonic);
        const PK1 = seed.P256.pk;
        const PK2 = seed.SECP256K1.pk;

        // We need to know the signAlgo for the account, so we can use the correct private key
        // The signAlgo is stored in the account object for each public key return from fcl

        // getLoggedInAccount is using currentId from storage to get the account
        // That should tell us the account to use

        try {
          // Try using logged in accounts first
          const account = await getLoggedInAccount();
          const signAlgo =
            typeof account.signAlgo === 'string' ? getSignAlgo(account.signAlgo) : account.signAlgo;
          privateKey = signAlgo === 1 ? PK1 : PK2;
        } catch {
          // Couldn't load from logged in accounts.
          // The signAlgo used to login isn't saved. We need to

          // We may be in the process of switching login. We have a public and private key, but we don't have the signAlgo or the address of the account
          console.error('Error getting logged in account - using the indexer instead');

          // Look for the account using the pubKey
          const network = (await this.getNetwork()) || 'mainnet';
          // Find the address associated with the pubKey
          // This should return an array of address information records
          const addressAndKeyInfoArray = await getAccountsByPublicKeyTuple(seed, network);

          // Follow the same logic as freshUserInfo in openapi.ts
          // Look for the P256 key first
          let index = addressAndKeyInfoArray.findIndex((key) => key.publicKey === seed.P256.pubK);
          if (index === -1) {
            // If no P256 key is found, look for the SECP256K1 key
            index = addressAndKeyInfoArray.findIndex(
              (key) => key.publicKey === seed.SECP256K1.pubK
            );
          } else {
            // If a P256 key is found, use the first key
            index = 0;
          }

          const signAlgo: number = addressAndKeyInfoArray[index].signAlgo;

          privateKey = signAlgo === 1 ? PK1 : PK2;
        }

        break;
      } else if (
        keyring instanceof SimpleKeyring &&
        keyring.wallets &&
        keyring.wallets.length > 0 &&
        keyring.wallets[0].privateKey
      ) {
        privateKey = keyring.wallets[0].privateKey.toString('hex');
        break;
      }
    }
    if (!privateKey) {
      const error = new Error('No mnemonic or private key found in any of the keyrings.');
      throw error;
    }
    return privateKey;
  };

  // Should probably not be exposed
  getPubKey = async (): Promise<PublicKeyTuple> => {
    return await keyringService.getCurrentPublicKeyTuple();
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

  jsonToPrivateKeyHex = async (json: string, password: string): Promise<string | null> => {
    const pk = await jsonToKey(json, password);
    return pk ? Buffer.from(pk.data()).toString('hex') : null;
  };
  findAddressWithPrivateKey = async (pk: string, address: string) => {
    return await findAddressWithPK(pk, address);
  };
  findAddressWithSeedPhrase = async (
    seed: string,
    address: string | null = null,
    derivationPath: string = FLOW_BIP44_PATH,
    passphrase: string = ''
  ): Promise<PublicKeyAccount[]> => {
    return await findAddressWithSeed(seed, address, derivationPath, passphrase);
  };
  getPreMnemonics = () => keyringService.getPreMnemonics();
  generatePreMnemonic = () => keyringService.generatePreMnemonic();
  removePreMnemonics = () => keyringService.removePreMnemonics();
  createKeyringWithMnemonics = async (
    mnemonic,
    derivationPath = FLOW_BIP44_PATH,
    passphrase = ''
  ) => {
    // TODO: NEED REVISIT HERE:
    await keyringService.clearKeyrings();

    const keyring = await keyringService.createKeyringWithMnemonics(
      mnemonic,
      derivationPath,
      passphrase
    );
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
  showAddress = (type: string, address: string) => preferenceService.showAddress(type, address);
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
    if (current?.address === address && current.type === type && current.brandName === brand) {
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
    } catch {
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
      keyringService.currentKeyring
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

  getAllVisibleAccountsArray: () => Promise<PreferenceAccount[]> = () => {
    return keyringService.getAllVisibleAccountsArray();
  };

  getAllClassAccounts: () => Promise<DisplayedKeryring[]> = async () => {
    const typedAccounts = await keyringService.getAllTypedAccounts();

    return typedAccounts.map((account) => ({
      ...account,
      keyring: new DisplayKeyring(account.keyring),
    }));
  };

  changeAccount = (account: PreferenceAccount) => {
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
    type: KeyringType;
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
      if (!Keyring) {
        throw new Error(`No keyring class found for type: ${type}`);
      }
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

  signPersonalMessage = async (type: string, from: string, data: string, options?: any) => {
    const keyring = await keyringService.getKeyringForAccount(from, type);
    const res = await keyringService.signPersonalMessage(keyring, { from, data }, options);
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

  signTransaction = async (type: string, from: string, data: any, options?: any) => {
    const keyring = await keyringService.getKeyringForAccount(from, type);
    const res = await keyringService.signTransaction(keyring, data, options);

    return res;
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
        if (!Keyring) {
          throw new Error(`No keyring class found for type: ${type}`);
        }
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
    } catch {
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

  setIsDefaultWallet = (val: boolean) => preferenceService.setIsDefaultWallet(val);
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

  getIsFirstOpen = () => {
    return preferenceService.getIsFirstOpen();
  };
  updateIsFirstOpen = () => {
    return preferenceService.updateIsFirstOpen();
  };
  // userinfo
  getUserInfo = async (forceRefresh: boolean = false): Promise<UserInfoResponse> => {
    if (!forceRefresh) {
      const data = await userInfoService.getCurrentUserInfo();
      if (data.username.length) {
        return data;
      }
    }
    // Either force refresh or the user info is not set
    return await this.fetchUserInfo();
  };

  fetchUserInfo = async () => {
    const info = await openapiService.userInfo();
    const avatar = this.addTokenForFirebaseImage(info.avatar);

    const updatedUrl = this.replaceAvatarUrl(avatar);

    info.avatar = updatedUrl;
    userInfoService.setCurrentUserInfo(info);
    return info;
  };

  replaceAvatarUrl = (url) => {
    const baseUrl = 'https://source.boringavatars.com/';
    const newBaseUrl = 'https://lilico.app/api/avatar/';

    if (url.startsWith(baseUrl)) {
      return url.replace(baseUrl, newBaseUrl);
    }

    return url;
  };

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
      console.error(err);
      return avatar;
    }
  };

  checkUserChildAccount = async (): Promise<void> => {
    const network = await this.getNetwork();
    const address = await userWalletService.getParentAddress(network);
    if (!address) {
      throw new Error('Parent address not found');
    }

    try {
      const result: ChildAccountMap = await openapiService.checkChildAccountMeta(address);

      if (result) {
        await userWalletService.setChildAccounts(result, address, network);
      }
    } catch (error) {
      console.error('Error occurred:', error);
    }
  };

  checkAccessibleNft = async (childAccount) => {
    try {
      const nfts = await openapiService.checkChildAccountNFT(childAccount);

      return nfts;
    } catch (error) {
      console.error(error, 'error ===');
      return [];
    }
  };

  checkAccessibleFt = async (childAccount) => {
    const network = await this.getNetwork();

    const address = await userWalletService.getParentAddress(network);
    if (!address) {
      throw new Error('Parent address not found');
    }
    const result = await openapiService.queryAccessibleFt(address, childAccount);

    return result;
  };

  getParentAddress = async () => {
    const network = await this.getNetwork();
    const address = await userWalletService.getParentAddress(network);

    return address;
  };

  returnParentWallet = async () => {
    const network = await this.getNetwork();
    const wallet = await userWalletService.returnParentWallet(network);

    return wallet;
  };

  getDashIndex = async () => {
    const dashIndex = await userInfoService.getDashIndex();
    return dashIndex;
  };

  setDashIndex = (data: number) => {
    userInfoService.setDashIndex(data);
  };

  //coinList
  getCoinList = async (_expiry = 60000, currentEnv = ''): Promise<CoinItem[]> => {
    try {
      const network = await this.getNetwork();
      const now = new Date();
      const expiry = coinListService.getExpiry();

      // Determine childType: use currentEnv if not empty, otherwise fallback to active wallet type
      let childType = currentEnv || (await userWalletService.getActiveAccountType());
      childType = childType === 'evm' ? 'evm' : 'coinItem';

      // Otherwise, fetch from the coinListService
      const listCoins = coinListService.listCoins(network, childType);

      // Validate and ensure listCoins is of type CoinItem[]
      if (
        !listCoins ||
        !Array.isArray(listCoins) ||
        listCoins.length === 0 ||
        now.getTime() > expiry
      ) {
        console.log('listCoins is empty or invalid, refreshing...');
        let refreshedList;
        if (childType === 'evm') {
          refreshedList = await this.refreshEvmList(_expiry);
        } else {
          refreshedList = await this.refreshCoinList(_expiry);
        }
        if (refreshedList) {
          return refreshedList;
        }
      }

      return listCoins;
    } catch (error) {
      console.error('Error fetching coin list:', error);
      throw new Error('Failed to fetch coin list'); // Re-throw the error with a custom message
    }
  };

  private async getFlowTokenPrice(flowPrice?: string): Promise<any> {
    const cachedFlowTokenPrice = await storage.getExpiry('flowTokenPrice');
    if (cachedFlowTokenPrice) {
      if (flowPrice) {
        cachedFlowTokenPrice.price.last = flowPrice;
      }
      return cachedFlowTokenPrice;
    }
    const result = await openapiService.getTokenPrice('flow');
    if (flowPrice) {
      result.price.last = flowPrice;
    }
    await storage.setExpiry('flowTokenPrice', result, 300000); // Cache for 5 minutes
    return result;
  }

  private async calculateTokenPrice(token: string, price: string | null): Promise<any> {
    if (price) {
      return { price: { last: price, change: { percentage: '0.0' } } };
    } else {
      return { price: { last: '0.0', change: { percentage: '0.0' } } };
    }
  }

  private async tokenPrice(
    tokenSymbol: string,
    address: string,
    data: Record<string, any>,
    contractName: string
  ) {
    const token = tokenSymbol.toLowerCase();
    const key = `${contractName.toLowerCase()}${address.toLowerCase()}`;
    const price = await openapiService.getPricesByKey(key, data);

    if (token === 'flow') {
      const flowPrice = price || data['FLOW'];
      return this.getFlowTokenPrice(flowPrice);
    }

    return this.calculateTokenPrice(token, price);
  }

  private async evmtokenPrice(tokeninfo, data) {
    const token = tokeninfo.symbol.toLowerCase();
    const price = await openapiService.getPricesByEvmaddress(
      tokeninfo.evmAddress || tokeninfo.address,
      data
    );

    if (token === 'flow') {
      const flowPrice = price || data['FLOW'];
      return this.getFlowTokenPrice(flowPrice);
    }

    return this.calculateTokenPrice(token, price);
  }

  /**
   * Refreshes coin list with updated balances and prices
   * @param _expiry Expiry time in milliseconds
   * @returns Array of coin items
   */
  refreshCoinList = async (_expiry = 60000): Promise<CoinItem[]> => {
    try {
      const isChild = await this.getActiveWallet();

      // Handle EVM wallets
      if (isEvmAccountType(isChild)) {
        return await this.refreshEvmList(_expiry);
      }

      // Set expiry
      const now = new Date();
      const exp = _expiry + now.getTime();
      coinListService.setExpiry(exp);

      // Get network and address
      const network = await this.getNetwork();
      const address = await this.getCurrentAddress();

      // Fetch token list, balances and prices in parallel
      const [tokenList, allBalanceMap, priceData] = await Promise.all([
        openapiService.getEnabledTokenList(network),
        openapiService.getTokenBalanceStorage(address || '0x'),
        openapiService.getTokenPrices('pricesMap'),
      ]);

      // Check if price data is empty
      const isPriceDataEmpty =
        Object.keys(priceData).length === 0 && priceData.constructor === Object;
      const defaultPrice = { price: { last: '0.0', change: { percentage: '0.0' } } };

      // Process token prices in parallel with optimized error handling
      const allPrice = await Promise.all(
        tokenList.map(async (token) => {
          try {
            if (isPriceDataEmpty) {
              return defaultPrice;
            }
            return await this.tokenPrice(
              token.symbol,
              token.address,
              priceData,
              token.contractName
            );
          } catch (error) {
            console.error(`Error fetching price for token ${token.address}:`, error);
            return null;
          }
        })
      );

      // Map tokens to coin items
      const coins = this.mapTokensBalancePrice(tokenList, allBalanceMap, allPrice, isChild);

      // Update storage
      await coinListService.addCoins(coins, network);

      return coins;
    } catch (err) {
      if (err.message === 'Operation aborted') {
        console.error('refreshCoinList operation aborted.');
      } else {
        console.error('refreshCoinList encountered an error:', err);
      }
      throw err;
    }
  };

  /**
   * Maps token data with balances and prices to create CoinItem objects
   * @param tokenList List of tokens
   * @param balanceMap Map of token balances
   * @param priceData Price data for tokens
   * @param isChild Whether this is a child account
   * @param availableFlowBalance Available flow balance for non-child accounts
   * @returns Array of CoinItem objects
   */
  mapTokensBalancePrice = (
    tokenList: any[],
    balanceMap: { [key: string]: string },
    priceData: any[],
    isChild: FlowAddress | null
  ): CoinItem[] => {
    return tokenList.map((token, index): CoinItem => {
      const tokenId = `A.${token.address.slice(2)}.${token.contractName}`;
      const tokenIdVault = `A.${token.address.slice(2)}.${token.contractName}.Vault`;
      const isFlow = token.symbol.toLowerCase() === 'flow';

      // Get balance from balanceMap
      const balance = isFlow
        ? balanceMap['availableFlowToken'] || '0'
        : balanceMap[tokenIdVault] || '0';

      // Get price data
      const priceInfo = priceData[index] || null;
      const price = priceInfo && priceInfo.price ? new BN(priceInfo.price.last).toNumber() : 0;

      // Calculate change percentage
      const change24h =
        priceInfo && priceInfo.price && priceInfo.price.change
          ? new BN(priceInfo.price.change.percentage).multipliedBy(100).toNumber()
          : 0;

      // Calculate total value
      const total = price > 0 ? this.currencyBalance(balance, priceInfo.price.last) : 0;

      return {
        id: tokenId,
        coin: token.name,
        unit: token.symbol.toLowerCase(),
        icon: token['logoURI'] || '',
        balance: balance,
        availableBalance: isFlow && !isChild ? balance : undefined,
        price: price,
        change24h: change24h,
        total: total,

        // Token metadata
        chainId: token.chainId,
        address: token.address,
        contractName: token.contractName,
        path: token.path
          ? {
              vault: token.path.vault,
              receiver: token.path.receiver,
              balance: token.path.balance,
            }
          : undefined,
        symbol: token.symbol,
        name: token.name,
        description: token.description,
        decimals: token.decimals,
        logoURI: token.logoURI,
        tags: token.tags,
        evmAddress: token.evmAddress,
        evm_address: token.evm_address,
        flowAddress: token.flowAddress,
      };
    });
  };

  refreshEvmList = async (_expiry = 60000): Promise<CoinItem[]> => {
    const now = new Date();
    const exp = _expiry + now.getTime();
    coinListService.setExpiry(exp);

    const network = await this.getNetwork();
    const evmCustomToken = (await storage.get(`${network}evmCustomToken`)) || [];

    const tokenList = await openapiService.getTokenList(network);

    const address = await this.getRawEvmAddressWithPrefix();
    if (!isValidEthereumAddress(address)) {
      throw new Error('Invalid Ethereum address in coinlist');
    }

    const allBalanceMap = await openapiService.getEvmFT(address || '0x', network);

    const flowBalance = await this.getBalance(address);

    const mergeBalances = (tokenList, allBalanceMap, flowBalance) => {
      return tokenList.map((token) => {
        const balanceInfo = allBalanceMap.find((balance) => {
          return balance.address.toLowerCase() === token.address.toLowerCase();
        });
        const balanceBN = balanceInfo
          ? new BN(balanceInfo.balance).div(new BN(10).pow(new BN(balanceInfo.decimals)))
          : new BN(0);

        let balance = balanceBN.toString();
        if (token.symbol.toLowerCase() === 'flow') {
          const flowBalanceBN = new BN(flowBalance).div(new BN(10).pow(new BN(18)));
          balance = flowBalanceBN.toString();
        }

        return {
          ...token,
          balance,
        };
      });
    };

    const customToken = (coins: CoinItem[], evmCustomToken: any): CoinItem[] => {
      const updatedList = [...coins];

      evmCustomToken.forEach((customToken) => {
        // Check if the customToken already exists in mergedList
        const existingToken = updatedList.find((token) => {
          return token.unit.toLowerCase() === customToken.unit.toLowerCase();
        });

        if (existingToken) {
          existingToken.custom = true;
        } else {
          updatedList.push({
            custom: true,
            coin: customToken.coin,
            unit: customToken.unit,
            icon: '',
            balance: '0',
            price: 0,
            change24h: 0,
            total: 0,
            id: '',
          });
        }
      });

      return updatedList;
    };

    const mergedList = await mergeBalances(tokenList, allBalanceMap, flowBalance);

    const data = await openapiService.getTokenPrices('pricesMap');
    const prices = tokenList.map((token) => this.evmtokenPrice(token, data));
    const allPrice = await Promise.all(prices);
    const coins: CoinItem[] = mergedList.map((token, index) => {
      const tokenId = `A.${token.address.slice(2)}.${token.contractName || token.symbol}`;
      return {
        id: token.flowIdentifier || tokenId,
        coin: token.name,
        unit: token.symbol.toLowerCase(),
        icon: token['logoURI'] || placeholder,
        balance: token.balance,
        price: allPrice[index] === null ? 0 : new BN(allPrice[index].price.last).toNumber(),
        change24h:
          allPrice[index] === null || !allPrice[index].price || !allPrice[index].price.change
            ? 0
            : new BN(allPrice[index].price.change.percentage).multipliedBy(100).toNumber(),
        total:
          allPrice[index] === null
            ? 0
            : this.currencyBalance(token.balance, allPrice[index].price.last),
        custom: token.custom,
      };
    });

    const coinWithCustom = await customToken(coins, evmCustomToken);
    coinListService.addCoins(coinWithCustom, network, 'evm');
    return coinWithCustom;
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

  private currencyBalance = (balance: string, price) => {
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

  getRecent = async (): Promise<Contact[]> => {
    const network = await this.getNetwork();
    return addressBookService.getRecent(network);
  };

  getAddressBook = async (): Promise<Contact[]> => {
    const network = await this.getNetwork();
    const addressBook = await addressBookService.getAddressBook(network);
    if (!addressBook) {
      return await this.refreshAddressBook();
    } else if (!addressBook[0]) {
      return await this.refreshAddressBook();
    }
    return addressBook;
  };

  refreshAddressBook = async (): Promise<Contact[]> => {
    const network = await this.getNetwork();
    const { data } = await openapiService.getAddressBook();
    const list = data.contacts;
    if (list && list.length > 0) {
      list.forEach((addressBook, index) => {
        if (addressBook && addressBook.avatar) {
          list[index].avatar = this.addTokenForFirebaseImage(addressBook.avatar);
        }
      });
    }
    addressBookService.setAddressBook(list, network);
    return list;
  };

  searchByUsername = async (searchKey: string) => {
    const apiResponse = await openapiService.searchUser(searchKey);
    console.log('searchByUsername -apiResponse', apiResponse);

    return (
      apiResponse?.data?.users?.map((user, index): Contact => {
        const address = withPrefix(user.address) || '';
        return {
          group: 'Flow Wallet User',
          address: address,
          contact_name: user.nickname,
          username: user.username,
          avatar: user.avatar,
          domain: {
            domain_type: 999,
            value: '',
          },
          contact_type: ContactType.User,
          id: index,
        };
      }) || []
    );
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

  /*
   * Load the main (flow) accounts for the current private key
   */

  loadMainAccounts = async () => {
    const network = await this.getNetwork();

    // Get the current public key tuple
    const pubKey: PublicKeyTuple = await keyringService.getCurrentPublicKeyTuple();
    // Get the accounts for the current public key
    const accounts: PublicKeyAccount[] = await getAccountsByPublicKeyTuple(pubKey, network);
    // If there are no accounts, throw an error
    if (!accounts || accounts.length === 0) {
      throw new Error("Can't find address in chain");
    }

    // Get the emoji list
    const emoji = await this.getEmoji();

    // Transform the address array into MainAccount objects
    const transformedArray: MainAccount[] = accounts.map((item, index): MainAccount => {
      const defaultEmoji = emoji[index] || {
        name: 'Default',
        emoji: '🐾',
        bgcolor: '#ffffff',
      };

      return {
        ...item,
        chain: network === 'mainnet' ? 747 : 545,
        id: index,
        name: defaultEmoji.name,
        icon: defaultEmoji.emoji,
        color: defaultEmoji.bgcolor,
      };
    });

    // Set the main accounts in userWalletService
    const currentAccount = userWalletService.setMainAccounts(
      transformedArray,
      // Always use the first account's public key as the current public key
      accounts[0].publicKey,
      network
    );
    if (!currentAccount) {
      throw new Error('Current account not found');
    }
    return currentAccount;
  };

  getMainAccounts = async (): Promise<MainAccount[] | null> => {
    if (!(await this.isUnlocked())) {
      return null;
    }
    const network = await this.getNetwork();
    const wallets = await userWalletService.getMainAccounts(network);
    if (!wallets) {
      const refreshData = await this.loadMainAccounts();
      if (!refreshData) {
        return null;
      }
      return refreshData[0].accounts;
    }
    return wallets;
  };

  getActiveWallet = async () => {
    const activeWallet = await userWalletService.getActiveAccountType();
    return activeWallet;
  };

  /*
   * Sets the active main wallet and current child wallet
   * This is used to switch between main accounts or switch from main to child wallet
   *
   * wallet: BlockchainResponse, // The wallet to set as active
   * key: ActiveChildType | null, // null for main wallet
   * index: number | null = null // The index of the main wallet in the array to switch to
   */
  setActiveWallet = async (
    wallet: WalletAccount,
    key: ActiveChildType | null,
    index: number | null = null
  ) => {
    await userWalletService.setCurrentAccount(wallet, key);

    // Clear collections
    this.clearNFTCollection();
    this.clearEvmNFTList();
    this.clearCoinList();

    // If switching main wallet, refresh the EVM wallet
    if (key === null) {
      this.refreshEvmWallets();
      await this.queryEvmAddress(wallet.address);
    }
  };

  hasCurrentWallet = async () => {
    const wallet = await userWalletService.getCurrentWallet();
    return wallet?.address !== '';
  };

  getCurrentWallet = async (): Promise<WalletAccount | undefined> => {
    if (!this.isBooted() || userWalletService.isLocked()) {
      return;
    }
    const wallet = await userWalletService.getCurrentWallet();
    if (!wallet?.address) {
      const data = await this.loadMainAccounts();
      if (!data) {
        return;
      }
      return data[0].accounts[0];
    }
    return wallet;
  };

  getEvmWallet = async () => {
    const wallet = await userWalletService.getEvmWallet();
    return wallet;
  };

  getRawEvmAddressWithPrefix = async (): Promise<EvmAddress | null> => {
    // Get the current EVM address without throwing an error
    const evmAddress = userWalletService.getCurrentEvmAddress();
    if (!evmAddress) {
      return null;
    }
    return withPrefix(evmAddress) as EvmAddress;
  };

  getEvmAddress = async () => {
    const address = await this.getRawEvmAddressWithPrefix();

    if (!isValidEthereumAddress(address)) {
      throw new Error(`Invalid Ethereum address ${address}`);
    }
    return address;
  };

  getCurrentAddress = async (): Promise<WalletAddress | null> => {
    const address = await userWalletService.getCurrentAddress();
    if (!address) {
      const data = await this.loadMainAccounts();
      if (!data) {
        return null;
      }
      return withPrefix(data[0].accounts[0].address);
    }
    return withPrefix(address);
  };

  getMainAddress = async (): Promise<FlowAddress | null> => {
    if (!this.isBooted() || userWalletService.isLocked()) {
      return null;
    }
    const network = await this.getNetwork();
    const address = await userWalletService.getParentAddress(network);
    if (!isValidFlowAddress(address)) {
      const data = await this.loadMainAccounts();
      if (!data) {
        return null;
      }
      const address = withPrefix(data[0].accounts[0].address);
      return isValidFlowAddress(address) ? address : null;
    } else {
      const prefixedAddress = withPrefix(address);
      return isValidFlowAddress(prefixedAddress) ? prefixedAddress : null;
    }
  };

  sendTransaction = async (cadence: string, args: any[]): Promise<string> => {
    return await userWalletService.sendTransaction(cadence, args);
  };

  createCOA = async (amount = '0.0'): Promise<string> => {
    const formattedAmount = parseFloat(amount).toFixed(8);

    const script = await getScripts('evm', 'createCoa');

    const txID = await userWalletService.sendTransaction(script, [
      fcl.arg(formattedAmount, t.UFix64),
    ]);

    // try to seal it
    try {
      const result = await fcl.tx(txID).onceExecuted();
      console.log('coa creation result ', result);
      // Track with success
      await this.trackCoaCreation(txID);
    } catch (error) {
      console.error('Error sealing transaction:', error);
      // Track with error
      await this.trackCoaCreation(txID, error.message);
    }

    return txID;
  };

  createCoaEmpty = async (): Promise<string> => {
    await this.getNetwork();

    const script = await getScripts('evm', 'createCoaEmpty');

    const txID = await userWalletService.sendTransaction(script, []);

    // try to seal it
    try {
      const result = await fcl.tx(txID).onceExecuted();
      console.log('coa creation result ', result);
      // Track with success
      await this.trackCoaCreation(txID);
    } catch (error) {
      console.error('Error sealing transaction:', error);
      // Track with error
      await this.trackCoaCreation(txID, error.message);
    }

    return txID;
  };

  trackCoaCreation = async (txID: string, errorMessage?: string) => {
    mixpanelTrack.track('coa_creation', {
      tx_id: txID,
      flow_address: (await this.getCurrentAddress()) || '',
      error_message: errorMessage,
    });
  };

  // Master send token function that takes a transaction state from the front end and returns the transaction ID
  transferTokens = async (transactionState: TransactionState): Promise<string> => {
    const transferTokensOnCadence = async () => {
      return this.transferCadenceTokens(
        transactionState.selectedToken.symbol,
        transactionState.toAddress,
        transactionState.amount
      );
    };

    const transferTokensFromChildToCadence = async () => {
      return this.sendFTfromChild(
        transactionState.fromAddress,
        transactionState.toAddress,
        'flowTokenProvider',
        transactionState.amount,
        transactionState.selectedToken.symbol
      );
    };

    const transferFlowFromEvmToCadence = async () => {
      return this.withdrawFlowEvm(transactionState.amount, transactionState.toAddress);
    };

    const transferFTFromEvmToCadence = async () => {
      return this.transferFTFromEvm(
        transactionState.selectedToken['flowIdentifier'],
        transactionState.amount,
        transactionState.toAddress,
        transactionState.selectedToken
      );
    };

    // Returns the transaction ID
    const transferTokensOnEvm = async () => {
      let address, gas, value, data;

      if (transactionState.selectedToken.symbol.toLowerCase() === 'flow') {
        address = transactionState.toAddress;
        gas = '1';
        // the amount is always stored as a string in the transaction state
        const integerAmountStr = convertToIntegerAmount(
          transactionState.amount,
          // Flow needs 18 digits always for EVM
          18
        );
        value = new BN(integerAmountStr).toString(16);
        data = '0x';
      } else {
        const integerAmountStr = convertToIntegerAmount(
          transactionState.amount,
          transactionState.selectedToken.decimals
        );

        // Get the current network
        const network = await this.getNetwork();
        // Get the Web3 provider
        const provider = new Web3.providers.HttpProvider(EVM_ENDPOINT[network]);
        // Get the web3 instance
        const web3Instance = new Web3(provider);
        // Get the erc20 contract
        const erc20Contract = new web3Instance.eth.Contract(
          erc20ABI,
          transactionState.selectedToken.address
        );
        // Encode the data
        const encodedData = erc20Contract.methods
          .transfer(ensureEvmAddressPrefix(transactionState.toAddress), integerAmountStr)
          .encodeABI();
        gas = '1312d00';
        address = ensureEvmAddressPrefix(transactionState.selectedToken.address);
        value = '0x0'; // Zero value as hex
        data = encodedData.startsWith('0x') ? encodedData : `0x${encodedData}`;
      }

      // Send the transaction
      return this.sendEvmTransaction(address, gas, value, data);
    };

    const transferFlowFromCadenceToEvm = async () => {
      return this.transferFlowEvm(transactionState.toAddress, transactionState.amount);
    };

    const transferFTFromCadenceToEvm = async () => {
      const address = transactionState.selectedToken!.address.startsWith('0x')
        ? transactionState.selectedToken!.address.slice(2)
        : transactionState.selectedToken!.address;

      return this.transferFTToEvmV2(
        `A.${address}.${transactionState.selectedToken!.contractName}.Vault`,
        transactionState.amount,
        transactionState.toAddress
      );
    };

    // Validate the amount. Just to be sure!
    if (!validateAmount(transactionState.amount, transactionState.selectedToken.decimals)) {
      throw new Error('Invalid amount or decimal places');
    }

    // Switch on the current transaction state
    switch (transactionState.currentTxState) {
      case 'FTFromEvmToCadence':
        return await transferFTFromEvmToCadence();
      case 'FlowFromEvmToCadence':
        return await transferFlowFromEvmToCadence();
      case 'FTFromChildToCadence':
      case 'FlowFromChildToCadence':
        return await transferTokensFromChildToCadence();
      case 'FTFromCadenceToCadence':
      case 'FlowFromCadenceToCadence':
        return await transferTokensOnCadence();
      case 'FlowFromEvmToEvm':
      case 'FTFromEvmToEvm':
        return await transferTokensOnEvm();
      case 'FlowFromCadenceToEvm':
        return await transferFlowFromCadenceToEvm();
      case 'FTFromCadenceToEvm':
        return await transferFTFromCadenceToEvm();
      default:
        throw new Error(`Unsupported transaction state: ${transactionState.currentTxState}`);
    }
  };

  transferFlowEvm = async (
    recipientEVMAddressHex: string,
    amount = '1.0',
    gasLimit = 30000000
  ): Promise<string> => {
    const script = await getScripts('evm', 'transferFlowToEvmAddress');
    if (recipientEVMAddressHex.startsWith('0x')) {
      recipientEVMAddressHex = recipientEVMAddressHex.substring(2);
    }

    const txID = await userWalletService.sendTransaction(script, [
      fcl.arg(recipientEVMAddressHex, t.String),
      fcl.arg(amount, t.UFix64),
      fcl.arg(gasLimit, t.UInt64),
    ]);

    mixpanelTrack.track('ft_transfer', {
      from_address: (await this.getCurrentAddress()) || '',
      to_address: recipientEVMAddressHex,
      amount: amount,
      ft_identifier: 'FLOW',
      type: 'evm',
    });

    return txID;
  };

  transferFTToEvm = async (
    tokenContractAddress: string,
    tokenContractName: string,
    amount = '1.0',
    contractEVMAddress: string,
    data
  ): Promise<string> => {
    const script = await getScripts('bridge', 'bridgeTokensToEvmAddress');
    if (contractEVMAddress.startsWith('0x')) {
      contractEVMAddress = contractEVMAddress.substring(2);
    }
    const dataBuffer = Buffer.from(data.slice(2), 'hex');
    const dataArray = Uint8Array.from(dataBuffer);
    const regularArray = Array.from(dataArray);
    const gasLimit = 30000000;

    const txID = await userWalletService.sendTransaction(script, [
      fcl.arg(tokenContractAddress, t.Address),
      fcl.arg(tokenContractName, t.String),
      fcl.arg(amount, t.UFix64),
      fcl.arg(contractEVMAddress, t.String),
      fcl.arg(regularArray, t.Array(t.UInt8)),
      fcl.arg(gasLimit, t.UInt64),
    ]);
    mixpanelTrack.track('ft_transfer', {
      from_address: (await this.getCurrentAddress()) || '',
      to_address: tokenContractAddress,
      amount: amount,
      ft_identifier: tokenContractName,
      type: 'evm',
    });
    return txID;
  };

  transferFTToEvmV2 = async (
    vaultIdentifier: string,
    amount = '0.0',
    recipient: string
  ): Promise<string> => {
    const script = await getScripts('bridge', 'bridgeTokensToEvmAddressV2');

    const txID = await userWalletService.sendTransaction(script, [
      fcl.arg(vaultIdentifier, t.String),
      fcl.arg(amount, t.UFix64),
      fcl.arg(recipient, t.String),
    ]);

    mixpanelTrack.track('ft_transfer', {
      from_address: (await this.getCurrentAddress()) || '',
      to_address: recipient,
      amount: amount,
      ft_identifier: vaultIdentifier,
      type: 'evm',
    });

    return txID;
  };

  transferFTFromEvm = async (
    flowidentifier: string,
    amount: string,
    receiver: string,
    tokenResult: TokenInfo
  ): Promise<string> => {
    const decimals = tokenResult.decimals ?? 18;
    if (decimals < 0 || decimals > 77) {
      // 77 is BN.js max safe decimals
      throw new Error('Invalid decimals');
    }

    const integerAmountStr = convertToIntegerAmount(amount, decimals);

    const script = await getScripts('bridge', 'bridgeTokensFromEvmToFlowV3');
    const txID = await userWalletService.sendTransaction(script, [
      fcl.arg(flowidentifier, t.String),
      fcl.arg(integerAmountStr, t.UInt256),
      fcl.arg(receiver, t.Address),
    ]);

    mixpanelTrack.track('ft_transfer', {
      from_address: (await this.getCurrentAddress()) || '',
      to_address: receiver,
      amount: amount,
      ft_identifier: flowidentifier,
      type: 'evm',
    });

    return txID;
  };

  withdrawFlowEvm = async (amount = '0.0', address: string): Promise<string> => {
    const script = await getScripts('evm', 'withdrawCoa');

    const txID = await userWalletService.sendTransaction(script, [
      fcl.arg(amount, t.UFix64),
      fcl.arg(address, t.Address),
    ]);

    return txID;
  };

  fundFlowEvm = async (amount = '1.0'): Promise<string> => {
    const script = await getScripts('evm', 'fundCoa');

    return await userWalletService.sendTransaction(script, [fcl.arg(amount, t.UFix64)]);
  };

  coaLink = async (): Promise<string> => {
    await this.getNetwork();

    const script = await getScripts('evm', 'coaLink');

    // TODO: check if args are needed
    const result = await userWalletService.sendTransaction(script, []);
    console.log('coaLink resutl ', result);
    return result;
  };

  checkCoaLink = async (): Promise<boolean> => {
    const checkedAddress = await storage.get('coacheckAddress');

    const script = await getScripts('evm', 'checkCoaLink');
    const mainAddress = await this.getMainAddress();
    console.log('getscript script ', mainAddress);
    if (checkedAddress === mainAddress) {
      return true;
    } else if (mainAddress) {
      const result = await fcl.query({
        cadence: script,
        args: (arg, t) => [arg(mainAddress, t.Address)],
      });
      if (result) {
        await storage.set('coacheckAddress', mainAddress);
      }
      return !!result;
    }
    return false;
  };

  bridgeToEvm = async (flowIdentifier, amount = '1.0'): Promise<string> => {
    const script = await getScripts('bridge', 'bridgeTokensToEvmV2');

    const txID = await userWalletService.sendTransaction(script, [
      fcl.arg(flowIdentifier, t.String),
      fcl.arg(amount, t.UFix64),
    ]);

    mixpanelTrack.track('ft_transfer', {
      from_address: (await this.getCurrentAddress()) || '',
      to_address: (await this.getRawEvmAddressWithPrefix()) ?? '',
      amount: amount,
      ft_identifier: flowIdentifier,
      type: 'evm',
    });

    return txID;
  };

  bridgeToFlow = async (flowIdentifier, amount = '1.0', tokenResult): Promise<string> => {
    const decimals = tokenResult.decimals ?? 18;
    if (decimals < 0 || decimals > 77) {
      // 77 is BN.js max safe decimals
      throw new Error('Invalid decimals');
    }
    const integerAmountStr = convertToIntegerAmount(amount, decimals);

    const script = await getScripts('bridge', 'bridgeTokensFromEvmV2');
    const txID = await userWalletService.sendTransaction(script, [
      fcl.arg(flowIdentifier, t.String),
      fcl.arg(integerAmountStr, t.UInt256),
    ]);

    mixpanelTrack.track('ft_transfer', {
      from_address: (await this.getRawEvmAddressWithPrefix()) ?? '',
      to_address: (await this.getCurrentAddress()) || '',
      amount: amount,
      ft_identifier: flowIdentifier,
      type: 'flow',
    });

    return txID;
  };

  queryEvmAddress = async (address: string | FlowAddress): Promise<string | null> => {
    if (address.length > 20) {
      return null;
    }
    if (!(await this.isUnlocked())) {
      return null;
    }
    let evmAddress;
    try {
      evmAddress = await this.getRawEvmAddressWithPrefix();
    } catch (error) {
      evmAddress = '';
      console.error('Error getting EVM address:', error);
    }
    if (isValidEthereumAddress(evmAddress)) {
      return evmAddress;
    }
    // Otherwise, refresh the EVM wallets and try again
    await this.refreshEvmWallets();

    try {
      const script = await getScripts('evm', 'getCoaAddr');
      const result = await fcl.query({
        cadence: script,
        args: (arg, t) => [arg(address, t.Address)],
      });

      if (result) {
        // This is the COA address we get straight from the script
        // This is where we encode the address in ERC-55 format
        const checksummedAddress = ethUtil.toChecksumAddress(ensureEvmAddressPrefix(result));
        await userWalletService.setAccountEvmAddress(checksummedAddress as EvmAddress);
        return checksummedAddress;
      } else {
        // If the script returns null, we need to clear the EVM address
        await userWalletService.setAccountEvmAddress(null);
        return null;
      }
    } catch (error) {
      console.trace('queryEvmAddress error', address);

      console.error('Error querying the script or setting EVM address:', error);
      return null;
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
  };

  sendEvmTransaction = async (to: string, gas: string | number, value: string, data: string) => {
    if (to.startsWith('0x')) {
      to = to.substring(2);
    }
    await this.getNetwork();

    const script = await getScripts('evm', 'callContractV2');
    const gasLimit = 30000000;
    const dataBuffer = Buffer.from(data.slice(2), 'hex');
    const dataArray = Uint8Array.from(dataBuffer);
    const regularArray = Array.from(dataArray);

    // Handle the case where the value is '0.0'
    if (/^0\.0+$/.test(value)) {
      value = '0x0';
    }

    if (!value.startsWith('0x')) {
      value = '0x' + value;
    }

    // At this point the value should be a valid hex string. Check to make sure
    if (!/^0x[0-9a-fA-F]+$/.test(value)) {
      throw new Error('Invalid hex string value');
    }

    // Convert hex to BigInt
    const transactionValue = value === '0x' ? BigInt(0) : BigInt(value);

    const result = await userWalletService.sendTransaction(script, [
      fcl.arg(to, t.String),
      fcl.arg(transactionValue.toString(), t.UInt256),
      fcl.arg(regularArray, t.Array(t.UInt8)),
      fcl.arg(gasLimit, t.UInt64),
    ]);

    mixpanelTrack.track('ft_transfer', {
      from_address: (await this.getRawEvmAddressWithPrefix()) ?? '',
      to_address: to,
      amount: value,
      ft_identifier: 'FLOW',
      type: 'evm',
    });

    return result;
  };

  dapSendEvmTX = async (to: string, gas: bigint, value: string, data: string) => {
    if (to.startsWith('0x')) {
      to = to.substring(2);
    }
    await this.getNetwork();

    const script = await getScripts('evm', 'callContractV2');
    const gasLimit = gas || 30000000;
    const dataBuffer = Buffer.from(data.slice(2), 'hex');
    const dataArray = Uint8Array.from(dataBuffer);
    const regularArray = Array.from(dataArray);

    // Handle the case where the value is '0.0'
    if (/^0\.0+$/.test(value)) {
      value = '0x0';
    }

    if (!value.startsWith('0x')) {
      value = '0x' + value;
    }

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
    // At this point the value should be a valid hex string. Check to make sure
    if (!/^0x[0-9a-fA-F]+$/.test(value)) {
      throw new Error('Invalid hex string value');
    }
    // Convert hex to BigInt directly to avoid potential number overflow
    const transactionValue = value === '0x' ? BigInt(0) : BigInt(value);

    await userWalletService.sendTransaction(script, [
      fcl.arg(to, t.String),
      fcl.arg(transactionValue.toString(), t.UInt256),
      fcl.arg(regularArray, t.Array(t.UInt8)),
      fcl.arg(gasLimit.toString(), t.UInt64),
    ]);

    let evmAddress = await this.getEvmAddress();

    mixpanelTrack.track('ft_transfer', {
      from_address: evmAddress,
      to_address: to,
      amount: transactionValue.toString(),
      ft_identifier: 'FLOW',
      type: 'evm',
    });

    if (evmAddress.startsWith('0x')) {
      evmAddress = evmAddress.substring(2) as EvmAddress;
    }

    const addressNonce = await this.getNonce(evmAddress);

    const keccak256 = (data: Buffer) => {
      return ethUtil.keccak256(data);
    };

    // [nonce, gasPrice, gasLimit, to.addressData, value, data, v, r, s]

    const directCallTxType = 255;
    const contractCallSubType = 5;
    const noceNumber = Number(addressNonce);
    const gasPrice = 0;
    const transaction = [
      noceNumber, // nonce
      gasPrice, // Fixed value
      gasLimit, // Gas Limit
      Buffer.from(to, 'hex'), // To Address
      transactionValue, // Value
      Buffer.from(dataArray), // Call Data
      directCallTxType, // Fixed value
      BigInt('0x' + evmAddress), // From Account
      contractCallSubType, // SubType
    ];
    const encodedData = encode(transaction);
    const hash = keccak256(Buffer.from(encodedData));
    const hashHexString = Buffer.from(hash).toString('hex');
    if (hashHexString) {
      return hashHexString;
    } else {
      return null;
    }
  };

  getBalance = async (hexEncodedAddress: string): Promise<string> => {
    await this.getNetwork();

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
    const cacheKey = `checkFlowBalance${address}`;
    let balance = await storage.getExpiry(cacheKey);
    const ttl = 1 * 60 * 1000;
    if (!balance) {
      try {
        const account = await fcl.send([fcl.getAccount(address!)]).then(fcl.decode);
        balance = account.balance;
        if (balance) {
          // Store the result in the cache with an expiry
          await storage.setExpiry(cacheKey, balance, ttl);
        }
      } catch (error) {
        console.error('Error occurred:', error);
        return {}; // Return an empty object in case of an error
      }
    }

    return balance;
  };

  getNonce = async (hexEncodedAddress: string): Promise<string> => {
    await this.getNetwork();

    const script = await getScripts('evm', 'getNonce');

    const result = await fcl.query({
      cadence: script,
      args: (arg, t) => [arg(hexEncodedAddress, t.String)],
    });
    return result;
  };

  getChildAccounts = async (): Promise<ChildAccountMap | null> => {
    return await userWalletService.getChildAccounts();
  };

  unlinkChildAccount = async (address: string): Promise<string> => {
    await this.getNetwork();
    const script = await getScripts('hybridCustody', 'getChildAccountMeta');

    return await userWalletService.sendTransaction(script, [fcl.arg(address, t.Address)]);
  };

  unlinkChildAccountV2 = async (address: string): Promise<string> => {
    await this.getNetwork();
    const script = await getScripts('hybridCustody', 'unlinkChildAccount');

    return await userWalletService.sendTransaction(script, [fcl.arg(address, t.Address)]);
  };

  editChildAccount = async (
    address: string,
    name: string,
    description: string,
    thumbnail: string
  ): Promise<string> => {
    await this.getNetwork();
    const script = await getScripts('hybridCustody', 'editChildAccount');

    return await userWalletService.sendTransaction(script, [
      fcl.arg(address, t.Address),
      fcl.arg(name, t.String),
      fcl.arg(description, t.String),
      fcl.arg(thumbnail, t.String),
    ]);
  };

  // TODO: Replace with generic token
  transferCadenceTokens = async (
    symbol: string,
    address: string,
    amount: string
  ): Promise<string> => {
    const token = await openapiService.getTokenInfo(symbol);
    const script = await getScripts('ft', 'transferTokensV3');

    if (!token) {
      throw new Error(`Invaild token name - ${symbol}`);
    }
    // Validate the amount just to be safe
    if (!validateAmount(amount, token.decimals)) {
      throw new Error(`Invalid amount - ${amount}`);
    }

    await this.getNetwork();

    const txID = await userWalletService.sendTransaction(
      script
        .replaceAll('<Token>', token.contractName)
        .replaceAll('<TokenBalancePath>', token.path.balance)
        .replaceAll('<TokenReceiverPath>', token.path.receiver)
        .replaceAll('<TokenStoragePath>', token.path.vault)
        .replaceAll('<TokenAddress>', token.address),
      [fcl.arg(amount, t.UFix64), fcl.arg(address, t.Address)]
    );

    mixpanelTrack.track('ft_transfer', {
      from_address: (await this.getCurrentAddress()) || '',
      to_address: address,
      amount: amount,
      ft_identifier: token.contractName,
      type: 'flow',
    });

    return txID;
  };

  revokeKey = async (index: string): Promise<string> => {
    const script = await getScripts('basic', 'revokeKey');

    return await userWalletService.sendTransaction(script, [fcl.arg(index, t.Int)]);
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

  enableTokenStorage = async (symbol: string) => {
    const token = await openapiService.getTokenInfo(symbol);
    if (!token) {
      return;
    }
    await this.getNetwork();
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

  enableNFTStorageLocal = async (token: NFTModelV2) => {
    const script = await getScripts('collection', 'enableNFTStorage');

    return await userWalletService.sendTransaction(
      script
        .replaceAll('<NFT>', token.contractName)
        .replaceAll('<NFTAddress>', token.address)
        .replaceAll('<CollectionStoragePath>', token.path.storage)
        .replaceAll('<CollectionPublicType>', token.path.public)
        .replaceAll('<CollectionPublicPath>', token.path.public),
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
    const replacedScript = replaceNftKeywords(script, token);

    const result = await userWalletService.sendTransaction(replacedScript, [
      fcl.arg(childAddress, t.Address),
      fcl.arg(path, t.String),
      fcl.arg(amount, t.UFix64),
    ]);
    mixpanelTrack.track('ft_transfer', {
      from_address: (await this.getCurrentAddress()) || '',
      to_address: childAddress,
      amount: amount,
      ft_identifier: token.contractName,
      type: 'flow',
    });
    return result;
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
    // Validate the amount just to be safe
    if (!validateAmount(amount, token.decimals)) {
      throw new Error(`Invalid amount - ${amount}`);
    }

    const script = await getScripts('hybridCustody', 'sendChildFT');
    const replacedScript = replaceNftKeywords(script, token);

    const result = await userWalletService.sendTransaction(replacedScript, [
      fcl.arg(childAddress, t.Address),
      fcl.arg(receiver, t.Address),
      fcl.arg(path, t.String),
      fcl.arg(amount, t.UFix64),
    ]);
    mixpanelTrack.track('ft_transfer', {
      from_address: childAddress,
      to_address: receiver,
      amount: amount,
      ft_identifier: token.contractName,
      type: 'flow',
    });
    return result;
  };

  moveNFTfromChild = async (
    nftContractAddress: string,
    nftContractName: string,
    ids: number,
    token
  ): Promise<string> => {
    console.log('script is this ', nftContractAddress);

    const script = await getScripts('hybridCustody', 'transferChildNFT');
    const replacedScript = replaceNftKeywords(script, token);
    const txID = await userWalletService.sendTransaction(replacedScript, [
      fcl.arg(nftContractAddress, t.Address),
      fcl.arg(nftContractName, t.String),
      fcl.arg(ids, t.UInt64),
    ]);
    mixpanelTrack.track('nft_transfer', {
      tx_id: txID,
      from_address: nftContractAddress,
      to_address: (await this.getCurrentAddress()) || '',
      nft_identifier: token.contractName,
      from_type: 'flow',
      to_type: 'flow',
      isMove: true,
    });
    return txID;
  };

  sendNFTfromChild = async (
    linkedAddress: string,
    receiverAddress: string,
    nftContractName: string,
    ids: number,
    token
  ): Promise<string> => {
    const script = await getScripts('hybridCustody', 'sendChildNFT');
    const replacedScript = replaceNftKeywords(script, token);
    const txID = await userWalletService.sendTransaction(replacedScript, [
      fcl.arg(linkedAddress, t.Address),
      fcl.arg(receiverAddress, t.Address),
      fcl.arg(nftContractName, t.String),
      fcl.arg(ids, t.UInt64),
    ]);
    mixpanelTrack.track('nft_transfer', {
      tx_id: txID,
      from_address: linkedAddress,
      to_address: receiverAddress,
      nft_identifier: token.contractName,
      from_type: 'flow',
      to_type: 'flow',
      isMove: false,
    });
    return txID;
  };

  bridgeChildNFTToEvmAddress = async (
    linkedAddress: string,
    receiverAddress: string,
    nftContractName: string,
    id: number,
    token
  ): Promise<string> => {
    const script = await getScripts('hybridCustody', 'bridgeChildNFTToEvmAddress');
    const replacedScript = replaceNftKeywords(script, token);
    const txID = await userWalletService.sendTransaction(replacedScript, [
      fcl.arg(nftContractName, t.String),
      fcl.arg(linkedAddress, t.Address),
      fcl.arg(id, t.UInt64),
      fcl.arg(receiverAddress, t.String),
    ]);
    mixpanelTrack.track('nft_transfer', {
      tx_id: txID,
      from_address: linkedAddress,
      to_address: receiverAddress,
      nft_identifier: token.contractName,
      from_type: 'flow',
      to_type: 'flow',
      isMove: false,
    });
    return txID;
  };

  sendNFTtoChild = async (
    linkedAddress: string,
    path: string,
    ids: number,
    token
  ): Promise<string> => {
    const script = await getScripts('hybridCustody', 'transferNFTToChild');
    const replacedScript = replaceNftKeywords(script, token);
    const txID = await userWalletService.sendTransaction(replacedScript, [
      fcl.arg(linkedAddress, t.Address),
      fcl.arg(path, t.String),
      fcl.arg(ids, t.UInt64),
    ]);

    mixpanelTrack.track('nft_transfer', {
      tx_id: txID,
      from_address: linkedAddress,
      to_address: (await this.getCurrentAddress()) || '',
      nft_identifier: token.contractName,
      from_type: 'flow',
      to_type: 'flow',
      isMove: false,
    });
    return txID;
  };

  getChildAccountAllowTypes = async (parent: string, child: string) => {
    const script = await getScripts('hybridCustody', 'getChildAccountAllowTypes');
    const result = await fcl.query({
      cadence: script,
      args: (arg, t) => [arg(parent, t.Address), arg(child, t.Address)],
    });
    return result;
  };

  checkChildLinkedVault = async (parent: string, child: string, path: string): Promise<string> => {
    const script = await getScripts('hybridCustody', 'checkChildLinkedVaults');

    const result = await fcl.query({
      cadence: script,
      args: (arg, t) => [arg(parent, t.Address), arg(child, t.Address), fcl.arg(path, t.String)],
    });
    return result;
  };

  batchBridgeNftToEvm = async (flowIdentifier: string, ids: Array<number>): Promise<string> => {
    const shouldCoverBridgeFee = await openapiService.getFeatureFlag('cover_bridge_fee');
    const scriptName = shouldCoverBridgeFee
      ? 'batchBridgeNFTToEvmWithPayer'
      : 'batchBridgeNFTToEvmV2';
    const script = await getScripts('bridge', scriptName);

    const txID = await userWalletService.sendTransaction(
      script,
      [fcl.arg(flowIdentifier, t.String), fcl.arg(ids, t.Array(t.UInt64))],
      shouldCoverBridgeFee
    );
    mixpanelTrack.track('nft_transfer', {
      tx_id: txID,
      from_address: flowIdentifier,
      to_address: (await this.getCurrentAddress()) || '',
      nft_identifier: flowIdentifier,
      from_type: 'flow',
      to_type: 'flow',
      isMove: false,
    });
    return txID;
  };

  batchBridgeNftFromEvm = async (flowIdentifier: string, ids: Array<number>): Promise<string> => {
    const shouldCoverBridgeFee = await openapiService.getFeatureFlag('cover_bridge_fee');
    const scriptName = shouldCoverBridgeFee
      ? 'batchBridgeNFTFromEvmWithPayer'
      : 'batchBridgeNFTFromEvmV2';
    const script = await getScripts('bridge', scriptName);

    const txID = await userWalletService.sendTransaction(
      script,
      [fcl.arg(flowIdentifier, t.String), fcl.arg(ids, t.Array(t.UInt256))],
      shouldCoverBridgeFee
    );
    mixpanelTrack.track('nft_transfer', {
      tx_id: txID,
      from_address: flowIdentifier,
      to_address: (await this.getCurrentAddress()) || '',
      nft_identifier: flowIdentifier,
      from_type: 'flow',
      to_type: 'evm',
      isMove: false,
    });
    return txID;
  };

  batchTransferNFTToChild = async (
    childAddr: string,
    identifier: string,
    ids: Array<number>,
    token
  ): Promise<string> => {
    const script = await getScripts('hybridCustody', 'batchTransferNFTToChild');
    const replacedScript = replaceNftKeywords(script, token);

    const txID = await userWalletService.sendTransaction(replacedScript, [
      fcl.arg(childAddr, t.Address),
      fcl.arg(identifier, t.String),
      fcl.arg(ids, t.Array(t.UInt64)),
    ]);
    mixpanelTrack.track('nft_transfer', {
      tx_id: txID,
      from_address: childAddr,
      to_address: (await this.getCurrentAddress()) || '',
      nft_identifier: identifier,
      from_type: 'flow',
      to_type: 'flow',
      isMove: false,
    });
    return txID;
  };

  batchTransferChildNft = async (
    childAddr: string,
    identifier: string,
    ids: Array<number>,
    token
  ): Promise<string> => {
    const script = await getScripts('hybridCustody', 'batchTransferChildNFT');
    const replacedScript = replaceNftKeywords(script, token);

    const txID = await userWalletService.sendTransaction(replacedScript, [
      fcl.arg(childAddr, t.Address),
      fcl.arg(identifier, t.String),
      fcl.arg(ids, t.Array(t.UInt64)),
    ]);
    mixpanelTrack.track('nft_transfer', {
      tx_id: txID,
      from_address: childAddr,
      to_address: (await this.getCurrentAddress()) || '',
      nft_identifier: identifier,
      from_type: 'flow',
      to_type: 'flow',
      isMove: false,
    });
    return txID;
  };

  sendChildNFTToChild = async (
    childAddr: string,
    receiver: string,
    identifier: string,
    ids: Array<number>,
    token
  ): Promise<string> => {
    const script = await getScripts('hybridCustody', 'batchSendChildNFTToChild');
    const replacedScript = replaceNftKeywords(script, token);

    const txID = await userWalletService.sendTransaction(replacedScript, [
      fcl.arg(childAddr, t.Address),
      fcl.arg(receiver, t.Address),
      fcl.arg(identifier, t.String),
      fcl.arg(ids, t.Array(t.UInt64)),
    ]);
    mixpanelTrack.track('nft_transfer', {
      tx_id: txID,
      from_address: childAddr,
      to_address: (await this.getCurrentAddress()) || '',
      nft_identifier: identifier,
      from_type: 'flow',
      to_type: 'flow',
      isMove: false,
    });
    return txID;
  };

  batchBridgeChildNFTToEvm = async (
    childAddr: string,
    identifier: string,
    ids: Array<number>,
    token
  ): Promise<string> => {
    const script = await getScripts('hybridCustody', 'batchBridgeChildNFTToEvm');
    const replacedScript = replaceNftKeywords(script, token);
    const txID = await userWalletService.sendTransaction(replacedScript, [
      fcl.arg(identifier, t.String),
      fcl.arg(childAddr, t.Address),
      fcl.arg(ids, t.Array(t.UInt64)),
    ]);
    mixpanelTrack.track('nft_transfer', {
      tx_id: txID,
      from_address: childAddr,
      to_address: (await this.getCurrentAddress()) || '',
      nft_identifier: identifier,
      from_type: 'flow',
      to_type: 'evm',
      isMove: false,
    });
    return txID;
  };

  batchBridgeChildNFTFromEvm = async (
    childAddr: string,
    identifier: string,
    ids: Array<number>
  ): Promise<string> => {
    const script = await getScripts('hybridCustody', 'batchBridgeChildNFTFromEvm');

    const txID = await userWalletService.sendTransaction(script, [
      fcl.arg(identifier, t.String),
      fcl.arg(childAddr, t.Address),
      fcl.arg(ids, t.Array(t.UInt256)),
    ]);
    mixpanelTrack.track('nft_transfer', {
      tx_id: txID,
      from_address: childAddr,
      to_address: (await this.getCurrentAddress()) || '',
      nft_identifier: identifier,
      from_type: 'flow',
      to_type: 'evm',
      isMove: false,
    });
    return txID;
  };

  bridgeNftToEvmAddress = async (
    flowIdentifier: string,
    ids: number,
    contractEVMAddress: string
  ): Promise<string> => {
    const shouldCoverBridgeFee = await openapiService.getFeatureFlag('cover_bridge_fee');
    const scriptName = shouldCoverBridgeFee
      ? 'bridgeNFTToEvmAddressWithPayer'
      : 'bridgeNFTToEvmAddressV2';
    const script = await getScripts('bridge', scriptName);

    const gasLimit = 30000000;

    if (contractEVMAddress.startsWith('0x')) {
      contractEVMAddress = contractEVMAddress.substring(2);
    }

    const txID = await userWalletService.sendTransaction(
      script,
      [
        fcl.arg(flowIdentifier, t.String),
        fcl.arg(ids, t.UInt64),
        fcl.arg(contractEVMAddress, t.String),
      ],
      shouldCoverBridgeFee
    );
    mixpanelTrack.track('nft_transfer', {
      tx_id: txID,
      from_address: flowIdentifier,
      to_address: (await this.getCurrentAddress()) || '',
      nft_identifier: flowIdentifier,
      from_type: 'evm',
      to_type: 'evm',
      isMove: false,
    });
    return txID;
  };

  bridgeNftFromEvmToFlow = async (
    flowIdentifier: string,
    ids: number,
    receiver: string
  ): Promise<string> => {
    const shouldCoverBridgeFee = await openapiService.getFeatureFlag('cover_bridge_fee');
    const scriptName = shouldCoverBridgeFee
      ? 'bridgeNFTFromEvmToFlowWithPayer'
      : 'bridgeNFTFromEvmToFlowV3';
    const script = await getScripts('bridge', scriptName);

    const txID = await userWalletService.sendTransaction(
      script,
      [fcl.arg(flowIdentifier, t.String), fcl.arg(ids, t.UInt256), fcl.arg(receiver, t.Address)],
      shouldCoverBridgeFee
    );
    mixpanelTrack.track('nft_transfer', {
      tx_id: txID,
      from_address: flowIdentifier,
      to_address: (await this.getCurrentAddress()) || '',
      nft_identifier: flowIdentifier,
      from_type: 'flow',
      to_type: 'evm',
      isMove: false,
    });
    return txID;
  };

  getAssociatedFlowIdentifier = async (address: string): Promise<string> => {
    const script = await getScripts('bridge', 'getAssociatedFlowIdentifier');
    const result = await fcl.query({
      cadence: script,
      args: (arg, t) => [arg(address, t.String)],
    });
    return result;
  };

  sendNFT = async (recipient: string, id: any, token: any): Promise<string> => {
    await this.getNetwork();
    const script = await getScripts('collection', 'sendNFTV3');

    const txID = await userWalletService.sendTransaction(
      script
        .replaceAll('<NFT>', token.contractName)
        .replaceAll('<NFTAddress>', token.address)
        .replaceAll('<CollectionStoragePath>', token.path.storage)
        .replaceAll('<CollectionPublicPath>', token.path.public),
      [fcl.arg(recipient, t.Address), fcl.arg(parseInt(id), t.UInt64)]
    );
    mixpanelTrack.track('nft_transfer', {
      tx_id: txID,
      from_address: (await this.getCurrentAddress()) || '',
      to_address: recipient,
      nft_identifier: token.contractName,
      from_type: 'flow',
      to_type: 'flow',
      isMove: false,
    });
    return txID;
  };

  sendNBANFT = async (recipient: string, id: any, token: NFTModelV2): Promise<string> => {
    await this.getNetwork();
    const script = await getScripts('collection', 'sendNbaNFTV3');

    const txID = await userWalletService.sendTransaction(
      script
        .replaceAll('<NFT>', token.contractName)
        .replaceAll('<NFTAddress>', token.address)
        .replaceAll('<CollectionStoragePath>', token.path.storage)
        .replaceAll('<CollectionPublicPath>', token.path.public),
      [fcl.arg(recipient, t.Address), fcl.arg(parseInt(id), t.UInt64)]
    );
    mixpanelTrack.track('nft_transfer', {
      tx_id: txID,
      from_address: (await this.getCurrentAddress()) || '',
      to_address: recipient,
      nft_identifier: token.contractName,
      from_type: 'flow',
      to_type: 'flow',
      isMove: false,
    });
    return txID;
  };

  //transaction

  getTransactions = async (
    address: string,
    limit: number,
    offset: number,
    _expiry = 60000,
    forceRefresh = false
  ): Promise<{
    count: number;
    list: TransferItem[];
  }> => {
    const network = await this.getNetwork();
    const now = new Date();
    const expiry = transactionService.getExpiry();

    // Refresh if forced or expired
    if (forceRefresh || now.getTime() > expiry) {
      await this.refreshTransactions(address, limit, offset, _expiry);
    }

    const sealed = await transactionService.listTransactions(network);
    const pending = await transactionService.listPending(network);

    return {
      // NOTE: count is the total number of INDEXED transactions
      count: await transactionService.getCount(),
      list: pending?.length ? [...pending, ...sealed] : sealed,
    };
  };

  getPendingTx = async () => {
    const network = await this.getNetwork();
    const pending = await transactionService.listPending(network);
    return pending;
  };

  refreshTransactions = async (address: string, limit: number, offset: number, _expiry = 5000) => {
    const network = await this.getNetwork();
    const now = new Date();
    const exp = _expiry + now.getTime();
    transactionService.setExpiry(exp);
    const isChild = await this.getActiveWallet();
    let dataResult = {};
    let evmAddress;
    if (isEvmAccountType(isChild)) {
      if (!isValidEthereumAddress(address)) {
        evmAddress = await this.queryEvmAddress(address);
        if (!evmAddress!.startsWith('0x')) {
          evmAddress = '0x' + evmAddress;
        }
      } else {
        evmAddress = address;
      }
      const evmResult = await openapiService.getEVMTransfers(evmAddress!, '', limit);
      if (evmResult) {
        dataResult['transactions'] = evmResult.trxs;
        if (evmResult.next_page_params) {
          dataResult['total'] = evmResult.next_page_params.items_count;
        } else {
          dataResult['total'] = evmResult.trxs.length;
        }
      }
    } else {
      const res = await openapiService.getTransfers(address, '', limit);
      dataResult = res.data;
    }

    transactionService.setTransaction(dataResult, network);
  };

  signInWithMnemonic = async (
    mnemonic: string,
    replaceUser = true,
    derivationPath: string = FLOW_BIP44_PATH,
    passphrase: string = ''
  ) => {
    return userWalletService.signInWithMnemonic(mnemonic, replaceUser, derivationPath, passphrase);
  };

  signInWithPrivatekey = async (pk: string, replaceUser = true) => {
    return userWalletService.sigInWithPk(pk, replaceUser);
  };

  requestProxyToken = async () => {
    return proxyService.requestJwt();
  };

  signInV3 = async (mnemonic: string, accountKey: any, deviceInfo: any, replaceUser = true) => {
    return userWalletService.signInv3(mnemonic, accountKey, deviceInfo, replaceUser);
  };

  signMessage = async (message: string): Promise<string> => {
    return userWalletService.sign(message);
  };
  abortController = new AbortController();
  abort() {
    this.abortController.abort(); // Abort ongoing operations
    this.abortController = new AbortController(); // Create a new controller for subsequent operations
  }

  switchNetwork = async (network: string) => {
    await userWalletService.setNetwork(network);
    eventBus.emit('switchNetwork', network);

    // setup fcl for the new network
    await userWalletService.setupFcl();
    await this.refreshAll();

    // Reload everything
    await this.refreshWallets();

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (!tabs || tabs.length === 0) {
        console.log('No active tab found');
        return;
      }
      if (tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'FCW:NETWORK',
          network: network,
        });
      }
    });
  };

  checkNetwork = async () => {
    if (!this.isBooted() || userWalletService.isLocked()) {
      return;
    }
  };

  switchMonitor = async (monitor: string) => {
    await userWalletService.setMonitor(monitor);
  };

  getMonitor = (): string => {
    return userWalletService.getMonitor();
  };

  refreshAll = async () => {
    console.trace('refreshAll trace');
    console.log('refreshAll');
    // Clear the active wallet if any
    // If we don't do this, the user wallets will not be refreshed
    await this.loadMainAccounts();
    this.clearNFT();
    this.refreshAddressBook();
    this.refreshEvmWallets();
    await this.getCadenceScripts();
    const address = await this.getCurrentAddress();
    if (address) {
      this.refreshTransactions(address, 15, 0);
    }

    this.abort();
    await this.refreshCoinList(5000);
  };

  getNetwork = async (): Promise<string> => {
    return await userWalletService.getNetwork();
  };
  getEmulatorMode = async (): Promise<boolean> => {
    // Check feature flag first
    const enableEmulatorMode = await this.getFeatureFlag('emulator_mode');
    if (!enableEmulatorMode) {
      return false;
    }
    return await userWalletService.getEmulatorMode();
  };

  setEmulatorMode = async (mode: boolean) => {
    return await userWalletService.setEmulatorMode(mode);
  };

  clearChildAccount = () => {
    storage.remove('checkUserChildAccount');
  };

  getEvmEnabled = async (): Promise<boolean> => {
    // Get straight from the userWalletService as getEvmAddress() throws an error if the address is not valid
    const address = userWalletService.getEvmWallet();
    return !!address && isValidEthereumAddress(address);
  };

  refreshEvmWallets = () => {
    userWalletService.refreshEvm();
  };

  clearWallet = () => {
    userWalletService.clear();
  };

  getFlowscanUrl = async (): Promise<string> => {
    const network = await this.getNetwork();
    const isEvm = await this.getActiveWallet();
    let baseURL = 'https://www.flowscan.io';

    // Check if it's an EVM wallet and update the base URL
    if (isEvmAccountType(isEvm)) {
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
      (await fetch(`https://rest-${network}.onflow.org/v1/transaction_results/${txId}`)).json();
    const validate = (result) => result.status !== 'Sealed';
    return await this.poll(fetchReport, validate, 3000);
  };

  pollTransferList = async (address: string, txHash: string, maxAttempts = 5) => {
    let attempts = 0;
    const poll = async () => {
      if (attempts >= maxAttempts) {
        console.log('Max polling attempts reached');
        return;
      }

      const { list: newTransactions } = await this.getTransactions(address, 15, 0, 5000, true);
      // Copy the list as we're going to modify the original list

      const foundTx = newTransactions?.find((tx) => txHash.includes(tx.hash));
      if (foundTx && foundTx.indexed) {
        // Send a message to the UI to update the transfer list
        chrome.runtime.sendMessage({ msg: 'transferListUpdated' });
      } else {
        // All of the transactions have not been picked up by the indexer yet
        attempts++;
        setTimeout(poll, 5000); // Poll every 5 seconds
      }
    };

    await poll();
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
    let txHash = txId;
    try {
      chrome.storage.session.set({
        transactionPending: { txId, network, date: new Date() },
      });
      eventBus.emit('transactionPending');
      chrome.runtime.sendMessage({
        msg: 'transactionPending',
        network: network,
      });
      transactionService.setPending(txId, address, network, icon, title);

      // Listen to the transaction until it's sealed.
      // This will throw an error if there is an error with the transaction
      const txStatus = await fcl.tx(txId).onceExecuted();
      // Update the pending transaction with the transaction status
      this.refreshCoinList(6000);
      txHash = transactionService.updatePending(txId, network, txStatus);

      // Track the transaction result
      mixpanelTrack.track('transaction_result', {
        tx_id: txId,
        is_successful: true,
      });

      try {
        // Send a notification to the user only on success
        if (sendNotification) {
          const baseURL = await this.getFlowscanUrl();
          if (baseURL.includes('evm')) {
            // It's an EVM transaction
            // Look through the events in txStatus
            const evmEvent = txStatus.events.find(
              (event) => event.type.includes('EVM') && !!event.data?.hash
            );
            if (evmEvent) {
              const hashBytes = evmEvent.data.hash.map((byte) => parseInt(byte));
              const hash = '0x' + Buffer.from(hashBytes).toString('hex');
              // Link to the account page on EVM otherwise we'll have to look up the EVM tx
              notification.create(`${baseURL}/tx/${hash}`, title, body, icon);
            } else {
              const evmAddress = await this.getEvmAddress();

              // Link to the account page on EVM as we don't have a tx hash
              notification.create(`${baseURL}/address/${evmAddress}`, title, body, icon);
            }
          } else {
            // It's a Flow transaction
            notification.create(`${baseURL}/tx/${txId}`, title, body, icon);
          }
        }
      } catch (err: unknown) {
        // We don't want to throw an error if the notification fails
        console.error('listenTransaction notification error ', err);
      }
    } catch (err: unknown) {
      // An error has occurred while listening to the transaction
      let errorMessage = 'unknown error';
      let errorCode: number | undefined = undefined;

      if (err instanceof TransactionError) {
        errorCode = err.code;
        errorMessage = err.message;
      } else {
        if (err instanceof Error) {
          errorMessage = err.message;
        } else if (typeof err === 'string') {
          errorMessage = err;
        }
        // From fcl-core transaction-error.ts
        const ERROR_CODE_REGEX = /\[Error Code: (\d+)\]/;
        const match = errorMessage.match(ERROR_CODE_REGEX);
        errorCode = match ? parseInt(match[1], 10) : undefined;
      }

      console.warn({
        msg: 'transactionError',
        errorMessage,
        errorCode,
      });

      // Track the transaction error
      mixpanelTrack.track('transaction_result', {
        tx_id: txId,
        is_successful: false,
        error_message: errorMessage,
      });

      // Tell the UI that there was an error
      chrome.runtime.sendMessage({
        msg: 'transactionError',
        errorMessage,
        errorCode,
      });
    } finally {
      // Remove the pending transaction from the UI
      await chrome.storage.session.remove('transactionPending');

      // Message the UI that the transaction is done
      eventBus.emit('transactionDone');
      chrome.runtime.sendMessage({
        msg: 'transactionDone',
      });

      if (txHash) {
        // Start polling for transfer list updates
        await this.pollTransferList(address, txHash);
      }
    }
  };

  clearPending = async () => {
    const network = await this.getNetwork();
    transactionService.clearPending(network);
  };

  clearNFT = () => {
    nftService.clear();
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

  getSingleCollection = async (
    address: string,
    collectionId: string,
    offset = 0
  ): Promise<NFTCollectionData> => {
    const network = await this.getNetwork();
    const list = await nftService.getSingleCollection(network, collectionId, offset);
    if (!list) {
      return this.refreshSingleCollection(address, collectionId, offset);
    }
    return list;
  };

  refreshSingleCollection = async (
    address: string,
    collectionId: string,
    offset: number | null
  ): Promise<NFTCollectionData> => {
    offset = offset || 0;
    const network = await this.getNetwork();
    const data = await openapiService.nftCatalogCollectionList(
      address!,
      collectionId,
      50,
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

    nftService.setSingleCollection(data, collectionId, offset, network);
    return data;
  };

  getCollectionCache = async (address: string) => {
    const network = await this.getNetwork();
    const list = await nftService.getCollectionList(network);
    if (!list || list.length === 0) {
      return await this.refreshCollection(address);
    }
    // Sort by count, maintaining the new collection structure
    const sortedList = [...list].sort((a, b) => b.count - a.count);
    return sortedList;
  };

  refreshCollection = async (address: string) => {
    const network = await this.getNetwork();
    const data = await openapiService.nftCatalogCollections(address!, network);
    if (!data || !Array.isArray(data)) {
      return [];
    }
    // Sort by count, maintaining the new collection structure
    const sortedList = [...data].sort((a, b) => b.count - a.count);
    nftService.setCollectionList(sortedList, network);
    return sortedList;
  };

  getNftCatalog = async () => {
    const data = (await openapiService.nftCatalog()) ?? [];

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
        cadenceScrpts.network === network
      ) {
        return cadenceScrpts['data'];
      }

      // const { cadence, networks } = data;
      // const cadencev1 = (await openapiService.cadenceScripts(network)) ?? {};

      const cadenceScriptsV2 = (await openapiService.cadenceScriptsV2()) ?? {};
      // const { scripts, version } = cadenceScriptsV2;
      // const cadenceVersion = cadenceScriptsV2.version;
      const cadence = cadenceScriptsV2.scripts[network];

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

  reset = async () => {
    await keyringService.loadStore(undefined);
    keyringService.store.subscribe((value) => storage.set('keyringState', value));
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
    const data = await userInfoService.getCurrentUserInfo();
    const username = data.username;
    return googleDriveService.deleteUserBackup(username);
  };

  deleteUserBackup = async (username: string) => {
    return googleDriveService.deleteUserBackup(username);
  };

  hasCurrentUserBackup = async () => {
    const data = await userInfoService.getCurrentUserInfo();
    const username = data.username;
    return googleDriveService.hasUserBackup(username);
  };

  hasUserBackup = async (username: string) => {
    return googleDriveService.hasUserBackup(username);
  };

  syncBackup = async () => {
    const data = await userInfoService.getCurrentUserInfo();
    const username = data.username;
    const password = keyringService.password;
    const mnemonic = await this.getMnemonics(password || '');
    return this.uploadMnemonicToGoogleDrive(mnemonic, username, password);
  };

  uploadMnemonicToGoogleDrive = async (mnemonic, username, password) => {
    const isValidMnemonic = bip39.validateMnemonic(mnemonic);
    if (!isValidMnemonic) {
      throw new Error('Invalid mnemonic');
    }
    const app = getApp(process.env.NODE_ENV!);
    const user = await getAuth(app).currentUser;
    try {
      await googleDriveService.uploadMnemonicToGoogleDrive(mnemonic, username, user!.uid, password);
      mixpanelTrack.track('multi_backup_created', {
        address: (await this.getCurrentAddress()) || '',
        providers: ['GoogleDrive'],
      });
    } catch {
      mixpanelTrack.track('multi_backup_creation_failed', {
        address: (await this.getCurrentAddress()) || '',
        providers: ['GoogleDrive'],
      });
    }
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

  getBridgeFeePayerAddressAndKeyId = async () => {
    try {
      const config = await fetchConfig.remoteConfig();
      const network = await this.getNetwork();
      return config.bridgeFeePayer[network];
    } catch {
      const network = await this.getNetwork();
      return defaultConfig.bridgeFeePayer[network];
    }
  };

  getFeatureFlags = async (): Promise<FeatureFlags> => {
    return openapiService.getFeatureFlags();
  };

  getFeatureFlag = async (featureFlag: FeatureFlagKey): Promise<boolean> => {
    return openapiService.getFeatureFlag(featureFlag);
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

  getAccount = async (): Promise<FclAccount> => {
    const address = await this.getMainAddress();
    if (!address) {
      throw new Error('No address found');
    }
    const account = await fcl.account(address);
    return account;
  };

  getEmoji = async () => {
    return emoji.emojis;
  };

  setEmoji = async (emoji, type, index) => {
    const network = await this.getNetwork();

    if (isEvmAccountType(type)) {
      await userWalletService.setEvmEmoji(emoji);
    } else {
      await userWalletService.setWalletEmoji(emoji, network, index);
    }

    return emoji;
  };

  // Get the news from the server
  getNews = async () => {
    return await newsService.getNews();
  };
  markNewsAsDismissed = async (id: string) => {
    return await newsService.markAsDismissed(id);
  };

  markNewsAsRead = async (id: string): Promise<boolean> => {
    return await newsService.markAsRead(id);
  };

  markAllNewsAsRead = async () => {
    return await newsService.markAllAsRead();
  };

  getUnreadNewsCount = async () => {
    return newsService.getUnreadCount();
  };

  isNewsRead = (id: string) => {
    return newsService.isRead(id);
  };

  resetNews = async () => {
    return await newsService.clear();
  };

  // Check the storage status
  checkStorageStatus = async ({
    transferAmount,
    coin,
    movingBetweenEVMAndFlow,
  }: {
    transferAmount?: number; // amount in coins
    coin?: string; // coin name
    movingBetweenEVMAndFlow?: boolean; // are we moving between EVM and Flow?
  } = {}): Promise<EvaluateStorageResult> => {
    const address = await this.getCurrentAddress();
    const isFreeGasFeeEnabled = await this.allowLilicoPay();
    const result = await this.storageEvaluator.evaluateStorage(
      address!,
      transferAmount,
      coin,
      movingBetweenEVMAndFlow,
      isFreeGasFeeEnabled
    );
    return result;
  };

  // Tracking stuff

  trackOnRampClicked = async (source: 'moonpay' | 'coinbase') => {
    mixpanelTrack.track('on_ramp_clicked', {
      source: source,
    });
  };

  // This is called from the front end, we should find a better way to track this event
  trackAccountRecovered = async () => {
    mixpanelTrack.track('account_recovered', {
      address: (await this.getCurrentAddress()) || '',
      mechanism: 'Multi-Backup',
      methods: [],
    });
  };

  trackPageView = async (pathname: string) => {
    mixpanelTrack.trackPageView(pathname);
  };

  trackTime = async (eventName: keyof TrackingEvents) => {
    mixpanelTrack.time(eventName);
  };

  decodeEvmCall = async (callData: string, address = '') => {
    return await openapiService.decodeEvmCall(callData, address);
  };

  // Todo - I don't think this works as expected in any case
  saveIndex = async (username = '', userId = null) => {
    const loggedInAccounts: LoggedInAccount[] = (await storage.get('loggedInAccounts')) || [];
    let currentindex = 0;

    if (!loggedInAccounts || loggedInAccounts.length === 0) {
      currentindex = 0;
    } else {
      const index = loggedInAccounts.findIndex((account) => account.username === username);
      currentindex = index !== -1 ? index : loggedInAccounts.length;
    }

    const path = (await storage.get('temp_path')) || "m/44'/539'/0'/0/0";
    const passphrase = (await storage.get('temp_phrase')) || '';
    await storage.set(`user${currentindex}_path`, path);
    await storage.set(`user${currentindex}_phrase`, passphrase);
    await storage.set(`user${userId}_path`, path);
    await storage.set(`user${userId}_phrase`, passphrase);
    await storage.remove(`temp_path`);
    await storage.remove(`temp_phrase`);
    // Note that currentAccountIndex is only used in keyring for old accounts that don't have an id stored in the keyring
    // currentId always takes precedence
    await storage.set('currentAccountIndex', currentindex);
    if (userId) {
      await storage.set('currentId', userId);
    }
  };

  refreshEvmNftIds = async (address: string) => {
    if (!isValidEthereumAddress(address)) {
      throw new Error('Invalid Ethereum address');
    }
    const network = await this.getNetwork();
    const result = await openapiService.EvmNFTID(address);
    await evmNftService.setNftIds(result, network);
    return result;
  };

  getEvmNftId = async (address: string) => {
    if (!isValidEthereumAddress(address)) {
      throw new Error('Invalid Ethereum address');
    }
    const network = await this.getNetwork();
    const cacheData = await evmNftService.getNftIds(network);
    if (cacheData) {
      return cacheData;
    }
    return this.refreshEvmNftIds(address);
  };

  refreshEvmNftCollectionList = async (
    address: string,
    collectionIdentifier: string,
    limit = 50,
    offset = 0
  ) => {
    if (!isValidEthereumAddress(address)) {
      throw new Error('Invalid Ethereum address');
    }
    const network = await this.getNetwork();
    const result = await openapiService.EvmNFTcollectionList(
      address,
      collectionIdentifier,
      limit,
      offset
    );
    await evmNftService.setSingleCollection(result, collectionIdentifier, offset, network);
    return result;
  };

  getEvmNftCollectionList = async (
    address: string,
    collectionIdentifier: string,
    limit = 50,
    offset = 0
  ) => {
    if (!isValidEthereumAddress(address)) {
      throw new Error('Invalid Ethereum address');
    }
    const network = await this.getNetwork();
    const cacheData = await evmNftService.getSingleCollection(
      network,
      collectionIdentifier,
      offset
    );
    if (cacheData) {
      return cacheData;
    }
    return this.refreshEvmNftCollectionList(address, collectionIdentifier, limit, offset);
  };

  clearEvmNFTList = async () => {
    await evmNftService.clearEvmNfts();
  };
}

export default new WalletController();
